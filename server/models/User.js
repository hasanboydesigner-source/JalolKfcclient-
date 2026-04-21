import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  passcode: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'seller'], default: 'seller' },
  avatar: { type: String, default: '' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
export default User;
