import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../components/Icons';
import PosPage from './PosPage';
import Cart from '../components/Cart';
import { useLanguage } from '../context/LanguageContext';

const KioskPage = (props) => {
  const { 
    cart,
    clearCart,
    handlePlaceOrder
  } = props;

  const { t, language, changeLanguage } = useLanguage();
  const [step, setStep] = useState('welcome'); // welcome, dining_choice, menu, checkout_success
  const [diningOption, setDiningOption] = useState(null); // eat_in, take_away
  const [showCart, setShowCart] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState(null);

  // Auto-reset kiosk after 2 minutes of inactivity on welcome screen
  useEffect(() => {
    if (step !== 'welcome' && cart.length === 0) {
      const timer = setTimeout(() => setStep('welcome'), 120000);
      return () => clearTimeout(timer);
    }
  }, [step, cart]);

  const startOrdering = () => setStep('dining_choice');
  
  const selectDining = (option) => {
    setDiningOption(option);
    setStep('menu');
  };

  const onCheckout = async () => {
    const orderData = await handlePlaceOrder();
    if (orderData) {
      setCompletedOrderId(orderData._id ? String(orderData._id).slice(-4).toUpperCase() : '0000');
      setStep('checkout_success');
      setTimeout(() => {
        setStep('welcome');
        clearCart();
      }, 10000);
    }
  };

  if (step === 'welcome') {
    return (
      <div className="kiosk-editorial-welcome" onClick={startOrdering}>
        <div className="editorial-bg-accent" />
        
        <div className="editorial-layout">
          <div className="editorial-left">
            <div className="editorial-nav">
              <div className="editorial-brand">
                <span className="brand-label">Premium Quality</span>
                <h1>Jalol<span>KFC</span></h1>
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
                  Taste the<br />
                  <span>Excellence.</span>
                </h2>
                <p className="editorial-sub">
                  {language === 'uz' ? 'O\'zgacha ta\'m va sifat uyg\'unligi' : 
                   language === 'ru' ? 'Сочетание вкуса и качества' : 
                   'Where taste meets quality'}
                </p>
                
                <div className="editorial-action">
                  <div className="action-wrapper">
                    <button className="editorial-start-btn">
                      <span>{t('start_ordering')}</span>
                      <div className="btn-arrow">
                        <Icon name="arrow_right" size={24} />
                      </div>
                    </button>
                    <div className="minimal-hint">
                      <Icon name="mouse_pointer" size={12} />
                      <span>{t('touch_to_start')}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="editorial-bottom">
              <div className="footer-stat">
                <span className="stat-val">100%</span>
                <span className="stat-label">Fresh Chicken</span>
              </div>
              <div className="footer-stat">
                <span className="stat-val">20m</span>
                <span className="stat-label">Fast Service</span>
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
              <img src="/images/hero-burger.png" alt="Signature Burger" />
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
            <div className="editorial-step-brand">Jalol<span>KFC</span></div>
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
              
              <div className="dining-options">
                <motion.button 
                  className="dining-card"
                  whileHover={{ y: -10 }}
                  onClick={() => selectDining('eat_in')}
                >
                  <div className="card-visual">
                    <Icon name="home" size={22} />
                  </div>
                  <div className="card-info">
                    <h3>{t('in_hall')}</h3>
                    <p>{language === 'uz' ? 'Issiq va mazali' : language === 'ru' ? 'Горячо и вкусно' : 'Hot & Fresh'}</p>
                  </div>
                </motion.button>

                <motion.button 
                  className="dining-card"
                  whileHover={{ y: -10 }}
                  onClick={() => selectDining('take_away')}
                >
                  <div className="card-visual">
                    <Icon name="package" size={22} />
                  </div>
                  <div className="card-info">
                    <h3>{t('takeaway')}</h3>
                    <p>{language === 'uz' ? 'Yo\'l-yo\'lakay' : language === 'ru' ? 'С собой в дорогу' : 'On the go'}</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          </main>
        </div>
      </div>
    );
  }

  if (step === 'checkout_success') {
    return (
      <div className="kiosk-minimal-success">
        <div className="success-receipt-wrapper">
          <div className="receipt-content">
            <div className="receipt-check-icon"><Icon name="check" size={32} /></div>
            <h1 className="receipt-title">{t('order_success')}</h1>
            
            <div className="receipt-divider"></div>
            
            <div className="receipt-order-label">{t('order_num')}</div>
            <div className="receipt-order-number">#{completedOrderId || '0482'}</div>
            
            <div className="receipt-divider"></div>
            
            <div className="receipt-barcode"></div>
            
            <p className="receipt-footer-text">{language === 'uz' ? '10 soniyadan so\'ng qaytamiz' : 'Returning in 10s'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kiosk-minimal-main">
      <div className="kiosk-minimal-content">
        <header className="kiosk-minimal-header">
          <button onClick={() => setStep('dining_choice')}><Icon name="chevron_left" size={20} /> {t('back')}</button>
          <div className="dining-badge">{diningOption === 'eat_in' ? t('eat_in') : t('take_away')}</div>
        </header>
        <div className="kiosk-minimal-pos">
          <PosPage {...props} />
        </div>
      </div>
      
      <div className={`kiosk-minimal-cart ${showCart ? 'open' : ''}`}>
        <Cart 
          {...props}
          onCheckout={onCheckout}
          isKiosk={true}
          setShowMobileCart={setShowCart}
        />
      </div>

      <button className="kiosk-mobile-toggle" onClick={() => setShowCart(true)}>
        <Icon name="shopping_bag" size={20} /> {t('cart')} ({cart.length})
      </button>

      {showCart && <div className="kiosk-overlay" onClick={() => setShowCart(false)} />}
    </div>
  );
};

export default KioskPage;
