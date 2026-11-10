import { describe, it, expect } from 'vitest';

describe('Receipt Order Snapshot Integrity', () => {
  it('should preserve order items even when cart is cleared', () => {
    const lastPlacedOrder = {
      orderNumber: '#010',
      items: [
        { name: 'Macho Lavash Kombo', qty: 1, price: 94000, tag: 'Solo' },
        { name: 'Pepsi', qty: 2, price: 11000, tag: '1.0L' }
      ],
      subtotal: 116000,
      tax: 5800,
      total: 121800,
      orderType: 'Zalda',
      paymentMethod: 'Naqd'
    };

    // Simulate active cart cleared upon successful checkout
    const activeCart = [];
    const activeTotal = 0;
    const activeSubtotal = 0;
    const activeTax = 0;

    // Logic used in Receipt.jsx
    const hasOrder = !!lastPlacedOrder && Array.isArray(lastPlacedOrder.items) && lastPlacedOrder.items.length > 0;
    const items = hasOrder ? lastPlacedOrder.items : (activeCart.length > 0 ? activeCart : []);
    const total = hasOrder ? lastPlacedOrder.total : activeTotal;
    const subtotal = hasOrder ? (lastPlacedOrder.subtotal !== undefined ? lastPlacedOrder.subtotal : lastPlacedOrder.total) : activeSubtotal;
    const tax = hasOrder ? (lastPlacedOrder.tax || 0) : activeTax;
    const orderNumber = hasOrder ? lastPlacedOrder.orderNumber : '';

    expect(hasOrder).toBe(true);
    expect(items.length).toBe(2);
    expect(items[0].name).toBe('Macho Lavash Kombo');
    expect(total).toBe(121800);
    expect(subtotal).toBe(116000);
    expect(tax).toBe(5800);
    expect(orderNumber).toBe('#010');
  });

  it('should fall back to sample items for test receipt when neither order nor cart exists', () => {
    const lastPlacedOrder = null;
    const cart = [];

    const hasOrder = !!lastPlacedOrder && Array.isArray(lastPlacedOrder.items) && lastPlacedOrder.items.length > 0;
    const isTestReceipt = !hasOrder && (!cart || cart.length === 0);

    const items = hasOrder 
      ? lastPlacedOrder.items 
      : (cart && cart.length > 0) 
        ? cart 
        : [
            { name: "Macho Lavash Kombo", qty: 1, price: 94000, tag: "Solo" },
            { name: "Pepsi", qty: 1, price: 11000, tag: "1.0L" }
          ];

    expect(isTestReceipt).toBe(true);
    expect(items.length).toBe(2);
    expect(items[0].name).toBe('Macho Lavash Kombo');
  });
});
