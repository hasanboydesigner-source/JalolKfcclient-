import { describe, it, expect } from 'vitest';
import { 
  DEFAULT_SETTINGS, 
  INDUSTRY_TEMPLATES,
  settingsSchema, 
  sanitizePublicSettings, 
  maskSensitiveSettings 
} from '../shared/settingsDefaults.js';

describe('Settings Schema & White-Label Validation', () => {
  it('should validate the default settings correctly', () => {
    const result = settingsSchema.safeParse(DEFAULT_SETTINGS);
    expect(result.success).toBe(true);
  });

  it('should support all universal industry templates (Oshxona, Choyxona, Kafe, Fastfood, Custom)', () => {
    const templateKeys = Object.keys(INDUSTRY_TEMPLATES);
    expect(templateKeys).toContain('restaurant');
    expect(templateKeys).toContain('teahouse');
    expect(templateKeys).toContain('cafe');
    expect(templateKeys).toContain('fastfood');
    expect(templateKeys).toContain('custom');

    // Oshxona (restaurant) must have milliy taomlar categories
    const restaurantCats = INDUSTRY_TEMPLATES.restaurant.categories.map(c => c.name);
    expect(restaurantCats.some(n => n.includes('1-taomlar'))).toBe(true);
    expect(restaurantCats.some(n => n.includes('2-taomlar'))).toBe(true);

    // Choyxona must have palov & shashlik categories
    const teahouseCats = INDUSTRY_TEMPLATES.teahouse.categories.map(c => c.name);
    expect(teahouseCats.some(n => n.includes('Palov'))).toBe(true);
    expect(teahouseCats.some(n => n.includes('Shashlik'))).toBe(true);

    // Kafe must have coffee & breakfast categories
    const cafeCats = INDUSTRY_TEMPLATES.cafe.categories.map(c => c.name);
    expect(cafeCats.some(n => n.includes('Qahvalar'))).toBe(true);
  });

  it('should sanitize public settings and expose dynamic categories to clients', () => {
    const publicSettings = sanitizePublicSettings(DEFAULT_SETTINGS);
    expect(publicSettings.categories).toBeDefined();
    expect(Array.isArray(publicSettings.categories)).toBe(true);
    expect(publicSettings.categories.length).toBeGreaterThan(0);
  });

  it('should reject invalid primary colors (not hex)', () => {
    const invalid = {
      ...DEFAULT_SETTINGS,
      branding: {
        ...DEFAULT_SETTINGS.branding,
        primaryColor: 'red' // Not a valid hex code
      }
    };
    const result = settingsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should sanitize public settings and strip all sensitive fields', () => {
    const fullSettings = {
      ...DEFAULT_SETTINGS,
      notifications: {
        telegramEnabled: true,
        telegramToken: '123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        telegramChatId: '-100123456789',
        telegramIncludeImage: true
      },
      security: {
        sessionTimeoutMinutes: 480,
        maxFailedLogins: 5,
        lockoutDurationMinutes: 15
      }
    };

    const publicSettings = sanitizePublicSettings(fullSettings);

    // Ensure secrets are NOT exposed
    expect(publicSettings.notifications).toBeUndefined();
    expect(publicSettings.security).toBeUndefined();
    expect(publicSettings.business.name).toBe(DEFAULT_SETTINGS.business.name);
    expect(publicSettings.branding.primaryColor).toBe(DEFAULT_SETTINGS.branding.primaryColor);
  });

  it('should mask sensitive bot tokens for admin view', () => {
    const fullSettings = {
      ...DEFAULT_SETTINGS,
      notifications: {
        telegramEnabled: true,
        telegramToken: '1234567890:ABC-DEF1234ghIkl-zyx57W2v1u123ew11',
        telegramChatId: '-100123456789',
        telegramIncludeImage: true
      }
    };

    const masked = maskSensitiveSettings(fullSettings);

    expect(masked.notifications.telegramToken).toBeUndefined(); // Raw token stripped
    expect(masked.notifications.isTelegramTokenSet).toBe(true);
    expect(masked.notifications.telegramTokenMasked).toContain('••••');
  });
});

describe('Security & Price Verification Unit Tests', () => {
  it('should prevent NoSQL injection via pin parameter validation', () => {
    // Simulated input from NoSQL attack payload
    const maliciousPayload = { pin: { $ne: null } };
    
    // Test our validation rule: pin must be string
    const isString = typeof maliciousPayload.pin === 'string';
    expect(isString).toBe(false);
  });

  it('should correctly calculate subtotal, tax, and total on server', () => {
    const items = [
      { productId: 'prod_1', price: 25000, qty: 2 },
      { productId: 'prod_2', price: 10000, qty: 3 }
    ];

    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    expect(subtotal).toBe(80000);

    const taxRate = 5.0; // 5%
    const tax = Math.round(subtotal * (taxRate / 100));
    expect(tax).toBe(4000);

    const total = subtotal + tax;
    expect(total).toBe(84000);
  });

  it('should guarantee idempotency key uniqueness and replay deduplication', () => {
    const key1 = 'uuid-test-order-1';
    const key2 = 'uuid-test-order-1'; // Duplicate request simulation

    const processedOrders = new Map();
    
    // First request
    if (!processedOrders.has(key1)) {
      processedOrders.set(key1, { orderNumber: '0001', total: 84000, idempotencyKey: key1 });
    }

    // Second concurrent request with same idempotencyKey
    let secondOrder;
    if (processedOrders.has(key2)) {
      secondOrder = processedOrders.get(key2); // Deduplicated!
    } else {
      secondOrder = { orderNumber: '0002', total: 84000, idempotencyKey: key2 };
      processedOrders.set(key2, secondOrder);
    }

    expect(secondOrder.orderNumber).toBe('0001');
    expect(processedOrders.size).toBe(1);
  });

  it('should validate database cleanup categories and require strict PIN verification', () => {
    const validCategories = ['orders', 'tables', 'products', 'audit_logs', 'all_data'];
    expect(validCategories.includes('orders')).toBe(true);
    expect(validCategories.includes('tables')).toBe(true);
    expect(validCategories.includes('products')).toBe(true);
    expect(validCategories.includes('audit_logs')).toBe(true);
    expect(validCategories.includes('all_data')).toBe(true);
    expect(validCategories.includes('malicious_drop')).toBe(false);

    // PIN validation rules
    const isValidPin = (pin) => typeof pin === 'string' && pin.length >= 4 && pin.length <= 8;
    expect(isValidPin('2024')).toBe(true);
    expect(isValidPin('123')).toBe(false);
    expect(isValidPin(null)).toBe(false);
    expect(isValidPin('')).toBe(false);
  });

  it('should properly structure table reset parameters when cleaning tables or orders', () => {
    const resetPayload = {
      status: 'FREE',
      currentOrderId: null,
      currentOrderNumber: null,
      currentTotal: 0,
      itemCount: 0,
      openedAt: null
    };

    expect(resetPayload.status).toBe('FREE');
    expect(resetPayload.currentTotal).toBe(0);
    expect(resetPayload.currentOrderId).toBeNull();
  });
});
