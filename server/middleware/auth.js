import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';

const JWT_SECRET = process.env.JWT_SECRET || 'restaurant_pos_secret_key_change_in_production_2026';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 login attempts per IP per 15 min
  message: { success: false, message: 'Juda ko‘p urinish qilindi. Iltimos, 15 daqiqadan so‘ng qayta urinib ko‘ring.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const signToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      name: user.name, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
};

export const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Avtorizatsiyadan o‘tilmagan' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (_err) {
    return res.status(401).json({ success: false, message: 'Yaroqsiz yoki muddati o‘tgan token' });
  }
};

export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Ushbu amalni bajarish uchun huquq yetarli emas' });
    }
    next();
  };
};
