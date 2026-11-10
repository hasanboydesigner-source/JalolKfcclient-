import { describe, it, expect } from 'vitest';

describe('Dine-In Table & Session Architecture', () => {
  it('should validate table state machine transitions', () => {
    const validTransitions = {
      FREE: ['OCCUPIED', 'RESERVED'],
      OCCUPIED: ['BILL_PRINTED', 'FREE'],
      BILL_PRINTED: ['FREE', 'OCCUPIED'],
      RESERVED: ['OCCUPIED', 'FREE']
    };

    const canTransition = (current, next) => {
      return validTransitions[current]?.includes(next) ?? false;
    };

    expect(canTransition('FREE', 'OCCUPIED')).toBe(true);
    expect(canTransition('OCCUPIED', 'BILL_PRINTED')).toBe(true);
    expect(canTransition('BILL_PRINTED', 'FREE')).toBe(true);
    expect(canTransition('FREE', 'BILL_PRINTED')).toBe(false); // Invalid leap
  });

  it('should correctly simulate table transfer (Table Move)', () => {
    const sourceTable = {
      tableNumber: '04',
      status: 'OCCUPIED',
      currentOrderId: 'order-123',
      currentOrderNumber: '#042',
      currentTotal: 150000,
      itemCount: 3,
      guestCount: 2,
      occupiedBy: 'Admin'
    };

    const targetTable = {
      tableNumber: '08',
      status: 'FREE',
      currentOrderId: null,
      currentOrderNumber: null,
      currentTotal: 0,
      itemCount: 0,
      guestCount: 1,
      occupiedBy: null
    };

    // Transfer logic
    expect(targetTable.status).toBe('FREE');
    
    // Perform transfer
    targetTable.status = 'OCCUPIED';
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

    expect(sourceTable.status).toBe('FREE');
    expect(sourceTable.currentOrderId).toBe(null);
    expect(targetTable.status).toBe('OCCUPIED');
    expect(targetTable.currentOrderNumber).toBe('#042');
    expect(targetTable.currentTotal).toBe(150000);
  });

  it('should self-heal when active order is completed or missing', () => {
    const table = {
      tableNumber: '02',
      status: 'OCCUPIED',
      currentOrderId: 'ord-finished',
      currentTotal: 85000
    };

    const mockOrderInDb = { _id: 'ord-finished', status: 'Completed' };

    // Self-healing check
    if (!mockOrderInDb || mockOrderInDb.status === 'Completed' || mockOrderInDb.status === 'Cancelled') {
      table.status = 'FREE';
      table.currentOrderId = null;
      table.currentTotal = 0;
    }

    expect(table.status).toBe('FREE');
    expect(table.currentOrderId).toBe(null);
    expect(table.currentTotal).toBe(0);
  });

  it('should accurately append extra dishes to an active table order', () => {
    const existingOrder = {
      _id: 'ord-001',
      orderNumber: '#001',
      items: [
        { name: 'Osh Special', qty: 2, price: 45000 }
      ],
      subtotal: 90000,
      tax: 4500, // 5%
      total: 94500
    };

    const extraItems = [
      { name: 'Ko\'k choy', qty: 1, price: 8000 },
      { name: 'Somsa', qty: 2, price: 12000 }
    ];

    const additionalSubtotal = extraItems.reduce((sum, it) => sum + (it.price * it.qty), 0); // 8000 + 24000 = 32000
    const taxRate = 5;

    existingOrder.items.push(...extraItems);
    existingOrder.subtotal += additionalSubtotal;
    existingOrder.tax = Math.round(existingOrder.subtotal * (taxRate / 100));
    existingOrder.total = existingOrder.subtotal + existingOrder.tax;

    expect(existingOrder.items.length).toBe(3);
    expect(existingOrder.subtotal).toBe(122000);
    expect(existingOrder.tax).toBe(6100);
    expect(existingOrder.total).toBe(128100);
  });

  it('should merge quantities when appending an existing item to an order', () => {
    const existingOrder = {
      items: [
        { productId: 'prod-1', name: 'Osh Special', tag: 'Standart', price: 45000, qty: 2 },
        { productId: 'prod-2', name: 'Non', tag: 'Standart', price: 5000, qty: 2 }
      ],
      subtotal: 100000
    };

    const extraItems = [
      { productId: 'prod-1', name: 'Osh Special', tag: 'Standart', price: 45000, qty: 1 }, // duplicate dish
      { productId: 'prod-3', name: 'Ko‘k Choy', tag: 'Standart', price: 8000, qty: 1 }      // new dish
    ];

    for (const newItem of extraItems) {
      const match = existingOrder.items.find(it => 
        it.productId === newItem.productId && 
        it.tag === newItem.tag && 
        it.price === newItem.price
      );
      if (match) {
        match.qty += newItem.qty;
      } else {
        existingOrder.items.push({ ...newItem });
      }
    }

    // Osh Special should now be merged to 3, total items array length should be 3 (Osh, Non, Choy)
    expect(existingOrder.items.length).toBe(3);
    const osh = existingOrder.items.find(i => i.productId === 'prod-1');
    expect(osh.qty).toBe(3);
    const choy = existingOrder.items.find(i => i.productId === 'prod-3');
    expect(choy.qty).toBe(1);
  });

  it('should enforce table selection for Dine-In while allowing takeaway without tables', () => {
    const validateOrder = (orderType, selectedTable) => {
      if (orderType === 'in_hall' && !selectedTable) {
        return { valid: false, message: 'Stolni tanlang' };
      }
      return { valid: true };
    };

    expect(validateOrder('in_hall', null).valid).toBe(false);
    expect(validateOrder('in_hall', { tableNumber: '05' }).valid).toBe(true);
    expect(validateOrder('takeaway', null).valid).toBe(true);
    expect(validateOrder('delivery', null).valid).toBe(true);
  });

  it('should skip kitchen waiting and set status directly to Ready when KDS is disabled', () => {
    const determineInitialStatus = (settings, source, status) => {
      return status || (settings?.kds?.enabled === false ? 'Ready' : (source === 'Customer' ? 'Pending' : 'Preparing'));
    };

    // When KDS is enabled
    expect(determineInitialStatus({ kds: { enabled: true } }, 'POS')).toBe('Preparing');
    expect(determineInitialStatus({ kds: { enabled: true } }, 'Customer')).toBe('Pending');

    // When KDS is disabled (Traditional Uzbek Choyxona / Direct POS)
    expect(determineInitialStatus({ kds: { enabled: false } }, 'POS')).toBe('Ready');
    expect(determineInitialStatus({ kds: { enabled: false } }, 'Customer')).toBe('Ready');
  });

  it('should immediately free table and mark order completed upon settlement', () => {
    const table = {
      tableNumber: '03',
      status: 'OCCUPIED',
      currentOrderId: 'ord-888',
      currentTotal: 240000,
      itemCount: 4
    };

    const settleTablePayment = (tbl, order, paymentMethod) => {
      order.status = 'Completed';
      order.paymentMethod = paymentMethod;
      
      // Auto-free table logic
      tbl.status = 'FREE';
      tbl.currentOrderId = null;
      tbl.currentOrderNumber = null;
      tbl.currentTotal = 0;
      tbl.itemCount = 0;
      return { success: true, table: tbl, order };
    };

    const order = { _id: 'ord-888', status: 'Preparing', total: 240000 };
    const result = settleTablePayment(table, order, 'Naqd');

    expect(result.order.status).toBe('Completed');
    expect(result.order.paymentMethod).toBe('Naqd');
    expect(result.table.status).toBe('FREE');
    expect(result.table.currentOrderId).toBe(null);
    expect(result.table.currentTotal).toBe(0);
  });
});
