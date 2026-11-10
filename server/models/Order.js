import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true },
  idempotencyKey: { type: String, sparse: true },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: String,
      price: Number,
      qty: Number,
      unit: { type: String, default: 'dona' },
      tag: { type: String, default: '' },
      image: String
    }
  ],
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  total: { type: Number, required: true },
  currencySnapshot: { type: String, default: "so'm" },
  taxRateSnapshot: { type: Number, default: 5 },
  tableNumber: { type: String, default: null },
  source: { type: String, enum: ['POS', 'Customer', 'Kiosk'], default: 'POS' },
  orderType: { type: String, default: 'Zalda' },
  paymentMethod: { type: String, default: 'Naqd' },
  status: { type: String, enum: ['Pending', 'Preparing', 'Ready', 'Completed', 'Cancelled'], default: 'Pending' }
}, {
  timestamps: true
});

// Performance and uniqueness indexes
orderSchema.index({ createdAt: -1, status: 1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;
