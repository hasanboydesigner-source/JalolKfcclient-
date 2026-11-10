import React, { useState, useEffect } from 'react';
import { Icon } from '../components/Icons';
import PosPage from './PosPage';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

const KioskPage = (props) => {
  const { 
    cart,
    clearCart,
    handlePlaceOrder,
    isPlacingOrder
  } = props;

  const { t, language, changeLanguage } = useLanguage();
  const { settings } = useSettings();
  const [step, setStep] = useState('welcome'); // welcome, dining_choice, menu, checkout_success
  const [_diningOption, setDiningOption] = useState(null); // eat_in, take_away
  const [completedOrderId, setCompletedOrderId] = useState(null);

  // Auto-reset kiosk after configured timeout of inactivity
  useEffect(() => {
    const timeoutMs = (settings.kiosk?.idleTimeoutSeconds || 120) * 1000;
    if (step !== 'welcome' && cart.length === 0) {
      const timer = setTimeout(() => setStep('welcome'), timeoutMs);
      return () => clearTimeout(timer);
    }
  }, [step, cart, settings]);

  const startOrdering = () => setStep('dining_choice');
  
  const selectDining = (option) => {
    setDiningOption(option);
    setStep('menu');
  };

  const onCheckout = async () => {
    if (isPlacingOrder) return;
    const orderData = await handlePlaceOrder();
    if (orderData) {
      setCompletedOrderId(orderData.orderNumber || (orderData._id ? String(orderData._id).slice(-4).toUpperCase() : '0001'));
      setStep('checkout_success');
      setTimeout(() => {
        setStep('welcome');
        clearCart();
      }, 10000);
    }
  };

  const businessName = settings.business?.name || 'RESTORAN';
  const welcomeHeading = settings.kiosk?.welcomeHeading || 'Taste the Excellence.';
  const welcomeSub = settings.kiosk?.welcomeSubheading || "O'zgacha ta'm va sifat uyg'unligi";
  const heroImage = settings.kiosk?.heroImageUrl || '/images/hero-burger.png';

  if (step === 'welcome') {
    return (
      <div className="kiosk-editorial-welcome" onClick={startOrdering}>
        <div className="editorial-bg-accent" />
        
        <div className="editorial-layout">
          <div className="editorial-left">
            <div className="editorial-nav">
              <div className="editorial-brand">
                <span className="brand-label">Premium Sifat</span>
                <h1>{businessName}</h1>
              </div>
              
              <div className="editorial-langs" onClick={(e) => e.stopPropagation()}>
                {['UZ', 'RU', 'EN'].map(l => (
                  <button 
                    key={l}
                    onClick={() => changeLanguage(l.toLowerCase())}
                    className={language === l.toLowerCase() ? 'active' : ''}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="editorial-hero">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h2 className="editorial-heading">
                  {welcomeHeading}
                </h2>
                <p className="editorial-sub">
                  {welcomeSub}
                </p>
                
                <div className="editorial-action">
                  <div className="action-wrapper">
                    <button className="editorial-start-btn">
                      <span>{t('start_ordering') || 'Buyurtma berish'}</span>
                      <div className="btn-arrow">
                        <Icon name="arrow_right" size={24} />
                      </div>
                    </button>
                    <div className="minimal-hint">
                      <Icon name="mouse_pointer" size={12} />
                      <span>{t('touch_to_start') || 'Boshlash uchun bosing'}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="editorial-bottom">
              <div className="footer-stat">
                <span className="stat-val">100%</span>
                <span className="stat-label">Tabiiy Mahsulot</span>
              </div>
              <div className="footer-stat">
                <span className="stat-val">15m</span>
                <span className="stat-label">Tez Xizmat</span>
              </div>
            </div>
          </div>

          <div className="editorial-right">
            <motion.div 
              className="image-container"
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <img src={heroImage} alt="Mahsulot" />
              <div className="image-shadow" />
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'dining_choice') {
    return (
      <div className="kiosk-editorial-step">
        <div className="editorial-bg-accent" />
        
        <div className="editorial-step-container">
          <header className="editorial-step-header">
            <button className="editorial-back-btn" onClick={() => setStep('welcome')}>
              <Icon name="arrow_left" size={24} />
              <span>{t('back')}</span>
            </button>
            <div className="editorial-step-brand">{businessName}</div>
          </header>

          <main className="editorial-step-main">
            <motion.div 
              className="editorial-step-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="editorial-step-title">
                {language === 'uz' ? 'Qayerda ovqatlanasiz?' : 
                 language === 'ru' ? 'Где будете кушать?' : 
                 'Where will you eat?'}
              </h2>
              <p className="editorial-step-desc">
                {language === 'uz' ? 'Iltimos, o‘zingizga qulay xizmat turini tanlang' :
                 language === 'ru' ? 'Пожалуйста, выберите удобный тип обслуживания' :
                 'Please select your preferred dining option'}
              </p>

              <div className="editorial-cards-grid">
                <div className="editorial-choice-card" onClick={() => selectDining('eat_in')}>
                  <div className="choice-visual">
                    <Icon name="tables" size={48} />
                  </div>
                  <div className="choice-content">
                    <h3>{t('in_hall') || 'Shu yerda'}</h3>
                    <p>Zalda qulay muhitda ovqatlanish</p>
                  </div>
                  <div className="choice-indicator">
                    <Icon name="arrow_right" size={20} />
                  </div>
                </div>

                <div className="editorial-choice-card" onClick={() => selectDining('take_away')}>
                  <div className="choice-visual">
                    <Icon name="package" size={48} />
                  </div>
                  <div className="choice-content">
                    <h3>{t('takeaway') || 'Olib ketish'}</h3>
                    <p>O‘zingiz bilan olib ketish uchun qadoqlash</p>
                  </div>
                  <div className="choice-indicator">
                    <Icon name="arrow_right" size={20} />
                  </div>
                </div>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    );
  }

  if (step === 'checkout_success') {
    return (
      <div className="kiosk-success-screen">
        <motion.div 
          className="success-modal-content"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="success-icon-badge">
            <Icon name="check" size={54} color="#10b981" />
          </div>
          <h2>Buyurtmangiz Qabul Qilindi!</h2>
          <p className="success-order-id">
            Raqamingiz: <strong>{completedOrderId}</strong>
          </p>
          <p className="success-hint">
            Iltimos, buyurtmangiz tayyor bo‘lishini ekranda kuting. Chekingiz chop etilmoqda.
          </p>
          <button className="success-return-btn" onClick={() => setStep('welcome')}>
            Bosh sahifaga qaytish
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="kiosk-menu-layout">
      <header className="kiosk-nav-top">
        <button className="kiosk-exit-btn" onClick={() => setStep('welcome')}>
          <Icon name="arrow_left" size={20} />
          <span>{t('back')}</span>
        </button>
        <div className="kiosk-top-title">{businessName}</div>
        <div className="kiosk-top-cart-indicator">
          <Icon name="shopping_bag" size={20} />
          <span>{cart.length} ta mahsulot</span>
        </div>
      </header>
      <PosPage {...props} isKiosk={true} onCheckout={onCheckout} />
    </div>
  );
};

export default KioskPage;
