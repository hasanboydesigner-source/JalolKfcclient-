import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  passcode: { type: String, required: true },
  role: { type: String, enum: ['admin', 'seller'], default: 'seller' },
  avatar: { type: String, default: '' },
  active: { type: Boolean, default: true }
}, { timestamps: true });

// Helper to verify passcode (supports bcrypt hash or legacy plaintext with auto-upgrade)
userSchema.methods.comparePasscode = async function (candidatePin) {
  if (!this.passcode) return false;

  // If already bcrypt hash ($2a$ or $2b$)
  if (this.passcode.startsWith('$2a$') || this.passcode.startsWith('$2b$')) {
    return await bcrypt.compare(String(candidatePin), this.passcode);
  }

  // Legacy plaintext match
  if (this.passcode === String(candidatePin)) {
    // Auto-migrate to bcrypt hash
    this.passcode = await bcrypt.hash(String(candidatePin), 10);
    await this.save();
    return true;
  }

  return false;
};

const User = mongoose.model('User', userSchema);
export default User;
