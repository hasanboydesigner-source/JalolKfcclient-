import mongoose from 'mongoose';
import { DEFAULT_SETTINGS } from '../../shared/settingsDefaults.js';

const settingSchema = new mongoose.Schema({
  // Legacy support field during migration
  passcode: { type: String },

  business: {
    name: { type: String, default: DEFAULT_SETTINGS.business.name },
    tagline: { type: String, default: DEFAULT_SETTINGS.business.tagline },
    businessType: { type: String, default: 'restaurant' },
    logoUrl: { type: String, default: DEFAULT_SETTINGS.business.logoUrl },
    phone: { type: String, default: DEFAULT_SETTINGS.business.phone },
    address: { type: String, default: DEFAULT_SETTINGS.business.address },
    contactEmail: { type: String, default: DEFAULT_SETTINGS.business.contactEmail }
  },

  categories: {
    type: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      icon: { type: String, default: 'utensils' }
    }],
    default: DEFAULT_SETTINGS.categories
  },

  branding: {
    primaryColor: { type: String, default: DEFAULT_SETTINGS.branding.primaryColor },
    accentColor: { type: String, default: DEFAULT_SETTINGS.branding.accentColor },
    themeMode: { type: String, enum: ['light', 'dark', 'auto'], default: DEFAULT_SETTINGS.branding.themeMode },
    borderRadius: { type: String, enum: ['sharp', 'rounded', 'pill'], default: DEFAULT_SETTINGS.branding.borderRadius },
    faviconUrl: { type: String, default: DEFAULT_SETTINGS.branding.faviconUrl }
  },

  localization: {
    defaultLanguage: { type: String, default: DEFAULT_SETTINGS.localization.defaultLanguage },
    enabledLanguages: { type: [String], default: DEFAULT_SETTINGS.localization.enabledLanguages },
    currencyCode: { type: String, default: DEFAULT_SETTINGS.localization.currencyCode },
    currencySymbol: { type: String, default: DEFAULT_SETTINGS.localization.currencySymbol },
    currencyPosition: { type: String, enum: ['before', 'after'], default: DEFAULT_SETTINGS.localization.currencyPosition },
    decimals: { type: Number, default: DEFAULT_SETTINGS.localization.decimals },
    timezone: { type: String, default: DEFAULT_SETTINGS.localization.timezone }
  },

  pricing: {
    taxEnabled: { type: Boolean, default: DEFAULT_SETTINGS.pricing.taxEnabled },
    taxRate: { type: Number, default: DEFAULT_SETTINGS.pricing.taxRate },
    taxLabel: { type: String, default: DEFAULT_SETTINGS.pricing.taxLabel },
    taxInclusive: { type: Boolean, default: DEFAULT_SETTINGS.pricing.taxInclusive },
    serviceFeeEnabled: { type: Boolean, default: DEFAULT_SETTINGS.pricing.serviceFeeEnabled },
    serviceFeeRate: { type: Number, default: DEFAULT_SETTINGS.pricing.serviceFeeRate },
    roundingRule: { type: String, default: DEFAULT_SETTINGS.pricing.roundingRule }
  },

  orders: {
    orderNumberPrefix: { type: String, default: DEFAULT_SETTINGS.orders.orderNumberPrefix },
    orderNumberPadding: { type: Number, default: DEFAULT_SETTINGS.orders.orderNumberPadding },
    dailyReset: { type: Boolean, default: DEFAULT_SETTINGS.orders.dailyReset },
    tableCount: { type: Number, default: DEFAULT_SETTINGS.orders.tableCount },
    serviceMode: { type: String, enum: ['dine_in_first', 'fast_food'], default: DEFAULT_SETTINGS.orders.serviceMode },
    allowedOrderTypes: { type: [String], default: DEFAULT_SETTINGS.orders.allowedOrderTypes },
    paymentMethods: { type: [String], default: DEFAULT_SETTINGS.orders.paymentMethods },
    defaultCashierName: { type: String, default: DEFAULT_SETTINGS.orders.defaultCashierName }
  },

  receipt: {
    paperWidth: { type: String, default: DEFAULT_SETTINGS.receipt.paperWidth },
    showLogo: { type: Boolean, default: DEFAULT_SETTINGS.receipt.showLogo },
    headerNote: { type: String, default: DEFAULT_SETTINGS.receipt.headerNote },
    footerNote: { type: String, default: DEFAULT_SETTINGS.receipt.footerNote },
    showTaxBreakdown: { type: Boolean, default: DEFAULT_SETTINGS.receipt.showTaxBreakdown },
    showQrCode: { type: Boolean, default: DEFAULT_SETTINGS.receipt.showQrCode }
  },

  kiosk: {
    idleTimeoutSeconds: { type: Number, default: DEFAULT_SETTINGS.kiosk.idleTimeoutSeconds },
    welcomeHeading: { type: String, default: DEFAULT_SETTINGS.kiosk.welcomeHeading },
    welcomeSubheading: { type: String, default: DEFAULT_SETTINGS.kiosk.welcomeSubheading },
    heroImageUrl: { type: String, default: DEFAULT_SETTINGS.kiosk.heroImageUrl },
    smartRecommendations: { type: Boolean, default: DEFAULT_SETTINGS.kiosk.smartRecommendations }
  },

  kds: {
    enabled: { type: Boolean, default: DEFAULT_SETTINGS.kds.enabled },
    soundEnabled: { type: Boolean, default: DEFAULT_SETTINGS.kds.soundEnabled },
    soundUrl: { type: String, default: DEFAULT_SETTINGS.kds.soundUrl },
    voiceAnnouncement: { type: Boolean, default: DEFAULT_SETTINGS.kds.voiceAnnouncement },
    voicePhraseUz: { type: String, default: DEFAULT_SETTINGS.kds.voicePhraseUz },
    warningThresholdMinutes: { type: Number, default: DEFAULT_SETTINGS.kds.warningThresholdMinutes }
  },

  statusScreen: {
    chimeSoundEnabled: { type: Boolean, default: DEFAULT_SETTINGS.statusScreen.chimeSoundEnabled },
    chimeSoundUrl: { type: String, default: DEFAULT_SETTINGS.statusScreen.chimeSoundUrl },
    readyOrderDurationSec: { type: Number, default: DEFAULT_SETTINGS.statusScreen.readyOrderDurationSec }
  },

  notifications: {
    telegramEnabled: { type: Boolean, default: DEFAULT_SETTINGS.notifications.telegramEnabled },
    telegramToken: { type: String, default: DEFAULT_SETTINGS.notifications.telegramToken },
    telegramChatId: { type: String, default: DEFAULT_SETTINGS.notifications.telegramChatId },
    telegramIncludeImage: { type: Boolean, default: DEFAULT_SETTINGS.notifications.telegramIncludeImage }
  },

  security: {
    sessionTimeoutMinutes: { type: Number, default: DEFAULT_SETTINGS.security.sessionTimeoutMinutes },
    maxFailedLogins: { type: Number, default: DEFAULT_SETTINGS.security.maxFailedLogins },
    lockoutDurationMinutes: { type: Number, default: DEFAULT_SETTINGS.security.lockoutDurationMinutes }
  },

  system: {
    schemaVersion: { type: Number, default: DEFAULT_SETTINGS.system.schemaVersion },
    allowDataExport: { type: Boolean, default: DEFAULT_SETTINGS.system.allowDataExport }
  },

  updatedBy: { type: String, default: 'system' }
}, {
  timestamps: true
});

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
