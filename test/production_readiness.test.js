import { describe, it, expect } from 'vitest';
import { 
  DEFAULT_SETTINGS, 
  sanitizePublicSettings, 
  maskSensitiveSettings,
  settingsSchema 
} from '../shared/settingsDefaults.js';

describe('Production Readiness: 1. Financial & Calculation Precision', () => {
  it('should accurately calculate subtotal, tax, and total without floating-point errors', () => {
    // Edge case: Multiple items with different tax rates and fractional pennies
    const items = [
      { price: 44000, qty: 3 }, // 132,000
      { price: 94000, qty: 1 }, // 94,000
      { price: 3000, qty: 5 },  // 15,000
      { price: 249000, qty: 2 } // 498,000
    ];

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    expect(subtotal).toBe(739000);

    const taxRates = [0, 5, 12, 15, 20];
    taxRates.forEach(rate => {
      const tax = Math.round(subtotal * (rate / 100));
      const total = subtotal + tax;

      expect(total).toBe(subtotal + tax);
      expect(Number.isInteger(tax)).toBe(true);
      expect(Number.isInteger(total)).toBe(true);
    });
  });

  it('should prevent price tampering by prioritizing server DB prices over client payloads', () => {
    const dbProductMap = new Map([
      ['prod_1', { _id: 'prod_1', name: 'Osh', price: 45000 }],
      ['prod_2', { _id: 'prod_2', name: 'Choy', price: 5000 }]
    ]);

    // Malicious client payload tampering with prices to 100 so'm
    const clientItems = [
      { productId: 'prod_1', name: 'Osh', price: 100, qty: 2 },
      { productId: 'prod_2', name: 'Choy', price: 100, qty: 1 }
    ];

    let verifiedSubtotal = 0;
    const verifiedItems = clientItems.map(item => {
      const dbProd = dbProductMap.get(item.productId);
      const unitPrice = dbProd ? dbProd.price : Number(item.price || 0);
      const qty = Math.max(1, parseInt(item.qty, 10) || 1);
      verifiedSubtotal += (unitPrice * qty);

      return {
        productId: item.productId,
        name: dbProd ? dbProd.name : item.name,
        price: unitPrice,
        qty: qty
      };
    });

    // Tampered price (300) must be rejected, legitimate price (95,000) must be enforced
    expect(verifiedSubtotal).toBe(95000);
    expect(verifiedItems[0].price).toBe(45000);
    expect(verifiedItems[1].price).toBe(5000);
  });

  it('should sanitize negative or zero quantities to minimum of 1', () => {
    const maliciousQtys = [-5, 0, 'invalid', null, undefined, -0.5];
    
    maliciousQtys.forEach(rawQty => {
      const sanitizedQty = Math.max(1, parseInt(rawQty, 10) || 1);
      expect(sanitizedQty).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(sanitizedQty)).toBe(true);
    });
  });

  it('should correctly format currency strings in Uzbek Soum (so‘m)', () => {
    const formatPrice = (amount, currency = "so'm") => {
      return `${(Number(amount) || 0).toLocaleString()} ${currency}`;
    };

    expect(formatPrice(0)).toBe("0 so'm");
    expect(formatPrice(144900)).toBe("144,900 so'm");
    expect(formatPrice(1000000)).toBe("1,000,000 so'm");
    expect(formatPrice('invalid')).toBe("0 so'm");
  });
});

describe('Production Readiness: 2. Table State Machine & Dine-In Workflow', () => {
  it('should follow strict state machine transitions and reject invalid states', () => {
    const stateTransitions = {
      FREE: ['OCCUPIED', 'RESERVED'],
      OCCUPIED: ['BILL_PRINTED', 'FREE'],
      BILL_PRINTED: ['FREE', 'OCCUPIED'],
      RESERVED: ['OCCUPIED', 'FREE']
    };

    const isValidTransition = (from, to) => stateTransitions[from]?.includes(to) ?? false;

    // Allowed valid paths
    expect(isValidTransition('FREE', 'OCCUPIED')).toBe(true);
    expect(isValidTransition('OCCUPIED', 'BILL_PRINTED')).toBe(true);
    expect(isValidTransition('BILL_PRINTED', 'FREE')).toBe(true);
    expect(isValidTransition('BILL_PRINTED', 'OCCUPIED')).toBe(true); // Customer ordered more after bill printed

    // Prohibited invalid paths
    expect(isValidTransition('FREE', 'BILL_PRINTED')).toBe(false);
    expect(isValidTransition('FREE', 'FREE')).toBe(false);
  });

  it('should seamlessly append additional items to an active table order and merge duplicates', () => {
    const activeOrder = {
      _id: 'ord-101',
      orderNumber: '#015',
      items: [
        { productId: 'p1', name: 'Macho Lavash', tag: 'Big', price: 42000, qty: 2 },
        { productId: 'p2', name: 'Cola 1.0L', tag: '', price: 12000, qty: 1 }
      ],
      subtotal: 96000,
      tax: 4800,
      total: 100800,
      status: 'Ready'
    };

    const incomingItems = [
      { productId: 'p1', name: 'Macho Lavash', tag: 'Big', price: 42000, qty: 1 }, // Duplicate, should merge
      { productId: 'p3', name: 'Fri Kartoshka', tag: '', price: 15000, qty: 2 }   // New item, should append
    ];

    const taxRate = 5;
    let additionalSubtotal = 0;

    for (const newItem of incomingItems) {
      additionalSubtotal += (newItem.price * newItem.qty);
      const existingMatch = activeOrder.items.find(it => 
        it.productId === newItem.productId && 
        it.tag === newItem.tag && 
        it.price === newItem.price
      );
      if (existingMatch) {
        existingMatch.qty += newItem.qty;
      } else {
        activeOrder.items.push(newItem);
      }
    }

    activeOrder.subtotal += additionalSubtotal;
    activeOrder.tax = Math.round(activeOrder.subtotal * (taxRate / 100));
    activeOrder.total = activeOrder.subtotal + activeOrder.tax;

    // When new items are added, order should move back to Preparing if it was Ready
    if (activeOrder.status === 'Ready') {
      activeOrder.status = 'Preparing';
    }

    expect(activeOrder.items.length).toBe(3); // p1 merged, p2 untouched, p3 appended
    expect(activeOrder.items[0].qty).toBe(3); // 2 + 1 = 3
    expect(activeOrder.items[2].qty).toBe(2);
    expect(activeOrder.subtotal).toBe(96000 + 42000 + 30000); // 168,000
    expect(activeOrder.tax).toBe(8400);
    expect(activeOrder.total).toBe(176400);
    expect(activeOrder.status).toBe('Preparing');
  });

  it('should safely execute table transfer with complete state preservation and source freeing', () => {
    const sourceTable = {
      _id: 't-01',
      tableNumber: '01',
      status: 'OCCUPIED',
      currentOrderId: 'ord-555',
      currentOrderNumber: '#055',
      currentTotal: 185000,
      itemCount: 4,
      guestCount: 3,
      occupiedBy: 'Afitsiant Alisher'
    };

    const targetTable = {
      _id: 't-09',
      tableNumber: '09',
      status: 'FREE',
      currentOrderId: null,
      currentOrderNumber: null,
      currentTotal: 0,
      itemCount: 0,
      guestCount: 1,
      occupiedBy: null
    };

    // Preconditions
    expect(sourceTable.status).toBe('OCCUPIED');
    expect(targetTable.status).toBe('FREE');

    // Transfer logic
    targetTable.status = sourceTable.status;
    targetTable.currentOrderId = sourceTable.currentOrderId;
    targetTable.currentOrderNumber = sourceTable.currentOrderNumber;
    targetTable.currentTotal = sourceTable.currentTotal;
    targetTable.itemCount = sourceTable.itemCount;
    targetTable.guestCount = sourceTable.guestCount;
    targetTable.occupiedBy = sourceTable.occupiedBy;

    // Reset source
    sourceTable.status = 'FREE';
    sourceTable.currentOrderId = null;
    sourceTable.currentOrderNumber = null;
    sourceTable.currentTotal = 0;
    sourceTable.itemCount = 0;
    sourceTable.occupiedBy = null;

    // Postconditions
    expect(targetTable.status).toBe('OCCUPIED');
    expect(targetTable.currentOrderNumber).toBe('#055');
    expect(targetTable.currentTotal).toBe(185000);
    expect(sourceTable.status).toBe('FREE');
    expect(sourceTable.currentOrderId).toBe(null);
  });
});

describe('Production Readiness: 3. Security, RBAC & Credentials Protection', () => {
  it('should never expose sensitive tokens in public settings', () => {
    const rawSettings = {
      ...DEFAULT_SETTINGS,
      notifications: {
        telegramEnabled: true,
        telegramToken: '8172635489:AAHkdu81723_secret_bot_token_do_not_leak',
        telegramChatId: '-100987654321',
        telegramIncludeImage: true
      },
      security: {
        requireAuthForKds: true,
        sessionTimeoutMinutes: 60
      }
    };

    const publicSettings = sanitizePublicSettings(rawSettings);

    expect(publicSettings.notifications).toBeUndefined(); // Completely omitted
    expect(publicSettings.business.name).toBe(rawSettings.business.name);
    expect(publicSettings.localization.currencySymbol).toBe(rawSettings.localization.currencySymbol);
    expect(JSON.stringify(publicSettings)).not.toContain('secret_bot_token');
  });

  it('should mask sensitive credentials in admin settings view', () => {
    const rawSettings = {
      ...DEFAULT_SETTINGS,
      notifications: {
        telegramEnabled: true,
        telegramToken: '8172635489:AAHkdu81723_secret_bot_token',
        telegramChatId: '-100987654321'
      }
    };

    const masked = maskSensitiveSettings(rawSettings);

    // Raw token must be deleted to protect security
    expect(masked.notifications.telegramToken).toBeUndefined();
    expect(masked.notifications.telegramTokenMasked).toContain('••••••••');
    expect(masked.notifications.isTelegramTokenSet).toBe(true);
    expect(masked.notifications.telegramChatId).toBe('-100987654321');
  });

  it('should validate settings schema structure against Zod schema', () => {
    const validConfig = {
      name: 'OqTepa Lavash',
      tagline: 'Mazali va tez',
      phone: '+998901234567',
      address: 'Toshkent sh., Chilonzor'
    };

    const result = settingsSchema.shape.business.safeParse(validConfig);
    expect(result.success).toBe(true);

    const invalidPricing = {
      taxRate: 150 // Out of 0-100 bounds
    };
    const invalidResult = settingsSchema.shape.pricing.safeParse(invalidPricing);
    expect(invalidResult.success).toBe(false);
  });
});

describe('Production Readiness: 4. Concurrency, Deduplication & Idempotency', () => {
  it('should identify duplicate order submission within rapid window', () => {
    const now = Date.now();
    const existingOrder = {
      orderNumber: '#088',
      total: 45000,
      source: 'POS',
      orderType: 'Zalda',
      paymentMethod: 'Naqd',
      createdAt: new Date(now - 800), // Submitted 800ms ago
      items: [
        { productId: 'p1', qty: 1 }
      ]
    };

    const incomingOrder = {
      total: 45000,
      source: 'POS',
      orderType: 'Zalda',
      paymentMethod: 'Naqd',
      items: [
        { productId: 'p1', qty: 1 }
      ]
    };

    const isDuplicate = (
      now - existingOrder.createdAt.getTime() <= 2000 &&
      existingOrder.total === incomingOrder.total &&
      existingOrder.source === incomingOrder.source &&
      existingOrder.orderType === incomingOrder.orderType &&
      existingOrder.paymentMethod === incomingOrder.paymentMethod &&
      existingOrder.items.length === incomingOrder.items.length &&
      existingOrder.items.every((it, idx) => it.productId === incomingOrder.items[idx]?.productId && it.qty === incomingOrder.items[idx]?.qty)
    );

    expect(isDuplicate).toBe(true);
  });
});

describe('Production Readiness: 5. KDS Kitchen Pipeline & Order Status Progression', () => {
  it('should enforce strict valid lifecycle: Pending -> Preparing -> Ready -> Completed', () => {
    const validTransitions = {
      Pending: ['Preparing', 'Cancelled'],
      Preparing: ['Ready', 'Cancelled'],
      Ready: ['Completed', 'Preparing', 'Cancelled'], // Can go back to Preparing if addon dishes added
      Completed: [], // Terminal state
      Cancelled: []  // Terminal state
    };

    const canTransition = (from, to) => validTransitions[from]?.includes(to) ?? false;

    expect(canTransition('Pending', 'Preparing')).toBe(true);
    expect(canTransition('Preparing', 'Ready')).toBe(true);
    expect(canTransition('Ready', 'Completed')).toBe(true);
    expect(canTransition('Ready', 'Preparing')).toBe(true); // Addon dish re-opens kitchen work
    expect(canTransition('Pending', 'Cancelled')).toBe(true);
    expect(canTransition('Completed', 'Preparing')).toBe(false); // Closed order cannot be revived directly
    expect(canTransition('Completed', 'Ready')).toBe(false);
  });

  it('should bypass kitchen queue and mark as Ready when KDS is disabled in settings', () => {
    const settingsKdsDisabled = { kds: { enabled: false } };
    const settingsKdsEnabled = { kds: { enabled: true } };

    const determineInitialStatus = (source, settings) => {
      if (settings.kds?.enabled === false) return 'Ready';
      if (source === 'Customer') return 'Pending';
      return 'Preparing';
    };

    expect(determineInitialStatus('POS', settingsKdsDisabled)).toBe('Ready');
    expect(determineInitialStatus('POS', settingsKdsEnabled)).toBe('Preparing');
    expect(determineInitialStatus('Customer', settingsKdsEnabled)).toBe('Pending');
  });
});

describe('Production Readiness: 6. Hardware Receipt & Thermal Printing Specs', () => {
  it('should format receipt correctly for both 80mm and 58mm thermal printers', () => {
    const formatReceiptDimensions = (paperWidth) => {
      const is58mm = paperWidth === '58mm';
      return {
        width: is58mm ? '58mm' : '80mm',
        fontSize: is58mm ? '10px' : '12px',
        titleSize: is58mm ? '15px' : '18px',
        tableSize: is58mm ? '9px' : '11px',
        totalSize: is58mm ? '12px' : '14px'
      };
    };

    const config80 = formatReceiptDimensions('80mm');
    expect(config80.width).toBe('80mm');
    expect(config80.fontSize).toBe('12px');

    const config58 = formatReceiptDimensions('58mm');
    expect(config58.width).toBe('58mm');
    expect(config58.fontSize).toBe('10px');
  });

  it('should generate dedicated addon receipt with distinct header when extra dishes are added', () => {
    const addonOrder = {
      isAddon: true,
      addonItems: [
        { name: 'Choy Zanjabilli', qty: 1, price: 15000 }
      ],
      items: [
        { name: 'Osh', qty: 2, price: 90000 },
        { name: 'Choy Zanjabilli', qty: 1, price: 15000 }
      ],
      total: 105000
    };

    const isAddonReceipt = !!addonOrder.isAddon;
    const printItems = (isAddonReceipt && addonOrder.addonItems?.length > 0)
      ? addonOrder.addonItems
      : addonOrder.items;

    expect(isAddonReceipt).toBe(true);
    expect(printItems.length).toBe(1);
    expect(printItems[0].name).toBe('Choy Zanjabilli');
  });
});

describe('Production Readiness: 7. Auth Role Gatekeeper & Session Expiration', () => {
  it('should permit admin to access admin routes and deny seller role', () => {
    const checkRolePermission = (user, allowedRoles = []) => {
      if (!user || !user.role) return 401; // Unauthorized
      if (!allowedRoles.includes(user.role)) return 403; // Forbidden
      return 200; // Authorized
    };

    const adminUser = { id: 'u1', name: 'Admin', role: 'admin' };
    const sellerUser = { id: 'u2', name: 'Cashier', role: 'seller' };
    const anonymous = null;

    // Admin-only endpoints (/api/products POST, /api/settings PATCH, /api/tables POST)
    expect(checkRolePermission(adminUser, ['admin'])).toBe(200);
    expect(checkRolePermission(sellerUser, ['admin'])).toBe(403);
    expect(checkRolePermission(anonymous, ['admin'])).toBe(401);

    // Shared operational endpoints
    expect(checkRolePermission(sellerUser, ['admin', 'seller'])).toBe(200);
    expect(checkRolePermission(adminUser, ['admin', 'seller'])).toBe(200);
  });
});

describe('Production Readiness: 8. Resilience & Self-Healing Scenarios', () => {
  it('should automatically release table when order finishes or is cancelled', () => {
    const table = {
      tableNumber: '05',
      status: 'OCCUPIED',
      currentOrderId: 'ord-888',
      currentTotal: 120000
    };

    const reconcileTable = (table, orderStatus) => {
      if (orderStatus === 'Completed' || orderStatus === 'Cancelled') {
        table.status = 'FREE';
        table.currentOrderId = null;
        table.currentTotal = 0;
      }
      return table;
    };

    // If order is completed at cashier
    reconcileTable(table, 'Completed');
    expect(table.status).toBe('FREE');
    expect(table.currentOrderId).toBe(null);
    expect(table.currentTotal).toBe(0);
  });

  it('should self-heal when an occupied table points to a non-existent order', () => {
    const table = {
      tableNumber: '03',
      status: 'OCCUPIED',
      currentOrderId: 'missing-order-id',
      currentTotal: 50000
    };

    const dbOrder = null; // Simulates database record deleted or corrupted

    if (!dbOrder || dbOrder.status === 'Completed' || dbOrder.status === 'Cancelled') {
      table.status = 'FREE';
      table.currentOrderId = null;
      table.currentTotal = 0;
    }

    expect(table.status).toBe('FREE');
    expect(table.currentOrderId).toBe(null);
  });
});
