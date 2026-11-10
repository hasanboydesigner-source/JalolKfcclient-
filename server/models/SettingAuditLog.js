import mongoose from 'mongoose';

const settingAuditLogSchema = new mongoose.Schema({
  section: { type: String, required: true },
  changedBy: { type: String, default: 'admin' },
  previousValues: { type: mongoose.Schema.Types.Mixed },
  newValues: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

const SettingAuditLog = mongoose.model('SettingAuditLog', settingAuditLogSchema);
export default SettingAuditLog;
