import { z } from 'zod';

export const INDUSTRY_TEMPLATES = {
  restaurant: {
    id: 'restaurant',
    label: "Milliy Taomlar / Oshxona",
    icon: '🍲',
    tagline: 'O‘zbek milliy taomlari va shashliklar',
    placeholderName: "Masalan: To‘y oshi, Qozon kabob, Lag‘mon, Somsa",
    categories: [
      { id: 'first_courses', name: '1-taomlar (Sho‘rvalar)', icon: 'soup' },
      { id: 'second_courses', name: '2-taomlar (Osh/Kabob)', icon: 'meat' },
      { id: 'shashlik', name: 'Shashlik va Kaboblar', icon: 'meat' },
      { id: 'somsa', name: 'Somsa va Pishiriqlar', icon: 'bread' },
      { id: 'salads', name: 'Salatlar va Gazaklar', icon: 'salad' },
      { id: 'bread', name: 'Nonlar va Patirlar', icon: 'bread' },
      { id: 'tea_drinks', name: 'Choylar va Ichimliklar', icon: 'tea' },
      { id: 'desserts', name: 'Shirinliklar', icon: 'cake' }
    ],
    defaultTags: ['Standart', 'Qo‘y go‘shti', 'Mol go‘shti', 'Yog‘siz', 'Achchiq', 'Porsiya', 'Yarim (0.5)', 'Maxsus', '1 kg'],
    defaultUnits: ['porsiya', 'yarim', 'dona', 'kg', 'kosa', 'choynak']
  },
  teahouse: {
    id: 'teahouse',
    label: "Choyxona / Palov Markazi",
    icon: '🫖',
    tagline: 'Choyxona palov, shashlik va choylar',
    placeholderName: "Masalan: Choyxona palov, 1 kg Osh, Qo‘y shashlik",
    categories: [
      { id: 'palov', name: 'Palov & Qozon taomlari', icon: 'meat' },
      { id: 'shashlik', name: 'Shashliklar (Qo‘y, Mol, Dumba)', icon: 'meat' },
      { id: 'soups', name: 'Quyuq & Suyuq taomlar', icon: 'soup' },
      { id: 'tea', name: 'Choylar & Choynaklar', icon: 'tea' },
      { id: 'salads', name: 'Salat & Suzmalar', icon: 'salad' },
      { id: 'bread', name: 'Non & Patirlar', icon: 'bread' },
      { id: 'drinks', name: 'Salqin ichimliklar', icon: 'drink' }
    ],
    defaultTags: ['Standart', 'Dumba-jigar', 'Qo‘y go‘shti', '1 choynak', '1 kg', 'Maxsus', 'Zanjabilli'],
    defaultUnits: ['porsiya', 'kg', 'choynak', 'dona', 'yarim']
  },
  cafe: {
    id: 'cafe',
    label: "Kafe / Qahvaxona",
    icon: '☕',
    tagline: 'Qahva, desertlar va yengil taomlar',
    placeholderName: "Masalan: Kapuchino, Kruassan, Sezar salati",
    categories: [
      { id: 'coffee', name: 'Qahvalar (Coffee)', icon: 'coffee' },
      { id: 'tea_drinks', name: 'Choylar & Limonadlar', icon: 'tea' },
      { id: 'breakfast', name: 'Nonushtalar (Breakfast)', icon: 'utensils' },
      { id: 'main_courses', name: 'Asosiy taomlar & Pasta', icon: 'utensils' },
      { id: 'salads', name: 'Salatlar & Supalar', icon: 'salad' },
      { id: 'desserts', name: 'Desertlar & Tortlar', icon: 'cake' },
      { id: 'snacks', name: 'Sneklar & Sendvichlar', icon: 'wrap' }
    ],
    defaultTags: ['Standart', 'Kichik (S)', 'O‘rta (M)', 'Katta (L)', 'Muzli', 'Issiq', 'Bodom suti', 'Shakarsiz'],
    defaultUnits: ['dona', 'porsiya', 'litr']
  },
  fastfood: {
    id: 'fastfood',
    label: "Fast Food / Burgerxona",
    icon: '🍔',
    tagline: 'Burger, lavash, pitsa va sneklar',
    placeholderName: "Masalan: Klassik Burger, Sirli Lavash, Fri",
    categories: [
      { id: 'burgers', name: 'Burgerlar', icon: 'burger' },
      { id: 'lavash', name: 'Lavash & Donarlar', icon: 'wrap' },
      { id: 'pizza', name: 'Pitsalar', icon: 'pizza' },
      { id: 'buckets', name: 'Tovuq & Qanotlar', icon: 'bucket' },
      { id: 'combo', name: 'Kombolar', icon: 'combo' },
      { id: 'drinks', name: 'Ichimliklar', icon: 'drink' },
      { id: 'sides', name: 'Gazaklar & Fri', icon: 'side' },
      { id: 'desserts', name: 'Desertlar', icon: 'icecream' },
      { id: 'sauces', name: 'Souslar', icon: 'sauce' }
    ],
    defaultTags: ['Standart', 'Achchiq', 'Pishloqli', 'Double', 'Go‘shtli', 'Katta'],
    defaultUnits: ['dona', 'porsiya', 'litr']
  },
  custom: {
    id: 'custom',
    label: "Universal / Erkin",
    icon: '🍽️',
    tagline: 'Restoran, kafe va ovqatlanish markazi',
    placeholderName: "Masalan: Taom yoki mahsulot nomi",
    categories: [
      { id: 'main', name: 'Asosiy taomlar', icon: 'utensils' },
      { id: 'drinks', name: 'Ichimliklar', icon: 'drink' },
      { id: 'salads', name: 'Salatlar', icon: 'salad' },
      { id: 'desserts', name: 'Desertlar', icon: 'cake' }
    ],
    defaultTags: ['Standart', 'Maxsus', 'Yangi', 'Xit'],
    defaultUnits: ['dona', 'porsiya', 'kg', 'litr']
  }
};

export const DEFAULT_SETTINGS = {
  business: {
    name: 'Jalol Restoran',
    tagline: 'Milliy taomlar, Oshxona va Kafe',
    businessType: 'restaurant', // 'restaurant' | 'teahouse' | 'cafe' | 'fastfood' | 'custom'
    logoUrl: '',
    phone: '+998 (99) 000-00-00',
    address: 'Namangan viloyati, Chust Shahri',
    contactEmail: ''
  },
  categories: INDUSTRY_TEMPLATES.restaurant.categories,
  branding: {
    primaryColor: '#EF4444',
    accentColor: '#F59E0B',
    themeMode: 'light', // 'light' | 'dark' | 'auto'
    borderRadius: 'rounded', // 'sharp' | 'rounded' | 'pill'
    faviconUrl: '/chicken.png'
  },
  localization: {
    defaultLanguage: 'uz', // 'uz' | 'ru' | 'en'
    enabledLanguages: ['uz', 'ru', 'en'],
    currencyCode: 'UZS',
    currencySymbol: "so'm",
    currencyPosition: 'after', // 'before' | 'after'
    decimals: 0,
    timezone: 'Asia/Tashkent'
  },
  pricing: {
    taxEnabled: true,
    taxRate: 5.0,
    taxLabel: 'QQS',
    taxInclusive: false,
    serviceFeeEnabled: false,
    serviceFeeRate: 0.0,
    roundingRule: 'none' // 'none' | 'floor' | 'ceil' | 'round'
  },
  orders: {
    orderNumberPrefix: '#',
    orderNumberPadding: 3,
    dailyReset: true,
    tableCount: 20,
    serviceMode: 'dine_in_first', // 'dine_in_first' (Choyxona / Restoran) | 'fast_food' (Fast Food / QSR)
    allowedOrderTypes: ['Zalda', 'Olib ketish', 'Yetkazib'],
    paymentMethods: ['Naqd', 'Karta', 'QR'],
    defaultCashierName: 'Sotuvchi #042'
  },
  receipt: {
    paperWidth: '80mm', // '58mm' | '80mm'
    showLogo: false,
    headerNote: '',
    footerNote: 'XARIDINGIZ UCHUN RAHMAT!',
    showTaxBreakdown: true,
    showQrCode: false
  },
  kiosk: {
    idleTimeoutSeconds: 120,
    welcomeHeading: 'Taste the Excellence.',
    welcomeSubheading: "O'zgacha ta'm va sifat uyg'unligi",
    heroImageUrl: '/images/hero-burger.png',
    smartRecommendations: true
  },
  kds: {
    enabled: true, // Master toggle: true (Oshxona ekrani faol) | false (Oddiy kassa/choyxona rejimi)
    soundEnabled: true,
    soundUrl: '/bell.wav',
    voiceAnnouncement: true,
    voicePhraseUz: 'Yangi buyurtma',
    warningThresholdMinutes: 15
  },
  statusScreen: {
    chimeSoundEnabled: true,
    chimeSoundUrl: 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3',
    readyOrderDurationSec: 180
  },
  notifications: {
    telegramEnabled: false,
    telegramToken: '',
    telegramChatId: '',
    telegramIncludeImage: true
  },
  security: {
    sessionTimeoutMinutes: 480,
    maxFailedLogins: 5,
    lockoutDurationMinutes: 15
  },
  system: {
    schemaVersion: 1,
    allowDataExport: true
  }
};

export const settingsSchema = z.object({
  business: z.object({
    name: z.string().min(1).max(100),
    tagline: z.string().max(150).optional().default(''),
    businessType: z.enum(['restaurant', 'teahouse', 'cafe', 'fastfood', 'custom']).optional().default('restaurant'),
    logoUrl: z.string().optional().default(''),
    phone: z.string().max(50).optional().default(''),
    address: z.string().max(200).optional().default(''),
    contactEmail: z.string().email().or(z.literal('')).optional().default('')
  }).default(DEFAULT_SETTINGS.business),

  categories: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    icon: z.string().optional().default('utensils')
  })).optional().default(DEFAULT_SETTINGS.categories),

  branding: z.object({
    primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
    accentColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/),
    themeMode: z.enum(['light', 'dark', 'auto']).default('light'),
    borderRadius: z.enum(['sharp', 'rounded', 'pill']).default('rounded'),
    faviconUrl: z.string().optional().default('/chicken.png')
  }).default(DEFAULT_SETTINGS.branding),

  localization: z.object({
    defaultLanguage: z.enum(['uz', 'ru', 'en']).default('uz'),
    enabledLanguages: z.array(z.enum(['uz', 'ru', 'en'])).min(1),
    currencyCode: z.string().min(1).max(10),
    currencySymbol: z.string().min(1).max(10),
    currencyPosition: z.enum(['before', 'after']).default('after'),
    decimals: z.number().int().min(0).max(2).default(0),
    timezone: z.string().default('Asia/Tashkent')
  }).default(DEFAULT_SETTINGS.localization),

  pricing: z.object({
    taxEnabled: z.boolean().default(true),
    taxRate: z.number().min(0).max(100).default(5.0),
    taxLabel: z.string().min(1).max(30).default('QQS'),
    taxInclusive: z.boolean().default(false),
    serviceFeeEnabled: z.boolean().default(false),
    serviceFeeRate: z.number().min(0).max(100).default(0),
    roundingRule: z.enum(['none', 'floor', 'ceil', 'round']).default('none')
  }).default(DEFAULT_SETTINGS.pricing),

  orders: z.object({
    orderNumberPrefix: z.string().max(10).default('#'),
    orderNumberPadding: z.number().int().min(1).max(6).default(3),
    dailyReset: z.boolean().default(true),
    tableCount: z.number().int().min(1).max(500).default(20),
    serviceMode: z.enum(['dine_in_first', 'fast_food']).default('dine_in_first'),
    allowedOrderTypes: z.array(z.string()).min(1),
    paymentMethods: z.array(z.string()).min(1),
    defaultCashierName: z.string().max(50).default('Sotuvchi #042')
  }).default(DEFAULT_SETTINGS.orders),

  receipt: z.object({
    paperWidth: z.enum(['58mm', '80mm']).default('80mm'),
    showLogo: z.boolean().default(false),
    headerNote: z.string().max(200).optional().default(''),
    footerNote: z.string().max(200).optional().default('XARIDINGIZ UCHUN RAHMAT!'),
    showTaxBreakdown: z.boolean().default(true),
    showQrCode: z.boolean().default(false)
  }).default(DEFAULT_SETTINGS.receipt),

  kiosk: z.object({
    idleTimeoutSeconds: z.number().int().min(15).max(600).default(120),
    welcomeHeading: z.string().max(100),
    welcomeSubheading: z.string().max(150),
    heroImageUrl: z.string(),
    smartRecommendations: z.boolean().default(true)
  }).default(DEFAULT_SETTINGS.kiosk),

  kds: z.object({
    enabled: z.boolean().default(true),
    soundEnabled: z.boolean().default(true),
    soundUrl: z.string().default('/bell.wav'),
    voiceAnnouncement: z.boolean().default(true),
    voicePhraseUz: z.string().max(100).default('Yangi buyurtma'),
    warningThresholdMinutes: z.number().int().min(1).max(120).default(15)
  }).default(DEFAULT_SETTINGS.kds),

  statusScreen: z.object({
    chimeSoundEnabled: z.boolean().default(true),
    chimeSoundUrl: z.string().default('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3'),
    readyOrderDurationSec: z.number().int().min(10).max(600).default(180)
  }).default(DEFAULT_SETTINGS.statusScreen),

  notifications: z.object({
    telegramEnabled: z.boolean().default(false),
    telegramToken: z.string().optional().default(''),
    telegramChatId: z.string().optional().default(''),
    telegramIncludeImage: z.boolean().default(true)
  }).default(DEFAULT_SETTINGS.notifications),

  security: z.object({
    sessionTimeoutMinutes: z.number().int().min(15).max(1440).default(480),
    maxFailedLogins: z.number().int().min(3).max(20).default(5),
    lockoutDurationMinutes: z.number().int().min(1).max(60).default(15)
  }).default(DEFAULT_SETTINGS.security),

  system: z.object({
    schemaVersion: z.number().int().default(1),
    allowDataExport: z.boolean().default(true)
  }).default(DEFAULT_SETTINGS.system)
});

/**
 * Filter sensitive fields for public clients (POS, Kiosk, Status Screen)
 */
export function sanitizePublicSettings(settings) {
  const plain = typeof settings.toObject === 'function' ? settings.toObject() : { ...settings };
  
  return {
    business: plain.business,
    categories: plain.categories || DEFAULT_SETTINGS.categories,
    branding: plain.branding,
    localization: plain.localization,
    pricing: plain.pricing,
    orders: plain.orders,
    receipt: plain.receipt,
    kiosk: plain.kiosk,
    kds: plain.kds,
    statusScreen: plain.statusScreen,
    system: {
      schemaVersion: plain.system?.schemaVersion || 1
    },
    updatedAt: plain.updatedAt
  };
}

/**
 * Mask secret fields for Admin UI presentation
 */
export function maskSensitiveSettings(settings) {
  const plain = typeof settings.toObject === 'function' ? settings.toObject() : { ...settings };
  const notifications = { ...plain.notifications };

  if (notifications.telegramToken) {
    const raw = notifications.telegramToken;
    notifications.telegramTokenMasked = raw.length > 8 
      ? `••••••••${raw.slice(-4)}` 
      : '••••••••';
    notifications.isTelegramTokenSet = true;
    delete notifications.telegramToken; // Do not send raw secret to client
  } else {
    notifications.telegramTokenMasked = '';
    notifications.isTelegramTokenSet = false;
  }

  return {
    ...plain,
    notifications
  };
}
