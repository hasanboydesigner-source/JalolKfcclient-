import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import Product from './models/Product.js';
import Order from './models/Order.js';
import OrderCounter from './models/OrderCounter.js';
import Setting from './models/Setting.js';
import SettingAuditLog from './models/SettingAuditLog.js';
import User from './models/User.js';
import Table from './models/Table.js';
import upload from './middleware/upload.js';
import { authLimiter, signToken, requireAuth, requireRole } from './middleware/auth.js';
import { 
  DEFAULT_SETTINGS, 
  settingsSchema, 
  sanitizePublicSettings, 
  maskSensitiveSettings 
} from '../shared/settingsDefaults.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Socket.io Setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
  }
});

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Don't break inline media or dev hot-reloads
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
}));
app.use(express.json({ limit: '2mb' }));

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  socket.on('disconnect', () => console.log('🔌 Client disconnected:', socket.id));
});

// Helper: Get or Initialize Singleton Settings
export async function getOrCreateSettings() {
  let settings = await Setting.findOne();
  if (!settings) {
    settings = await Setting.create(DEFAULT_SETTINGS);
    console.log('🛡️ Default settings initialized.');
  }
  return settings;
}

// Helper: Generate Atomic Sequential Order Number
async function generateOrderNumber(settings) {
  const timezone = settings.localization?.timezone || 'Asia/Tashkent';
  const prefix = settings.orders?.orderNumberPrefix || '#';
  const padding = settings.orders?.orderNumberPadding || 3;
  const dailyReset = settings.orders?.dailyReset !== false;

  // Format today's date in target business timezone
  const now = new Date();
  const dateStr = dailyReset 
    ? new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now) // YYYY-MM-DD
    : 'ALL_TIME';

  const counter = await OrderCounter.findOneAndUpdate(
    { date: dateStr },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const seqStr = String(counter.seq).padStart(padding, '0');
  return `${prefix}${seqStr}`;
}

// Helper: Seed default restaurant tables if collection is empty
export async function initializeDefaultTables(count = 20) {
  try {
    const existingCount = await Table.countDocuments();
    if (existingCount === 0) {
      const defaultTables = [];
      for (let i = 1; i <= count; i++) {
        let zone = 'Asosiy zal';
        let capacity = 4;
        if (i > 16) {
          zone = 'VIP';
          capacity = 8;
        } else if (i > 12) {
          zone = 'Terrasa';
          capacity = 4;
        }
        defaultTables.push({
          tableNumber: String(i).padStart(2, '0'),
          name: `Stol ${i}`,
          zone,
          capacity,
          status: 'FREE'
        });
      }
      await Table.insertMany(defaultTables);
      console.log(`🪑 Initialized ${defaultTables.length} default restaurant tables.`);
    }
  } catch (err) {
    console.error('Error seeding default tables:', err);
  }
}

// MongoDB Connection & DB Seeding
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/restaurant_pos';

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    
    // Initialize Settings Singleton
    const settings = await getOrCreateSettings();

    // Initialize Default Tables
    const tableTarget = settings.orders?.tableCount || 20;
    await initializeDefaultTables(tableTarget);

    // Initialize default users if empty
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      const adminHash = await bcrypt.hash('2024', 10);
      const sellerHash = await bcrypt.hash('1111', 10);
      await User.insertMany([
        { name: 'Administrator', passcode: adminHash, role: 'admin' },
        { name: 'Sotuvchi #042', passcode: sellerHash, role: 'seller' }
      ]);
      console.log('🛡️ Default users (Admin/Seller) initialized with hashed PINs.');
    }
  })
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Telegram Notification Helper
const sendTelegramNotification = async (order, settings) => {
  const telegramConfig = settings.notifications;
  const token = telegramConfig?.telegramToken || process.env.TELEGRAM_TOKEN;
  const chatId = telegramConfig?.telegramChatId || process.env.TELEGRAM_CHAT_ID;

  if (!telegramConfig?.telegramEnabled && (!process.env.TELEGRAM_TOKEN || !process.env.TELEGRAM_CHAT_ID)) {
    return;
  }
  if (!token || !chatId || chatId === 'YOUR_CHAT_ID_HERE') {
    return;
  }

  const timezone = settings.localization?.timezone || 'Asia/Tashkent';
  const currencySymbol = settings.localization?.currencySymbol || "so'm";
  const businessName = settings.business?.name || 'RESTORAN';

  const date = new Intl.DateTimeFormat('uz-UZ', { 
    timeZone: timezone,
    hour: '2-digit', 
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  }).format(new Date(order.createdAt || Date.now()));

  let message = `━━━━━━━━━━━━━━━━━━━━\n`;
  if (order.source === 'Customer') {
    message += `🔔 <b>MIJOZ BUYURTMASI - STOL #${order.tableNumber || '?'}</b> 🔔\n`;
  } else {
    message += `🍔 <b>${businessName.toUpperCase()} - YANGI BUYURTMA</b> 🍔\n`;
  }
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  message += `🆔 <b>ID:</b> <code>${order.orderNumber || '#' + order._id.toString().slice(-4).toUpperCase()}</code>\n`;
  message += `⏰ <b>Vaqt:</b> <code>${date}</code>\n`;
  message += `💳 <b>To'lov:</b> <code>${order.paymentMethod}</code>\n`;
  message += `📍 <b>Turi:</b> <code>${order.orderType}</code>\n\n`;
  
  message += `📦 <b>MAXSULOTLAR:</b>\n`;
  message += `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n`;

  order.items.forEach(item => {
    message += `• <b>${item.name}</b>\n`;
    message += `  └─ <code>${item.qty} dona x ${item.price.toLocaleString()} ${currencySymbol}</code>\n`;
  });

  message += `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n\n`;
  message += `💰 <b>JAMI TO'LOV:</b>\n`;
  message += `💲 <code><b>${order.total.toLocaleString()} ${currencySymbol}</b></code>\n\n`;
  message += `✅ <i>Tizim orqali qabul qilindi</i>`;

  try {
    if (telegramConfig?.telegramIncludeImage !== false && order.items.length > 0 && order.items[0].image) {
      await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, {
        chat_id: chatId,
        photo: order.items[0].image,
        caption: message,
        parse_mode: 'HTML'
      }, { timeout: 8000 });
    } else {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML'
      }, { timeout: 8000 });
    }
  } catch (err) {
    console.error('❌ Telegram Notification Error:', err.response?.data?.description || err.message);
  }
};

// -------------------------------------------------------------
// 1. HEALTH & SYSTEM ROUTES
// -------------------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    dbConnected: mongoose.connection.readyState === 1
  });
});

app.get('/ping', (req, res) => res.send('pong'));

// -------------------------------------------------------------
// 2. AUTHENTICATION ROUTES (Strictly Validated Against NoSQL Injection)
// -------------------------------------------------------------
app.get('/api/auth/cashiers', async (req, res) => {
  try {
    const users = await User.find({ active: true }, 'name role avatar').lean();
    if (users && users.length > 0) {
      return res.json(users);
    }
    // Fallback if no users in collection yet
    res.json([
      { _id: 'admin', name: 'Administrator', role: 'admin' },
      { _id: 'seller', name: 'Kassir', role: 'seller' }
    ]);
  } catch (err) {
    console.error('Error fetching cashiers:', err);
    res.json([
      { _id: 'admin', name: 'Administrator', role: 'admin' },
      { _id: 'seller', name: 'Kassir', role: 'seller' }
    ]);
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const loginSchema = z.object({
      pin: z.string().min(4).max(8)
    });
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'PIN-kod noto‘g‘ri formatda (4-8 ta raqam bo‘lishi lozim)' });
    }
    const { pin } = parsed.data;

    // Search active users
    const users = await User.find({ active: true });
    let matchedUser = null;

    for (const user of users) {
      const isMatch = await user.comparePasscode(pin);
      if (isMatch) {
        matchedUser = user;
        break;
      }
    }

    // Fallback migration check for legacy settings passcode
    if (!matchedUser) {
      const settings = await Setting.findOne();
      if (settings && settings.passcode === pin) {
        matchedUser = {
          _id: 'legacy-admin',
          name: 'Administrator',
          role: 'admin',
          avatar: ''
        };
      }
    }

    if (!matchedUser) {
      return res.status(401).json({ success: false, message: 'Noto‘g‘ri PIN-kod' });
    }

    const token = signToken(matchedUser);

    res.json({
      success: true,
      token,
      user: {
        id: matchedUser._id,
        name: matchedUser.name,
        role: matchedUser.role,
        avatar: matchedUser.avatar
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server xatoligi' });
  }
});

// Update Passcode (Requires oldPin verification)
app.put('/api/auth/passcode', async (req, res) => {
  try {
    const passcodeSchema = z.object({
      oldPin: z.string().min(4).max(8),
      newPasscode: z.string().min(4).max(8),
      role: z.enum(['admin', 'seller']).default('admin')
    });

    const parsed = passcodeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, message: 'Parol formati noto‘g‘ri (4-8 ta belgi bo‘lishi lozim)' });
    }

    const { oldPin, newPasscode, role } = parsed.data;

    // Find the user to update
    const user = await User.findOne({ role });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    }

    const isOldValid = await user.comparePasscode(oldPin);
    if (!isOldValid) {
      return res.status(401).json({ success: false, message: 'Eski parol noto‘g‘ri kiritildi' });
    }

    // Update with new bcrypt hash
    user.passcode = await bcrypt.hash(newPasscode, 10);
    await user.save();

    // Also update legacy settings field if admin
    if (role === 'admin') {
      await Setting.findOneAndUpdate({}, { passcode: newPasscode });
    }

    res.json({ success: true, message: 'Parol muvaffaqiyatli yangilandi' });
  } catch (err) {
    console.error('Passcode update error:', err);
    res.status(500).json({ success: false, message: 'Server xatoligi' });
  }
});

// -------------------------------------------------------------
// 3. SETTINGS ROUTES (Public Bootstrapping & Protected Admin API)
// -------------------------------------------------------------

// Public Settings: For POS, Kiosk, Status Screen (Strictly Sanitized - Zero Secrets)
app.get('/api/settings/public', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(sanitizePublicSettings(settings));
  } catch (err) {
    console.error('GET /api/settings/public error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Full Settings: For Admin Settings View (Masked Secrets)
app.get('/api/settings', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json(maskSensitiveSettings(settings));
  } catch (err) {
    console.error('GET /api/settings error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Update Settings Section
app.patch('/api/settings/:section', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { section } = req.params;
    const settings = await getOrCreateSettings();

    if (!DEFAULT_SETTINGS[section]) {
      return res.status(400).json({ success: false, message: `Noma'lum sozlamalar bo'limi: ${section}` });
    }

    const sectionSchema = settingsSchema.shape[section];
    if (!sectionSchema) {
      return res.status(400).json({ success: false, message: `Sxema topilmadi: ${section}` });
    }

    // Handle sensitive telegram token update
    const updateData = { ...req.body };
    if (section === 'notifications' && updateData.telegramToken === '••••••••') {
      delete updateData.telegramToken; // Keep existing token if unchanged
    }

    const validated = sectionSchema.parse(updateData);
    const previousValues = settings[section] ? JSON.parse(JSON.stringify(settings[section])) : {};

    // Apply updates
    if (Array.isArray(validated)) {
      settings[section] = validated;
    } else {
      settings[section] = { ...previousValues, ...validated };
    }
    settings.updatedBy = req.user?.name || 'admin';
    await settings.save();

    // Log to Audit Trail
    await SettingAuditLog.create({
      section,
      changedBy: req.user?.name || 'admin',
      previousValues,
      newValues: validated
    });

    // Realtime broadcast to all open screens
    io.emit('settingsUpdated', sanitizePublicSettings(settings));

    res.json({
      success: true,
      message: 'Sozlamalar saqlandi',
      settings: maskSensitiveSettings(settings)
    });
  } catch (err) {
    console.error(`PATCH /api/settings/${req.params.section} error:`, err);
    res.status(400).json({ success: false, message: err.message });
  }
});

// Test Telegram Integration Action
app.post('/api/settings/test-telegram', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { token, chatId } = req.body;
    const settings = await getOrCreateSettings();
    const effectiveToken = (token && !token.includes('••••')) ? token : settings.notifications?.telegramToken;
    const effectiveChatId = chatId || settings.notifications?.telegramChatId;

    if (!effectiveToken || !effectiveChatId) {
      return res.status(400).json({ success: false, message: 'Bot Token va Chat ID kiritilishi shart' });
    }

    const testMsg = `🧪 <b>TEST XABARI</b>\n\n✅ <b>${settings.business?.name || 'POS Tizimi'}</b> Telegram bildirishnomalari muvaffaqiyatli ulandi!`;

    await axios.post(`https://api.telegram.org/bot${effectiveToken}/sendMessage`, {
      chat_id: effectiveChatId,
      text: testMsg,
      parse_mode: 'HTML'
    }, { timeout: 8000 });

    res.json({ success: true, message: 'Telegramga sinov xabari yuborildi!' });
  } catch (err) {
    res.status(400).json({ 
      success: false, 
      message: err.response?.data?.description || err.message || 'Telegramga ulanishda xatolik' 
    });
  }
});

// Database Maintenance & Selective Cleanup (Admin-only with PIN Verification)
app.post('/api/settings/database-cleanup', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const cleanupSchema = z.object({
      category: z.enum(['orders', 'tables', 'products', 'audit_logs', 'all_data']),
      adminPin: z.string().min(4).max(8)
    });

    const parsed = cleanupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Noto‘g‘ri ma’lumotlar yuborildi: Kategoriya va PIN-kod (4-8 ta belgi) talab qilinadi' 
      });
    }

    const { category, adminPin } = parsed.data;

    // Verify Admin PIN
    let isAdminValid = false;
    if (req.user && req.user.id) {
      const adminUser = await User.findById(req.user.id);
      if (adminUser) {
        isAdminValid = await adminUser.comparePasscode(adminPin);
      }
    }

    // Check all active admin users if req.user.id didn't match (e.g. if token was issued before PIN update)
    if (!isAdminValid) {
      const adminUsers = await User.find({ role: 'admin', active: true });
      for (const u of adminUsers) {
        if (await u.comparePasscode(adminPin)) {
          isAdminValid = true;
          break;
        }
      }
    }

    // Fallback migration check for legacy settings passcode
    if (!isAdminValid) {
      const settings = await Setting.findOne();
      if (settings && settings.passcode === adminPin) {
        isAdminValid = true;
      }
    }

    if (!isAdminValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Xavfsizlik xatosi: Administrator PIN-kodi noto‘g‘ri kiritildi!' 
      });
    }

    let resultMsg = '';

    if (category === 'orders') {
      const deletedOrders = await Order.deleteMany({});
      await OrderCounter.deleteMany({});
      await Table.updateMany({}, {
        $set: {
          status: 'FREE',
          currentOrderId: null,
          currentOrderNumber: null,
          currentTotal: 0,
          itemCount: 0,
          openedAt: null
        }
      });
      io.emit('order:refresh');
      io.emit('tables:updated');
      resultMsg = `Barcha buyurtmalar tarixi (${deletedOrders.deletedCount} ta) va kassa hisobotlari muvaffaqiyatli tozalandi. Stollar bo‘shatildi.`;
    } else if (category === 'tables') {
      await Table.updateMany({}, {
        $set: {
          status: 'FREE',
          currentOrderId: null,
          currentOrderNumber: null,
          currentTotal: 0,
          itemCount: 0,
          openedAt: null
        }
      });
      io.emit('tables:updated');
      resultMsg = 'Barcha stollar holati tozalandi (Bo‘sh holatga o‘tkazildi).';
    } else if (category === 'products') {
      const deletedProds = await Product.deleteMany({});
      io.emit('products:refresh');
      resultMsg = `Mahsulotlar katalogi tozalandi (${deletedProds.deletedCount} ta taom o‘chirildi).`;
    } else if (category === 'audit_logs') {
      const deletedLogs = await SettingAuditLog.deleteMany({});
      resultMsg = `Tizim o‘zgarishlar va audit jurnali tozalandi (${deletedLogs.deletedCount} ta yozuv).`;
    } else if (category === 'all_data') {
      const deletedOrders = await Order.deleteMany({});
      await OrderCounter.deleteMany({});
      const deletedProds = await Product.deleteMany({});
      await Table.updateMany({}, {
        $set: {
          status: 'FREE',
          currentOrderId: null,
          currentOrderNumber: null,
          currentTotal: 0,
          itemCount: 0,
          openedAt: null
        }
      });
      await SettingAuditLog.deleteMany({});
      io.emit('order:refresh');
      io.emit('tables:updated');
      io.emit('products:refresh');
      resultMsg = `Barcha operatsion ma’lumotlar to‘liq tozalandi (Zavod holati): ${deletedOrders.deletedCount} ta buyurtma, ${deletedProds.deletedCount} ta mahsulot o‘chirildi va barcha stollar bo‘shatildi.`;
    }

    // Log the cleanup event
    await SettingAuditLog.create({
      section: 'database_cleanup',
      changedBy: req.user?.name || 'admin',
      previousValues: { category },
      newValues: { status: 'CLEARED', timestamp: new Date() }
    });

    res.json({
      success: true,
      category,
      message: resultMsg
    });
  } catch (err) {
    console.error('POST /api/settings/database-cleanup Error:', err);
    res.status(500).json({ success: false, message: 'Ma’lumotlar bazasini tozalashda xatolik: ' + err.message });
  }
});

// -------------------------------------------------------------
// 4. PRODUCTS MANAGEMENT (CRUD)
// -------------------------------------------------------------
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('GET /api/products Error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/products', requireAuth, requireRole(['admin']), upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, desc, tag, unit, discount } = req.body;
    if (!name || !price || !category) {
      return res.status(400).json({ message: 'Nomi, narxi va kategoriyasi to‘ldirilishi shart' });
    }

    const newProduct = new Product({
      name,
      price: Number(price),
      category,
      desc,
      tag: tag || 'Standart',
      unit: unit || 'dona',
      discount,
      image: req.file ? req.file.path : '/images/burger1.png'
    });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error('POST /api/products Error:', err);
    res.status(400).json({ message: err.message });
  }
});

app.put('/api/products/:id', requireAuth, requireRole(['admin']), upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (updateData.price) updateData.price = Number(updateData.price);
    if (req.file) updateData.image = req.file.path;

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

app.delete('/api/products/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Mahsulot muvaffaqiyatli o‘chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// 4.5. RESTAURANT TABLES & DINE-IN MANAGEMENT
// -------------------------------------------------------------

// Get All Tables (Self-Healing Active Order Reconciliation)
app.get('/api/tables', async (req, res) => {
  try {
    let tables = await Table.find().sort({ zone: 1, tableNumber: 1 });
    if (!tables || tables.length === 0) {
      await initializeDefaultTables(20);
      tables = await Table.find().sort({ zone: 1, tableNumber: 1 });
    }

    // Senior Resiliency: Check and self-heal any occupied tables whose orders finished
    const populatedTables = await Promise.all(tables.map(async (table) => {
      const tableObj = table.toObject();
      if (table.currentOrderId) {
        const order = await Order.findById(table.currentOrderId);
        if (!order || order.status === 'Completed' || order.status === 'Cancelled') {
          // Reconcile stuck table state
          table.status = 'FREE';
          table.currentOrderId = null;
          table.currentOrderNumber = null;
          table.currentTotal = 0;
          table.itemCount = 0;
          table.openedAt = null;
          table.occupiedBy = null;
          await table.save();
          tableObj.status = 'FREE';
          tableObj.currentOrderId = null;
          tableObj.currentOrderNumber = null;
          tableObj.currentTotal = 0;
          tableObj.itemCount = 0;
          tableObj.openedAt = null;
          tableObj.occupiedBy = null;
          tableObj.currentOrder = null;
        } else {
          tableObj.currentOrder = {
            _id: order._id,
            orderNumber: order.orderNumber,
            items: order.items,
            subtotal: order.subtotal,
            tax: order.tax,
            total: order.total,
            status: order.status,
            createdAt: order.createdAt
          };
        }
      }
      return tableObj;
    }));

    res.json(populatedTables);
  } catch (err) {
    console.error('GET /api/tables Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Create Table (Admin)
app.post('/api/tables', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { tableNumber, name, zone, capacity } = req.body;
    if (!tableNumber) {
      return res.status(400).json({ message: 'Stol raqami kiritilishi shart' });
    }

    const existing = await Table.findOne({ tableNumber: String(tableNumber).trim() });
    if (existing) {
      return res.status(400).json({ message: `${tableNumber}-raqamli stol allaqachon mavjud` });
    }

    const newTable = new Table({
      tableNumber: String(tableNumber).trim(),
      name: name || `Stol ${tableNumber}`,
      zone: zone || 'Asosiy zal',
      capacity: Number(capacity) || 4,
      status: 'FREE'
    });

    const saved = await newTable.save();
    io.emit('tableCreated', saved);
    io.emit('tablesRefreshed');
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update Table (Admin)
app.put('/api/tables/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { tableNumber, name, zone, capacity, notes } = req.body;
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Stol topilmadi' });
    }

    if (tableNumber && tableNumber !== table.tableNumber) {
      const conflict = await Table.findOne({ tableNumber: String(tableNumber).trim(), _id: { $ne: table._id } });
      if (conflict) {
        return res.status(400).json({ message: `${tableNumber}-raqamli boshqa stol mavjud` });
      }
      table.tableNumber = String(tableNumber).trim();
    }

    if (name !== undefined) table.name = name;
    if (zone !== undefined) table.zone = zone;
    if (capacity !== undefined) table.capacity = Number(capacity);
    if (notes !== undefined) table.notes = notes;

    const updated = await table.save();
    io.emit('tableUpdated', updated);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete Table (Admin - Only if Free)
app.delete('/api/tables/:id', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Stol topilmadi' });
    }
    if (table.status !== 'FREE') {
      return res.status(400).json({ message: 'Band yoki to‘lov kutilayotgan stolni o‘chirib bo‘lmaydi' });
    }

    await Table.findByIdAndDelete(req.params.id);
    io.emit('tableDeleted', { id: req.params.id });
    io.emit('tablesRefreshed');
    res.json({ message: 'Stol muvaffaqiyatli o‘chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Occupy / Open Table Session
app.post('/api/tables/:id/occupy', async (req, res) => {
  try {
    const { guestCount, occupiedBy, notes } = req.body;
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Stol topilmadi' });
    }

    table.status = 'OCCUPIED';
    table.openedAt = new Date();
    table.guestCount = Number(guestCount) || 1;
    table.occupiedBy = occupiedBy || req.user?.name || 'Administrator';
    if (notes) table.notes = notes;

    const saved = await table.save();
    io.emit('tableUpdated', saved);
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Print Pre-Bill (Hisob so'raldi / BILL_PRINTED)
app.post('/api/tables/:id/bill', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Stol topilmadi' });
    }

    table.status = 'BILL_PRINTED';
    const saved = await table.save();
    io.emit('tableUpdated', saved);
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Clear / Free Table (e.g. manual reset)
app.post('/api/tables/:id/clear', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Stol topilmadi' });
    }

    table.status = 'FREE';
    table.currentOrderId = null;
    table.currentOrderNumber = null;
    table.currentTotal = 0;
    table.itemCount = 0;
    table.openedAt = null;
    table.occupiedBy = null;
    table.notes = '';

    const saved = await table.save();
    io.emit('tableUpdated', saved);
    io.emit('tablesRefreshed');
    res.json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Transfer Table (Stolni boshqa bo'sh stolga ko'chirish)
app.post('/api/tables/:id/transfer', async (req, res) => {
  try {
    const { targetTableId, targetTableNumber } = req.body;
    const sourceTable = await Table.findById(req.params.id);
    if (!sourceTable) {
      return res.status(404).json({ message: 'Manba stol topilmadi' });
    }

    let targetTable = null;
    if (targetTableId) {
      targetTable = await Table.findById(targetTableId);
    } else if (targetTableNumber) {
      targetTable = await Table.findOne({ tableNumber: String(targetTableNumber).trim() });
    }

    if (!targetTable) {
      return res.status(404).json({ message: 'Ko‘chiriladigan yangi stol topilmadi' });
    }

    if (String(sourceTable._id) === String(targetTable._id)) {
      return res.status(400).json({ message: 'Stolni o‘ziga ko‘chirib bo‘lmaydi' });
    }

    if (targetTable.status !== 'FREE') {
      return res.status(400).json({ message: `${targetTable.name || targetTable.tableNumber}-stol bo‘sh emas` });
    }

    // Migrate session to target table
    targetTable.status = sourceTable.status === 'BILL_PRINTED' ? 'BILL_PRINTED' : 'OCCUPIED';
    targetTable.currentOrderId = sourceTable.currentOrderId;
    targetTable.currentOrderNumber = sourceTable.currentOrderNumber;
    targetTable.currentTotal = sourceTable.currentTotal;
    targetTable.itemCount = sourceTable.itemCount;
    targetTable.openedAt = sourceTable.openedAt || new Date();
    targetTable.occupiedBy = sourceTable.occupiedBy;
    targetTable.guestCount = sourceTable.guestCount;
    targetTable.notes = sourceTable.notes;

    // Reset source table
    sourceTable.status = 'FREE';
    sourceTable.currentOrderId = null;
    sourceTable.currentOrderNumber = null;
    sourceTable.currentTotal = 0;
    sourceTable.itemCount = 0;
    sourceTable.openedAt = null;
    sourceTable.occupiedBy = null;
    sourceTable.notes = '';

    // Update order reference if exists
    if (targetTable.currentOrderId) {
      await Order.findByIdAndUpdate(targetTable.currentOrderId, {
        tableNumber: targetTable.tableNumber
      });
    }

    await Promise.all([sourceTable.save(), targetTable.save()]);

    io.emit('tablesRefreshed');
    res.json({
      success: true,
      message: `Buyurtma ${sourceTable.tableNumber}-stoldan ${targetTable.tableNumber}-stolga ko‘chirildi`,
      sourceTable,
      targetTable
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Append Items to Active Table Order (Senior Dine-In Workflow)
app.post('/api/tables/:id/append-items', async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Savatchada qo‘shiladigan mahsulotlar yo‘q' });
    }

    const table = await Table.findById(req.params.id);
    if (!table || !table.currentOrderId) {
      return res.status(400).json({ message: 'Ushbu stolda faol buyurtma topilmadi' });
    }

    const order = await Order.findById(table.currentOrderId);
    if (!order || order.status === 'Completed' || order.status === 'Cancelled') {
      return res.status(400).json({ message: 'Buyurtma allaqachon yopilgan' });
    }

    // Verify products
    const productIds = items.map(item => item.productId).filter(Boolean);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map(p => [String(p._id), p]));

    let additionalSubtotal = 0;
    const newItems = items.map(item => {
      const dbProd = productMap.get(String(item.productId));
      const unitPrice = dbProd ? dbProd.price : Number(item.price || 0);
      const qty = Math.max(1, parseInt(item.qty, 10) || 1);
      additionalSubtotal += (unitPrice * qty);

      return {
        productId: item.productId,
        name: dbProd ? dbProd.name : item.name,
        price: unitPrice,
        qty: qty,
        unit: item.unit || (dbProd ? dbProd.unit : 'dona'),
        tag: item.tag || (dbProd ? dbProd.tag : ''),
        image: dbProd ? dbProd.image : item.image
      };
    });

    const settings = await getOrCreateSettings();
    const taxRate = settings.pricing?.taxEnabled ? (settings.pricing.taxRate || 0) : 0;

    // Senior Clean Item Merging: Combine identical dishes or append new
    for (const newItem of newItems) {
      const existingMatch = order.items.find(it => 
        String(it.productId) === String(newItem.productId) && 
        String(it.tag || '') === String(newItem.tag || '') && 
        Number(it.price) === Number(newItem.price)
      );
      if (existingMatch) {
        existingMatch.qty = (Number(existingMatch.qty) || 0) + Number(newItem.qty);
      } else {
        order.items.push(newItem);
      }
    }

    order.subtotal += additionalSubtotal;
    order.tax = Math.round(order.subtotal * (taxRate / 100));
    order.total = order.subtotal + order.tax;

    // Reset status to Preparing if extra dishes were ordered and KDS is active
    if (order.status === 'Ready' && settings.kds?.enabled !== false) {
      order.status = 'Preparing';
    }

    const updatedOrder = await order.save();

    // Update Table snapshot
    table.currentTotal = updatedOrder.total;
    table.itemCount = updatedOrder.items.reduce((s, it) => s + (it.qty || 1), 0);
    await table.save();

    io.emit('orderStatusUpdated', updatedOrder);
    io.emit('tableUpdated', table);

    res.json({
      success: true,
      message: 'Mahsulotlar stol buyurtmasiga muvaffaqiyatli qo‘shildi',
      order: updatedOrder,
      addedItems: newItems,
      table
    });
  } catch (err) {
    console.error('Append items error:', err);
    res.status(400).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// 5. ORDERS & KDS (Server-Side Price Calculation & Verification)
// -------------------------------------------------------------

// Active Orders for Kitchen KDS
app.get('/api/orders', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) {
      const statusList = status.split(',').map(s => s.trim());
      query.status = { $in: statusList };
    }
    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(100);
    res.json(orders);
  } catch (err) {
    console.error('GET /api/orders Error:', err);
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/orders/pending', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Pending' }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// In-flight concurrency lock to prevent microsecond race conditions on order placement
const activeOrderLocks = new Map();

// Create Order (SERVER-SIDE PRICE VERIFICATION & IDEMPOTENCY)
app.post('/api/orders', async (req, res) => {
  const { idempotencyKey } = req.body;
  try {
    const { items, tableNumber, source, orderType, paymentMethod, status } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Savatchada kamida bitta mahsulot bo‘lishi shart' });
    }

    // Check Idempotency for offline replay & concurrent request deduplication
    if (idempotencyKey) {
      // 1. Check if already stored in database
      const existing = await Order.findOne({ idempotencyKey });
      if (existing) {
        return res.status(200).json(existing);
      }

      // 2. Check if a request with this key is currently in-flight
      if (activeOrderLocks.has(idempotencyKey)) {
        console.warn(`[Concurrency Guard] Awaiting in-flight order creation for key: ${idempotencyKey}`);
        try {
          const inFlightOrder = await activeOrderLocks.get(idempotencyKey);
          if (inFlightOrder) {
            return res.status(200).json(inFlightOrder);
          }
        } catch {
          // If in-flight processing failed, fall through to retry
        }
      }
    }

    const settings = await getOrCreateSettings();

    // Fetch products from database to prevent price tampering
    const productIds = items.map(item => item.productId).filter(Boolean);
    const dbProducts = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(dbProducts.map(p => [String(p._id), p]));

    let calculatedSubtotal = 0;
    const verifiedItems = items.map(item => {
      const dbProd = productMap.get(String(item.productId));
      const unitPrice = dbProd ? dbProd.price : Number(item.price || 0);
      const qty = Math.max(1, parseInt(item.qty, 10) || 1);
      calculatedSubtotal += (unitPrice * qty);

      return {
        productId: item.productId,
        name: dbProd ? dbProd.name : item.name,
        price: unitPrice,
        qty: qty,
        unit: item.unit || (dbProd ? dbProd.unit : 'dona'),
        tag: item.tag || (dbProd ? dbProd.tag : ''),
        image: dbProd ? dbProd.image : item.image
      };
    });

    // Calculate tax & service fee based on server settings
    const taxRate = settings.pricing?.taxEnabled ? (settings.pricing.taxRate || 0) : 0;
    const calculatedTax = Math.round(calculatedSubtotal * (taxRate / 100));
    const calculatedTotal = calculatedSubtotal + calculatedTax;

    // Safety Net: Guard against fast double-submissions within 2 seconds
    const recentThreshold = new Date(Date.now() - 2000);
    const recentDuplicate = await Order.findOne({
      createdAt: { $gte: recentThreshold },
      total: calculatedTotal,
      source: source || 'POS',
      orderType: orderType || 'Zalda',
      paymentMethod: paymentMethod || 'Naqd'
    }).sort({ createdAt: -1 });

    if (recentDuplicate && recentDuplicate.items.length === verifiedItems.length) {
      const isExactMatch = recentDuplicate.items.every((it, idx) => 
        String(it.productId) === String(verifiedItems[idx]?.productId) && it.qty === verifiedItems[idx]?.qty
      );
      if (isExactMatch) {
        console.warn(`[Anti-Duplicate Guard] Blocked duplicate order submitted within 2s (Existing Order #${recentDuplicate.orderNumber})`);
        return res.status(200).json(recentDuplicate);
      }
    }

    // Generate atomic sequential order number
    const orderNumber = await generateOrderNumber(settings);

    const newOrder = new Order({
      orderNumber,
      idempotencyKey: idempotencyKey || null,
      items: verifiedItems,
      subtotal: calculatedSubtotal,
      tax: calculatedTax,
      total: calculatedTotal,
      currencySnapshot: settings.localization?.currencySymbol || "so'm",
      taxRateSnapshot: taxRate,
      tableNumber: tableNumber || null,
      source: source || 'POS',
      orderType: orderType || 'Zalda',
      paymentMethod: paymentMethod || 'Naqd',
      status: status || (settings.kds?.enabled === false ? 'Ready' : (source === 'Customer' ? 'Pending' : 'Preparing'))
    });

    // Register active in-flight lock promise
    const savePromise = newOrder.save();
    if (idempotencyKey) {
      activeOrderLocks.set(idempotencyKey, savePromise);
    }

    const savedOrder = await savePromise;

    // Dine-In Table Linkage & Occupation
    if (savedOrder.tableNumber && savedOrder.orderType === 'Zalda') {
      try {
        const cleanTableNum = String(savedOrder.tableNumber).trim();
        let table = await Table.findOne({ tableNumber: cleanTableNum });
        if (!table && !isNaN(cleanTableNum)) {
          table = await Table.findOne({ tableNumber: cleanTableNum.padStart(2, '0') });
        }
        if (table) {
          table.status = 'OCCUPIED';
          table.currentOrderId = savedOrder._id;
          table.currentOrderNumber = savedOrder.orderNumber;
          table.currentTotal = savedOrder.total;
          table.itemCount = savedOrder.items.reduce((sum, it) => sum + (it.qty || 1), 0);
          table.openedAt = table.openedAt || new Date();
          table.occupiedBy = req.user?.name || (source === 'Customer' ? 'Mijoz' : 'Administrator');
          table.guestCount = req.body.guestCount || table.guestCount || 1;
          await table.save();
          io.emit('tableUpdated', table);
          io.emit('tablesRefreshed');
        }
      } catch (tableErr) {
        console.error('Error linking table to order:', tableErr);
      }
    }

    // Send Telegram Notification asynchronously
    sendTelegramNotification(savedOrder, settings);

    // Broadcast realtime event
    io.emit('newOrder', savedOrder);

    res.status(201).json(savedOrder);
  } catch (err) {
    // Gracefully handle database-level duplicate key race condition
    if (err.code === 11000 && idempotencyKey) {
      console.warn(`[Idempotency] E11000 duplicate key caught for ${idempotencyKey}, returning original order`);
      const existing = await Order.findOne({ idempotencyKey });
      if (existing) {
        return res.status(200).json(existing);
      }
    }
    console.error('POST /api/orders Error:', err);
    res.status(400).json({ message: err.message });
  } finally {
    if (idempotencyKey) {
      activeOrderLocks.delete(idempotencyKey);
    }
  }
});

// Update Order Status (State Machine Controlled)
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status, paymentMethod } = req.body;
    const validStatuses = ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Noto‘g‘ri buyurtma holati' });
    }

    const updateFields = { status };
    if (paymentMethod) {
      updateFields.paymentMethod = paymentMethod;
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Buyurtma topilmadi' });
    }

    // Automatic Table Freeing / Reconciliation on Order Completion or Cancellation
    if (status === 'Completed' || status === 'Cancelled') {
      try {
        const table = await Table.findOne({ currentOrderId: order._id });
        if (table) {
          table.status = 'FREE';
          table.currentOrderId = null;
          table.currentOrderNumber = null;
          table.currentTotal = 0;
          table.itemCount = 0;
          table.openedAt = null;
          table.occupiedBy = null;
          table.notes = '';
          await table.save();
          io.emit('tableUpdated', table);
          io.emit('tablesRefreshed');
        }
      } catch (tErr) {
        console.error('Error auto-freeing table:', tErr);
      }
    }

    // Broadcast state transition
    io.emit('orderStatusUpdated', order);

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// 6. ANALYTICS & STATS (Timezone-Aware)
// -------------------------------------------------------------
app.get('/api/stats', async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query; // YYYY-MM-DD
    const settings = await getOrCreateSettings();
    const timezone = settings.localization?.timezone || 'Asia/Tashkent';

    let start, end;
    if (startDate && endDate) {
      start = new Date(`${startDate}T00:00:00.000Z`);
      end = new Date(`${endDate}T23:59:59.999Z`);
    } else if (date) {
      start = new Date(`${date}T00:00:00.000Z`);
      end = new Date(`${date}T23:59:59.999Z`);
    } else {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    // Key metrics
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    const dailyRevenue = await Order.aggregate([
      { $match: { status: 'Completed', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    const cancelledStats = await Order.aggregate([
      { $match: { status: 'Cancelled', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    const topProducts = await Order.aggregate([
      { $match: { status: 'Completed', createdAt: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', totalSold: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyTrend = await Order.aggregate([
      { $match: { status: 'Completed', createdAt: { $gte: sevenDaysAgo } } },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone } }, 
          revenue: { $sum: "$total" } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    const categoryDistribution = await Order.aggregate([
      { $match: { status: 'Completed', createdAt: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      { 
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      { $group: { _id: '$productInfo.category', value: { $sum: 1 } } }
    ]);

    const peakHours = await Order.aggregate([
      { $match: { status: 'Completed', createdAt: { $gte: start, $lte: end } } },
      { 
        $group: { 
          _id: { $hour: { date: "$createdAt", timezone } }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    const recentOrders = await Order.find({ createdAt: { $gte: start, $lte: end } })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      overall: totalRevenue[0] || { total: 0, count: 0 },
      daily: dailyRevenue[0] || { total: 0, count: 0 },
      cancelled: cancelledStats[0] || { total: 0, count: 0 },
      topProducts,
      recentOrders,
      weeklyTrend,
      categoryDistribution,
      peakHours
    });
  } catch (err) {
    console.error('GET /api/stats Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// -------------------------------------------------------------
// 7. GLOBAL ERROR HANDLER & PRODUCTION STATIC ASSETS
// -------------------------------------------------------------
app.use((err, req, res, _next) => {
  console.error('❌ SERVER ERROR:', err);
  res.status(500).json({ 
    message: 'Serverda xatolik yuz berdi', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.resolve(__dirname, '../dist');
if (fs.existsSync(distPath) || process.env.NODE_ENV === 'production' || process.env.RENDER) {
  app.use(express.static(distPath));
  
  app.get(/.*/, (req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
}

if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    
    // Keep-alive mechanism for Render free tier
    const RENDER_URL = process.env.RENDER_EXTERNAL_URL;
    if (RENDER_URL) {
      setInterval(async () => {
        try {
          await axios.get(`${RENDER_URL}/ping`);
          console.log('💓 Keep-alive: Server pinged successfully');
        } catch (err) {
          console.error('💔 Keep-alive Error:', err.message);
        }
      }, 14 * 60 * 1000);
    }
  });
}

export default app;
