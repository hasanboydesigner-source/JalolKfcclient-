import express from 'express'; // triggered restart
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import Product from './models/Product.js';
import Order from './models/Order.js';
import Setting from './models/Setting.js';
import User from './models/User.js';
import upload from './middleware/upload.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('✅ MongoDB Connected');
    
    // Initialize default settings (passcode)
    const settings = await Setting.findOne();
    if (!settings) {
      await Setting.create({ passcode: '2024' });
      console.log('🛡️ Default settings initialized.');
    }

    // Initialize default users
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.insertMany([
        { name: 'Administrator', passcode: '2024', role: 'admin' },
        { name: 'Sotuvchi #042', passcode: '1111', role: 'seller' }
      ]);
      console.log('🛡️ Default users (Admin/Seller) initialized.');
    }
  })
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Telegram Helper
const sendTelegramNotification = async (order) => {
  const { TELEGRAM_TOKEN, TELEGRAM_CHAT_ID } = process.env;
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID || TELEGRAM_CHAT_ID === 'YOUR_CHAT_ID_HERE') {
    console.log('⚠️ Telegram notification skipped: Token or Chat ID not configured.');
    return;
  }

  const date = new Date(order.createdAt).toLocaleString('uz-UZ', { 
    hour: '2-digit', 
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  });

  let message = `━━━━━━━━━━━━━━━━━━━━\n`;
  if (order.source === 'Customer') {
    message += `🔔 <b>MIJOZ BUYURTMASI - STOL #${order.tableNumber || '?'}</b> 🔔\n`;
  } else {
    message += `🍔 <b>JALOL KFC - YANGI BUYURTMA</b> 🍔\n`;
  }
  message += `━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  message += `🆔 <b>ID:</b> <code>#${order._id.toString().slice(-6).toUpperCase()}</code>\n`;
  message += `⏰ <b>Vaqt:</b> <code>${date}</code>\n`;
  message += `💳 <b>To'lov:</b> <code>${order.paymentMethod}</code>\n`;
  message += `📍 <b>Turi:</b> <code>${order.orderType}</code>\n\n`;
  
  message += `📦 <b>MAXSULOTLAR:</b>\n`;
  message += `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n`;

  order.items.forEach(item => {
    message += `• <b>${item.name}</b>\n`;
    message += `  └─ <code>${item.qty} dona x ${item.price.toLocaleString()}</code>\n`;
  });

  message += `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n\n`;
  message += `💰 <b>JAMI TO'LOV:</b>\n`;
  message += `💲 <code><b>${order.total.toLocaleString()} so'm</b></code>\n\n`;
  message += `✅ <i>Tizim orqali qabul qilindi</i>`;

  try {
    // Send photo of the first item if available, otherwise just text
    if (order.items.length > 0 && order.items[0].image) {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendPhoto`, {
        chat_id: TELEGRAM_CHAT_ID,
        photo: order.items[0].image,
        caption: message,
        parse_mode: 'HTML'
      });
    } else {
      await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      });
    }
    console.log('✅ Telegram notification sent successfully');
  } catch (err) {
    console.error('❌ Telegram Notification Error:', err.response?.data || err.message);
  }
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { pin } = req.body;
    
    // Check for user
    const user = await User.findOne({ passcode: pin });
    if (user) {
      return res.json({ 
        success: true, 
        user: { 
          name: user.name, 
          role: user.role,
          avatar: user.avatar 
        } 
      });
    }

    // Fallback for migration (if only settings passcode exists)
    const settings = await Setting.findOne();
    if (settings && settings.passcode === pin) {
      return res.json({ 
        success: true, 
        user: { name: 'Administrator', role: 'admin' } 
      });
    }

    res.status(401).json({ success: false, message: 'Noto\'g\'ri parol' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update passcode
app.put('/api/auth/passcode', async (req, res) => {
  try {
    const { newPasscode, role } = req.body;
    
    // Update either the admin or seller user based on role
    const updatedUser = await User.findOneAndUpdate(
      { role: role || 'admin' }, 
      { passcode: newPasscode }, 
      { new: true }
    );

    // Also update global settings for legacy support
    if (role === 'admin') {
      await Setting.findOneAndUpdate({}, { passcode: newPasscode });
    }

    res.json({ success: true, message: 'Parol muvaffaqiyatli o\'zgartirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/auth/passcode', async (req, res) => {
  try {
    const { oldPin, newPin } = req.body;
    const settings = await Setting.findOne();
    if (settings && settings.passcode === oldPin) {
      settings.passcode = newPin;
      await settings.save();
      return res.json({ success: true, message: 'Parol muvaffaqiyatli yangilandi' });
    }
    res.status(401).json({ success: false, message: 'Eski parol noto\'g\'ri' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Routes
// 1. Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('GET /api/products Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// 2. Create a product (with image upload)
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, desc, tag, discount } = req.body;
    const newProduct = new Product({
      name,
      price,
      category,
      desc,
      tag,
      discount,
      image: req.file ? req.file.path : '/images/burger1.png' // req.file.path is the Cloudinary URL
    });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error('POST /api/products Error:', err);
    res.status(400).json({ message: err.message });
  }
});

// 3. Update a product
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.image = req.file.path;
    }
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 4. Delete a product
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Mahsulot o\'chirildi' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 5. Create an order
app.post('/api/orders', async (req, res) => {
  try {
    const order = new Order(req.body);
    const savedOrder = await order.save();
    
    // Send Telegram Notification
    sendTelegramNotification(savedOrder);

    res.status(201).json(savedOrder);
  } catch (err) {
    console.error('POST /api/orders Error:', err);
    res.status(400).json({ message: err.message });
  }
});

// Get pending orders
app.get('/api/orders/pending', async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Pending' }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update order status
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// 6. Get stats
app.get('/api/stats', async (req, res) => {
  try {
    const { date } = req.query; // YYYY-MM-DD
    let start, end;

    if (date) {
      start = new Date(date);
      start.setHours(0, 0, 0, 0);
      end = new Date(date);
      end.setHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    // Aggregate key metrics
    // Overall remains total all-time completed
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    // Filtered Revenue for specific day
    const dailyRevenue = await Order.aggregate([
      { $match: { status: 'Completed', createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }
    ]);

    // Top Selling Products (Filtered by selected day)
    const topProducts = await Order.aggregate([
      { $match: { status: 'Completed', createdAt: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', totalSold: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.price', '$items.qty'] } } } },
      { $sort: { totalSold: -1 } },
      { $limit: 10 }
    ]);

    // 7-Day Revenue Trend
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const weeklyTrend = await Order.aggregate([
      { $match: { status: 'Completed', createdAt: { $gte: sevenDaysAgo } } },
      { 
        $group: { 
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, 
          revenue: { $sum: "$total" } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    // Order History (Filtered by selected day)
    const recentOrders = await Order.find({ createdAt: { $gte: start, $lte: end } }).sort({ createdAt: -1 }).limit(30);

    res.json({
      overall: totalRevenue[0] || { total: 0, count: 0 },
      daily: dailyRevenue[0] || { total: 0, count: 0 },
      topProducts,
      recentOrders,
      weeklyTrend
    });
  } catch (err) {
    console.error('GET /api/stats Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ SERVER ERROR:', err);
  res.status(500).json({ 
    message: 'Serverda xatolik yuz berdi', 
    error: err.message 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
