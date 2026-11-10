import mongoose from 'mongoose';

const orderCounterSchema = new mongoose.Schema({
  date: { type: String, required: true, unique: true }, // Format: YYYY-MM-DD in business timezone
  seq: { type: Number, default: 0 }
});

const OrderCounter = mongoose.model('OrderCounter', orderCounterSchema);
export default OrderCounter;
