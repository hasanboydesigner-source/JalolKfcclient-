import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  Building2, Palette, Globe2, ReceiptText, 
  Tv2, ChefHat, MonitorDot, BellRing, 
  SlidersHorizontal, Database, X, Save, 
  Send, Download, Upload, Printer, Layers, Plus, Trash2,
  ShieldAlert, RotateCcw, AlertTriangle, Lock
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useLanguage } from '../context/LanguageContext';
import { INDUSTRY_TEMPLATES } from '../../shared/settingsDefaults';

export default function SettingsModal({ isOpen, onClose }) {
  const { settings, updateSection } = useSettings();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('business');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('utensils');
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);
  const [cleanupTarget, setCleanupTarget] = useState(null);
  const [adminPin, setAdminPin] = useState('');
  const [isCleaning, setIsCleaning] = useState(false);

  // Sync form data when tab changes or settings load
  useEffect(() => {
    if (settings && activeTab) {
      if (activeTab === 'categories') {
        const cats = settings.categories || INDUSTRY_TEMPLATES[settings.business?.businessType || 'restaurant']?.categories || [];
        setFormData(JSON.parse(JSON.stringify(cats)));
      } else {
        setFormData(settings[activeTab] ? JSON.parse(JSON.stringify(settings[activeTab])) : {});
      }
    }
  }, [settings, activeTab]);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const slug = newCatName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
    const existing = Array.isArray(formData) ? formData : (settings?.categories || []);
    if (existing.some(c => c.id === slug)) {
      toast.warning("Bunday kategoriya allaqachon mavjud");
      return;
    }
    const updated = [...existing, { id: slug, name: newCatName.trim(), icon: newCatIcon }];
    setFormData(updated);
    setNewCatName('');
  };

  const handleDeleteCategory = (catId) => {
    if (confirm("Haqiqatan ham ushbu kategoriyani o'chirmoqchimisiz?")) {
      const existing = Array.isArray(formData) ? formData : (settings?.categories || []);
      const updated = existing.filter(c => c.id !== catId);
      setFormData(updated);
    }
  };

  const handleResetCategoriesToTemplate = () => {
    const bType = formData?.businessType || settings?.business?.businessType || 'restaurant';
    const tmpl = INDUSTRY_TEMPLATES[bType] || INDUSTRY_TEMPLATES.restaurant;
    if (confirm(`Kategoriyalarni "${tmpl.label}" andazasi bo'yicha tiklamoqchimisiz?`)) {
      setFormData(JSON.parse(JSON.stringify(tmpl.categories)));
    }
  };

  const handleSaveSection = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      const success = await updateSection(activeTab, formData);
      if (success) {
        toast.success(t('update_success') || 'Sozlamalar saqlandi!');
      } else {
        toast.error('Sozlamalarni saqlashda xatolik yuz berdi');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestTelegram = async () => {
    setTestingTelegram(true);
    try {
      const token = localStorage.getItem('pos_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post('/api/settings/test-telegram', {
        token: formData.telegramToken,
        chatId: formData.telegramChatId
      }, { headers });

      if (res.data.success) {
        toast.success(res.data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Telegramga ulanishda xatolik');
    } finally {
      setTestingTelegram(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `restaurant_settings_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          if (confirm("Haqiqatan ham barcha sozlamalarni ushbu fayldan yangilamoqchimisiz?")) {
            for (const section of Object.keys(parsed)) {
              if (settings[section]) {
                await updateSection(section, parsed[section]);
              }
            }
            toast.success("Barcha sozlamalar muvaffaqiyatli import qilindi!");
          }
        } catch (error) {
          toast.error("JSON fayli yaroqsiz: " + error.message);
        }
      };
    }
  };

  const CLEANUP_OPTIONS = [
    {
      id: 'orders',
      title: "Kassa va Buyurtmalar Tarixi",
      desc: "Barcha bajarilgan va bekor qilingan buyurtmalar, chek hisoblagichlarini tozalash hamda faol stollarni nolga tushirish.",
      badge: "Kassa hisobotlari",
      badgeType: "warning",
      btnLabel: "Buyurtmalarni tozalash",
      btnClass: "danger-soft",
      warningText: "Barcha savdo va kassa hisobotlari, Z-hisobotlar va cheklar tarixi butunlay o‘chiriladi."
    },
    {
      id: 'tables',
      title: "Stollar Holati va Bandliklar",
      desc: "Barcha band yoki hisob kutilayotgan stollarni bo‘sh holatga (FREE) o‘tkazish. Savdo tarixiga tegilmaydi.",
      badge: "Stollar zali",
      badgeType: "info",
      btnLabel: "Stollarni bo‘shatish",
      btnClass: "neutral",
      warningText: "Zaldagi barcha stollar holati bo‘sh holatga o‘tkaziladi va faol ochilgan hisoblar yopiladi."
    },
    {
      id: 'products',
      title: "Mahsulotlar Katalogi (Menyu)",
      desc: "Barcha taomlar, sneklar va ichimliklarni menyudan butunlay o‘chirish (noldan yangi menyu kiritish uchun).",
      badge: "Taomlar menyusi",
      badgeType: "warning",
      btnLabel: "Menyuni tozalash",
      btnClass: "danger-soft",
      warningText: "Barcha taomlar va mahsulotlar o‘chiriladi. Buyurtmalar tarixidagi yozuvlar saqlanadi."
    },
    {
      id: 'audit_logs',
      title: "Tizim va Xavfsizlik Jurnallari",
      desc: "Sozlamalarni o‘zgartirish tarixi, audit loglari va tizim jurnallarini tozalash.",
      badge: "Audit jurnali",
      badgeType: "neutral",
      btnLabel: "Audit jurnalini tozalash",
      btnClass: "neutral",
      warningText: "Sozlamalar va operatsiyalar o‘zgarish jurnallari tarixi tozalanadi."
    },
    {
      id: 'all_data',
      title: "Zavod Sozlamalariga Qaytarish (Full Factory Reset)",
      desc: "Barcha buyurtmalar, stollar, mahsulotlar menyusi va audit jurnallarini to‘liq tozalash. Tizim noldan yangi holatga keladi.",
      badge: "To‘liq tozalash",
      badgeType: "critical",
      btnLabel: "Tizimni to‘liq reset qilish",
      btnClass: "danger-solid",
      warningText: "DIQQAT! Barcha buyurtmalar, hisobotlar, stollar va mahsulotlar bazadan butunlay yo‘q qilinadi. Faqat Administrator hisobi va tizim sozlamalari saqlanadi!"
    }
  ];

  const handleOpenCleanupConfirm = (target) => {
    setCleanupTarget(target);
    setAdminPin('');
    setCleanupModalOpen(true);
  };

  const handleExecuteCleanup = async (e) => {
    e.preventDefault();
    if (!adminPin || adminPin.length < 4) {
      return toast.error('Iltimos, administrator PIN-kodini to‘liq kiriting (4-8 ta raqam)');
    }

    setIsCleaning(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post('/api/settings/database-cleanup', {
        category: cleanupTarget.id,
        adminPin
      }, { headers });

      if (res.data.success) {
        toast.success(res.data.message || 'Tozalash muvaffaqiyatli amalga oshirildi!');
        setCleanupModalOpen(false);
        setAdminPin('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Xatolik yuz berdi');
    } finally {
      setIsCleaning(false);
    }
  };

  const tabGroups = [
    {
      group: 'Asosiy Boshqaruv',
      tabs: [
        { id: 'business', label: 'Biznes profili', icon: Building2 },
        { id: 'categories', label: 'Kategoriyalar', icon: Layers },
        { id: 'branding', label: 'Brend va Ko‘rinish', icon: Palette },
        { id: 'localization', label: 'Til va Valyuta', icon: Globe2 },
      ]
    },
    {
      group: 'Kassa va Savdo',
      tabs: [
        { id: 'pricing', label: 'Narxlar va Soliq', icon: SlidersHorizontal },
        { id: 'orders', label: 'Buyurtmalar va Stollar', icon: MonitorDot },
        { id: 'receipt', label: 'Chek va Printer', icon: ReceiptText },
      ]
    },
    {
      group: 'Ekranlar va Qurilmalar',
      tabs: [
        { id: 'kiosk', label: 'Mijozlar Kioski', icon: Tv2 },
        { id: 'kds', label: 'Oshxona Displeyi (KDS)', icon: ChefHat },
        { id: 'statusScreen', label: 'Buyurtmalar Ekrani', icon: MonitorDot },
      ]
    },
    {
      group: 'Tizim va Xabarlar',
      tabs: [
        { id: 'notifications', label: 'Telegram va Xabarlar', icon: BellRing },
        { id: 'system', label: 'Tizim va Zaxira', icon: Database },
        { id: 'maintenance', label: 'Baza va Tozalash', icon: Trash2 },
      ]
    }
  ];

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal-dialog">
        <header className="settings-modal-header">
          <div className="header-titles">
            <h2>Tizim Sozlamalari</h2>
            <p>Muassasa profili, savdo parametrlari va qurilmalar integratsiyasi</p>
          </div>
          <button className="settings-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="settings-modal-body">
          {/* Navigation Sidebar */}
          <nav className="settings-nav-sidebar">
            {tabGroups.map((grp, gIdx) => (
              <div key={gIdx} className="settings-nav-group">
                <div className="settings-nav-group-title">{grp.group}</div>
                {grp.tabs.map(tab => {
                  const IconComp = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      <IconComp size={18} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Form Content Panel */}
          <div className="settings-form-panel">
            <form onSubmit={handleSaveSection} className="settings-form-container">
              <div className="settings-form-scrollable">
                {/* SECTION 1: BUSINESS PROFILE */}
                {activeTab === 'business' && (
                  <div className="settings-section">
                    <h3>Biznes Asosiy Ma‘lumotlari</h3>

                    <div className="form-group">
                      <label>Biznes yo‘nalishi (Soha shabloni)</label>
                      <div className="industry-template-grid">
                        {Object.values(INDUSTRY_TEMPLATES).map(tmpl => {
                          const isSelected = (formData.businessType || 'restaurant') === tmpl.id;
                          return (
                            <div
                              key={tmpl.id}
                              className={`industry-template-card ${isSelected ? 'active' : ''}`}
                              onClick={() => {
                                handleInputChange('businessType', tmpl.id);
                                if (!formData.tagline || formData.tagline.includes('Fast Food') || formData.tagline.includes('O‘zbek')) {
                                  handleInputChange('tagline', tmpl.tagline);
                                }
                              }}
                            >
                              <div className="tmpl-card-header">
                                <div className="tmpl-icon-box">{tmpl.icon}</div>
                                {isSelected && (
                                  <span className="tmpl-active-pill">
                                    <span className="tmpl-dot" />
                                    Faol
                                  </span>
                                )}
                              </div>
                              <div className="tmpl-info">
                                <span className="tmpl-title">{tmpl.label}</span>
                                <span className="tmpl-desc">{tmpl.tagline}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  <div className="form-group">
                    <label>Muassasa nomi</label>
                    <input 
                      type="text" 
                      value={formData.name || ''} 
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Masalan: Rayhon Milliy Taomlar, Choyxona #1 yoki Shaxrisabz Oshxonasi"
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Shior / Ta'rif</label>
                    <input 
                      type="text" 
                      value={formData.tagline || ''} 
                      onChange={(e) => handleInputChange('tagline', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Telefon raqam</label>
                    <input 
                      type="text" 
                      value={formData.phone || ''} 
                      onChange={(e) => handleInputChange('phone', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Manzil</label>
                    <input 
                      type="text" 
                      value={formData.address || ''} 
                      onChange={(e) => handleInputChange('address', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Aloqa uchun Email</label>
                    <input 
                      type="email" 
                      value={formData.contactEmail || ''} 
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)} 
                    />
                  </div>
                </div>
              )}

              {/* SECTION: CATEGORIES MANAGEMENT */}
              {activeTab === 'categories' && (
                <div className="settings-section">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3>Kategoriyalar Boshqaruvi</h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--pos-text-muted)' }}>
                        Oshxona, choyxona yoki kafe taomlari guruhlarini boshqaring
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetCategoriesToTemplate}
                      style={{
                        padding: '6px 14px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: 'var(--pos-surface-subtle, #f1f5f9)',
                        border: '1px solid var(--pos-border, #e2e8f0)',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                    >
                      Andaza bo‘yicha tiklash
                    </button>
                  </div>

                  {/* Add New Category Bar */}
                  <div className="category-add-bar">
                    <input
                      type="text"
                      placeholder="Yangi kategoriya nomi (masalan: 1-taomlar, Shashliklar, Choylar)..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                    />
                    <select
                      value={newCatIcon}
                      onChange={(e) => setNewCatIcon(e.target.value)}
                      style={{ width: '140px' }}
                    >
                      <option value="utensils">Taomlar</option>
                      <option value="soup">Sho‘rva / Suyuq</option>
                      <option value="meat">Osh / Kabob</option>
                      <option value="tea">Choylar</option>
                      <option value="coffee">Qahva</option>
                      <option value="bread">Non / Somsa</option>
                      <option value="salad">Salatlar</option>
                      <option value="cake">Shirinliklar</option>
                      <option value="drink">Ichimliklar</option>
                      <option value="burger">Fast Food</option>
                      <option value="pizza">Pitsa</option>
                    </select>
                    <button
                      type="button"
                      onClick={handleAddCategory}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0 16px',
                        background: 'var(--brand-primary, #ef4444)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <Plus size={16} /> Qo‘shish
                    </button>
                  </div>

                  {/* Categories List */}
                  <div className="categories-manage-grid">
                    {(Array.isArray(formData) ? formData : (settings?.categories || [])).map((cat, idx) => (
                      <div key={cat.id || idx} className="category-manage-card">
                        <div className="cat-card-left">
                          <span className="cat-card-icon">🏷️</span>
                          <div className="cat-card-details">
                            <span className="cat-card-name">{cat.name}</span>
                            <span className="cat-card-slug">ID: {cat.id} • Ikonka: {cat.icon || 'utensils'}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="cat-card-delete"
                          onClick={() => handleDeleteCategory(cat.id)}
                          title="O‘chirish"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION 2: BRANDING */}
              {activeTab === 'branding' && (
                <div className="settings-section">
                  <h3>Brend Ko‘rinishi va Ranglar</h3>
                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Asosiy Rang (Primary)</label>
                      <div className="color-picker-box">
                        <input 
                          type="color" 
                          value={formData.primaryColor || '#EF4444'} 
                          onChange={(e) => handleInputChange('primaryColor', e.target.value)} 
                        />
                        <span>{formData.primaryColor || '#EF4444'}</span>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Urg‘u Rangi (Accent)</label>
                      <div className="color-picker-box">
                        <input 
                          type="color" 
                          value={formData.accentColor || '#F59E0B'} 
                          onChange={(e) => handleInputChange('accentColor', e.target.value)} 
                        />
                        <span>{formData.accentColor || '#F59E0B'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Burchaklar radiusi</label>
                    <select 
                      value={formData.borderRadius || 'rounded'}
                      onChange={(e) => handleInputChange('borderRadius', e.target.value)}
                    >
                      <option value="sharp">To‘rtburchak (Sharp)</option>
                      <option value="rounded">Standart yumaloq (Rounded)</option>
                      <option value="pill">To‘liq silliq (Pill)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Mavzu rejimi (Theme)</label>
                    <select 
                      value={formData.themeMode || 'light'}
                      onChange={(e) => handleInputChange('themeMode', e.target.value)}
                    >
                      <option value="light">Yorug‘ (Light)</option>
                      <option value="dark">Qorong‘i (Dark)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* SECTION 3: LOCALIZATION */}
              {activeTab === 'localization' && (
                <div className="settings-section">
                  <h3>Til, Valyuta va Vaqt Mintaqasi</h3>
                  <div className="form-group">
                    <label>Asosiy standart til</label>
                    <select 
                      value={formData.defaultLanguage || 'uz'}
                      onChange={(e) => handleInputChange('defaultLanguage', e.target.value)}
                    >
                      <option value="uz">O‘zbekcha (UZ)</option>
                      <option value="ru">Русский (RU)</option>
                      <option value="en">English (EN)</option>
                    </select>
                  </div>

                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Valyuta belgisi</label>
                      <input 
                        type="text" 
                        value={formData.currencySymbol || "so'm"} 
                        onChange={(e) => handleInputChange('currencySymbol', e.target.value)} 
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Valyuta joylashuvi</label>
                      <select 
                        value={formData.currencyPosition || 'after'}
                        onChange={(e) => handleInputChange('currencyPosition', e.target.value)}
                      >
                        <option value="after">Summadan keyin (10 000 so'm)</option>
                        <option value="before">Summadan oldin ($ 10,000)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Vaqt mintaqasi (Timezone)</label>
                    <select 
                      value={formData.timezone || 'Asia/Tashkent'}
                      onChange={(e) => handleInputChange('timezone', e.target.value)}
                    >
                      <option value="Asia/Tashkent">O‘zbekiston (Asia/Tashkent - UTC+5)</option>
                      <option value="Asia/Almaty">Qozog‘iston (Asia/Almaty - UTC+5)</option>
                      <option value="Europe/Moscow">Moskva (Europe/Moscow - UTC+3)</option>
                      <option value="UTC">UTC (Standart)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* SECTION 4: PRICING & TAX */}
              {activeTab === 'pricing' && (
                <div className="settings-section">
                  <h3>Soliq va Narxlar Qoidalari</h3>
                  <div className="form-checkbox-group">
                    <input 
                      type="checkbox" 
                      id="taxEnabled"
                      checked={formData.taxEnabled || false} 
                      onChange={(e) => handleInputChange('taxEnabled', e.target.checked)} 
                    />
                    <label htmlFor="taxEnabled">Soliqni (QQS) hisoblashni yoqish</label>
                  </div>

                  {formData.taxEnabled && (
                    <div className="form-group-row">
                      <div className="form-group">
                        <label>Soliq nomi</label>
                        <input 
                          type="text" 
                          value={formData.taxLabel || 'QQS'} 
                          onChange={(e) => handleInputChange('taxLabel', e.target.value)} 
                        />
                      </div>
                      <div className="form-group">
                        <label>Soliq stavkasi (%)</label>
                        <input 
                          type="number" 
                          step="0.1"
                          min="0"
                          max="100"
                          value={formData.taxRate !== undefined ? formData.taxRate : 5} 
                          onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) || 0)} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 5: ORDERS & TABLES */}
              {activeTab === 'orders' && (
                <div className="settings-section">
                  <h3>Buyurtma Tartibi va Stollar</h3>
                  <div className="form-group-row">
                    <div className="form-group">
                      <label>Buyurtma prefiksi</label>
                      <input 
                        type="text" 
                        value={formData.orderNumberPrefix || '#'} 
                        onChange={(e) => handleInputChange('orderNumberPrefix', e.target.value)} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Raqam uzunligi (001 format)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="6"
                        value={formData.orderNumberPadding || 3} 
                        onChange={(e) => handleInputChange('orderNumberPadding', parseInt(e.target.value, 10) || 3)} 
                      />
                    </div>
                  </div>

                  <div className="form-checkbox-group">
                    <input 
                      type="checkbox" 
                      id="dailyReset"
                      checked={formData.dailyReset !== false} 
                      onChange={(e) => handleInputChange('dailyReset', e.target.checked)} 
                    />
                    <label htmlFor="dailyReset">Har kuni kechasi 00:00 da buyurtma raqamini #001 dan boshlash</label>
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>Bosh sahifa ish tartibi (POS start view)</label>
                    <select 
                      value={formData.serviceMode || 'dine_in_first'}
                      onChange={(e) => handleInputChange('serviceMode', e.target.value)}
                    >
                      <option value="dine_in_first">Choyxona / Restoran — Avval stollar zali chiqsin</option>
                      <option value="fast_food">Fast Food / QSR — Menyudan to‘g‘ridan-to‘g‘ri boshlash</option>
                    </select>
                    <p style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                      Choyxona va restoranda kassir avval stollar xaritasini ko‘radi va stolni tanlab buyurtma qabul qiladi.
                    </p>
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>Mavjud stollar soni</label>
                    <input 
                      type="number" 
                      min="1" 
                      max="200"
                      value={formData.tableCount || 20} 
                      onChange={(e) => handleInputChange('tableCount', parseInt(e.target.value, 10) || 20)} 
                    />
                  </div>
                </div>
              )}

              {/* SECTION 6: RECEIPT */}
              {activeTab === 'receipt' && (
                <div className="settings-section">
                  <h3>Chek va Printer Sozlamalari</h3>
                  <div className="form-group">
                    <label>Chek qog‘ozi eni</label>
                    <select 
                      value={formData.paperWidth || '80mm'}
                      onChange={(e) => handleInputChange('paperWidth', e.target.value)}
                    >
                      <option value="80mm">80 mm (Standart POS printer)</option>
                      <option value="58mm">58 mm (Ixcham mobil printer)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Chek ostidagi minnatdorchilik yozuvi</label>
                    <input 
                      type="text" 
                      value={formData.footerNote || 'XARIDINGIZ UCHUN RAHMAT!'} 
                      onChange={(e) => handleInputChange('footerNote', e.target.value)} 
                    />
                  </div>

                  <div className="form-checkbox-group">
                    <input 
                      type="checkbox" 
                      id="showTaxBreakdown"
                      checked={formData.showTaxBreakdown !== false} 
                      onChange={(e) => handleInputChange('showTaxBreakdown', e.target.checked)} 
                    />
                    <label htmlFor="showTaxBreakdown">Chekda soliq miqdorini alohida ko‘rsatish</label>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <button 
                      type="button" 
                      className="test-action-btn"
                      onClick={() => window.print()}
                    >
                      <Printer size={16} /> Test chekini chiqarish
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 7: KIOSK */}
              {activeTab === 'kiosk' && (
                <div className="settings-section">
                  <h3>Mijozlar Kioski (Self-Service)</h3>
                  <div className="form-group">
                    <label>Kutish taymeri (Harakatsizlikdan so‘ng qaytish, soniyalarda)</label>
                    <input 
                      type="number" 
                      min="15" 
                      max="600"
                      value={formData.idleTimeoutSeconds || 120} 
                      onChange={(e) => handleInputChange('idleTimeoutSeconds', parseInt(e.target.value, 10) || 120)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Bosh sahifa asosiy sarlavhasi</label>
                    <input 
                      type="text" 
                      value={formData.welcomeHeading || 'Taste the Excellence.'} 
                      onChange={(e) => handleInputChange('welcomeHeading', e.target.value)} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Bosh sahifa kichik sarlavhasi</label>
                    <input 
                      type="text" 
                      value={formData.welcomeSubheading || "O'zgacha ta'm va sifat uyg'unligi"} 
                      onChange={(e) => handleInputChange('welcomeSubheading', e.target.value)} 
                    />
                  </div>
                  <div className="form-checkbox-group">
                    <input 
                      type="checkbox" 
                      id="smartRecommendations"
                      checked={formData.smartRecommendations !== false} 
                      onChange={(e) => handleInputChange('smartRecommendations', e.target.checked)} 
                    />
                    <label htmlFor="smartRecommendations">Aqlli tavsiyalar (ichimlik/gazaklarni taklif qilish)</label>
                  </div>
                </div>
              )}

              {/* SECTION 8: KDS (KITCHEN) */}
              {activeTab === 'kds' && (
                <div className="settings-section">
                  <h3>Oshxona Displeyi (KDS) Sozlamalari</h3>
                  
                  <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
                    <div className="form-checkbox-group" style={{ marginBottom: 0 }}>
                      <input 
                        type="checkbox" 
                        id="kdsMasterEnabled"
                        checked={formData.enabled !== false} 
                        onChange={(e) => handleInputChange('enabled', e.target.checked)} 
                      />
                      <label htmlFor="kdsMasterEnabled" style={{ fontWeight: 600, fontSize: '15px', color: '#0F172A' }}>
                        Oshxona ekrani (KDS) tizimini yoqish
                      </label>
                    </div>
                    <p style={{ fontSize: '13px', color: '#64748B', marginTop: '6px', marginLeft: '26px' }}>
                      Choyxona, milliy taomlar yoki kichik kafelarda alohida oshxona ekrani kerak bo‘lmasa o‘chirib qo‘ying. O‘chirilganda buyurtmalar oshxona tasdig‘isiz darhol qabul qilinadi va hisob-kitob qilishga tayyor bo‘ladi.
                    </p>
                  </div>

                  {formData.enabled !== false && (
                    <>
                      <div className="form-checkbox-group">
                        <input 
                          type="checkbox" 
                          id="soundEnabled"
                          checked={formData.soundEnabled !== false} 
                          onChange={(e) => handleInputChange('soundEnabled', e.target.checked)} 
                        />
                        <label htmlFor="soundEnabled">Yangi buyurtmada qo‘ng‘iroq ovozini chalish</label>
                      </div>
                      <div className="form-checkbox-group">
                        <input 
                          type="checkbox" 
                          id="voiceAnnouncement"
                          checked={formData.voiceAnnouncement !== false} 
                          onChange={(e) => handleInputChange('voiceAnnouncement', e.target.checked)} 
                        />
                        <label htmlFor="voiceAnnouncement">O‘zbek tilida ovozli e'lon ("Yangi buyurtma")</label>
                      </div>
                      <div className="form-group" style={{ marginTop: '16px' }}>
                        <label>Kechikkan buyurtma ogohlantirish vaqti (daqiqalarda)</label>
                        <input 
                          type="number" 
                          min="5" 
                          max="60"
                          value={formData.warningThresholdMinutes || 15} 
                          onChange={(e) => handleInputChange('warningThresholdMinutes', parseInt(e.target.value, 10) || 15)} 
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* SECTION 9: STATUS SCREEN */}
              {activeTab === 'statusScreen' && (
                <div className="settings-section">
                  <h3>Mijozlar Buyurtma Statusi Ekrani</h3>
                  <div className="form-checkbox-group">
                    <input 
                      type="checkbox" 
                      id="chimeSoundEnabled"
                      checked={formData.chimeSoundEnabled !== false} 
                      onChange={(e) => handleInputChange('chimeSoundEnabled', e.target.checked)} 
                    />
                    <label htmlFor="chimeSoundEnabled">Buyurtma tayyor bo‘lganda qo‘ng‘iroq ovozi</label>
                  </div>
                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>Tayyor bo‘lgan buyurtmani ekranda ko‘rsatish muddati (soniyalarda)</label>
                    <input 
                      type="number" 
                      min="30" 
                      max="600"
                      value={formData.readyOrderDurationSec || 180} 
                      onChange={(e) => handleInputChange('readyOrderDurationSec', parseInt(e.target.value, 10) || 180)} 
                    />
                  </div>
                </div>
              )}

              {/* SECTION 10: NOTIFICATIONS & TELEGRAM */}
              {activeTab === 'notifications' && (
                <div className="settings-section">
                  <h3>Telegram Bildirishnomalari</h3>
                  <div className="form-checkbox-group">
                    <input 
                      type="checkbox" 
                      id="telegramEnabled"
                      checked={formData.telegramEnabled || false} 
                      onChange={(e) => handleInputChange('telegramEnabled', e.target.checked)} 
                    />
                    <label htmlFor="telegramEnabled">Har bir yangi buyurtmani Telegram guruhiga yuborish</label>
                  </div>

                  <div className="form-group" style={{ marginTop: '16px' }}>
                    <label>Telegram Bot Token</label>
                    <input 
                      type="password" 
                      placeholder={formData.telegramTokenMasked || "Bot tokenini kiriting"}
                      value={formData.telegramToken || ''} 
                      onChange={(e) => handleInputChange('telegramToken', e.target.value)} 
                    />
                  </div>

                  <div className="form-group">
                    <label>Telegram Kanal yoki Guruh Chat ID</label>
                    <input 
                      type="text" 
                      placeholder="-100..."
                      value={formData.telegramChatId || ''} 
                      onChange={(e) => handleInputChange('telegramChatId', e.target.value)} 
                    />
                  </div>

                  <div className="form-checkbox-group">
                    <input 
                      type="checkbox" 
                      id="telegramIncludeImage"
                      checked={formData.telegramIncludeImage !== false} 
                      onChange={(e) => handleInputChange('telegramIncludeImage', e.target.checked)} 
                    />
                    <label htmlFor="telegramIncludeImage">Buyurtma xabariga taom rasmini qo‘shib yuborish</label>
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <button 
                      type="button" 
                      className="test-action-btn"
                      onClick={handleTestTelegram}
                      disabled={testingTelegram}
                    >
                      <Send size={16} /> 
                      {testingTelegram ? 'Yuborilmoqda...' : 'Telegramga test xabarini yuborish'}
                    </button>
                  </div>
                </div>
              )}

              {/* SECTION 11: SYSTEM & BACKUP */}
              {activeTab === 'system' && (
                <div className="settings-section">
                  <h3>Tizim Zaxirasi va Eksport/Import</h3>
                  <p className="section-desc">Barcha restoran sozlamalarini boshqa terminalga ko‘chirish yoki zaxiralash.</p>
                  
                  <div className="system-actions-grid">
                    <button type="button" className="system-btn" onClick={handleExportJSON}>
                      <Download size={18} />
                      <div>
                        <strong>Sozlamalarni eksport qilish</strong>
                        <p>JSON fayl shaklida kompyuterga yuklab olish</p>
                      </div>
                    </button>

                    <label className="system-btn">
                      <Upload size={18} />
                      <div>
                        <strong>Sozlamalarni import qilish</strong>
                        <p>JSON fayldan barcha sozlamalarni tiklash</p>
                      </div>
                      <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              )}

              {/* SECTION 12: DATABASE MAINTENANCE & SELECTIVE CLEANUP */}
              {activeTab === 'maintenance' && (
                <div className="settings-section">
                  <h3>Ma’lumotlar Bazasini Boshqarish va Tozalash</h3>
                  <p className="section-desc">Kassa hisobotlari, buyurtmalar tarixi va tizim ma’lumotlarini tozalash yoki zavod holatiga qaytarish.</p>

                  <div className="maintenance-security-banner">
                    <ShieldAlert size={18} className="banner-icon" />
                    <div className="banner-text">
                      <strong>Xavfsizlik nazorati:</strong> Ushbu bo‘limdagi har bir tozalash amali faqat Administrator vakolatiga ega foydalanuvchilar uchun ruxsat etilgan bo‘lib, 4 xonali boshqaruvchi PIN-kodi orqali tasdiqlanishi shart.
                    </div>
                  </div>

                  <div className="maintenance-grid">
                    {CLEANUP_OPTIONS.map(opt => (
                      <div key={opt.id} className={`maintenance-card ${opt.badgeType === 'critical' ? 'critical' : ''}`}>
                        <div className="maintenance-info">
                          <div className="maintenance-head-line">
                            <span className="maintenance-title">{opt.title}</span>
                            <span className={`maintenance-badge ${opt.badgeType}`}>{opt.badge}</span>
                          </div>
                          <span className="maintenance-desc">{opt.desc}</span>
                        </div>
                        <button
                          type="button"
                          className={`maintenance-btn ${opt.btnClass}`}
                          onClick={() => handleOpenCleanupConfirm(opt)}
                        >
                          {opt.badgeType === 'critical' ? (
                            <AlertTriangle size={14} />
                          ) : opt.id === 'tables' ? (
                            <RotateCcw size={14} />
                          ) : (
                            <Trash2 size={14} />
                          )}
                          <span>{opt.btnLabel}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>

              {activeTab !== 'maintenance' && (
                <footer className="settings-form-footer">
                  <div className="settings-footer-status">
                    <span className="footer-status-pill">
                      <span className="footer-status-dot" />
                      <span>O‘zgarishlar kiritildi</span>
                    </span>
                  </div>
                  <button type="submit" className="save-settings-btn" disabled={loading}>
                    <Save size={15} />
                    <span>{loading ? 'Saqlanmoqda...' : 'Saqlash'}</span>
                  </button>
                </footer>
              )}
            </form>
          </div>
        </div>

        {/* Security PIN Confirmation Modal for Database Maintenance */}
        {cleanupModalOpen && cleanupTarget && (
          <div className="pos-modal-backdrop" style={{ zIndex: 10050 }} onClick={() => !isCleaning && setCleanupModalOpen(false)}>
            <div className="pos-modal-card" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
              <div className="pos-modal-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '8px', 
                    background: cleanupTarget.badgeType === 'critical' ? '#fee2e2' : '#fef3c7',
                    color: cleanupTarget.badgeType === 'critical' ? '#dc2626' : '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ShieldAlert size={18} />
                  </div>
                  <div>
                    <h3 className="pos-modal-title" style={{ fontSize: '1.02rem', margin: 0 }}>Administrator Tasdig‘i</h3>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: '#64748b' }}>Xavfsizlik nazorati va avtorizatsiya</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="pos-action-btn-secondary"
                  style={{ width: '30px', height: '30px', padding: 0 }}
                  onClick={() => !isCleaning && setCleanupModalOpen(false)}
                >
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleExecuteCleanup}>
                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: cleanupTarget.badgeType === 'critical' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    border: cleanupTarget.badgeType === 'critical' ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(245, 158, 11, 0.25)',
                    fontSize: '0.8rem',
                    lineHeight: '1.45',
                    color: cleanupTarget.badgeType === 'critical' ? '#b91c1c' : '#b45309'
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>{cleanupTarget.title}:</div>
                    <div>{cleanupTarget.warningText}</div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--pos-text, #475569)', marginBottom: '6px' }}>
                      Administrator PIN-kodini kiriting *
                    </label>
                    <input
                      type="password"
                      required
                      maxLength={8}
                      autoFocus
                      placeholder="••••"
                      value={adminPin}
                      onChange={e => setAdminPin(e.target.value)}
                      style={{
                        width: '100%',
                        height: '42px',
                        letterSpacing: '0.3em',
                        fontSize: '1.2rem',
                        textAlign: 'center',
                        borderRadius: '8px',
                        border: '1.5px solid var(--pos-border, #cbd5e1)',
                        background: 'var(--pos-surface, #ffffff)',
                        color: 'var(--pos-text, #0f172a)',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--pos-text-muted, #94a3b8)', marginTop: '5px', display: 'block' }}>
                      Amalni tasdiqlash uchun boshqaruvchi (admin) PIN-kodini kiriting
                    </span>
                  </div>
                </div>

                <div className="pos-modal-foot" style={{ justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    className="pos-action-btn-secondary"
                    style={{ height: '38px', padding: '0 16px', borderRadius: '8px' }}
                    onClick={() => setCleanupModalOpen(false)}
                    disabled={isCleaning}
                  >
                    Bekor qilish
                  </button>
                  <button
                    type="submit"
                    className="pos-action-btn-primary"
                    style={{ 
                      height: '38px', 
                      padding: '0 20px', 
                      width: 'auto',
                      borderRadius: '8px',
                      background: cleanupTarget.badgeType === 'critical' ? '#dc2626' : '#0f172a',
                      color: '#ffffff'
                    }}
                    disabled={isCleaning || !adminPin}
                  >
                    {isCleaning ? 'Tozalanmoqda...' : 'Tasdiqlash va Tozalash'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
