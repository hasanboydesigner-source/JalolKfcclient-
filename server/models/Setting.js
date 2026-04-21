import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  passcode: { type: String, default: '2024' },
}, { timestamps: true });

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
