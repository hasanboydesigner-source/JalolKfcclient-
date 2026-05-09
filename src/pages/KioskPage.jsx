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
    const success = await handlePlaceOrder();
    if (success) {
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
      <div className="kiosk-minimal-step">
        <div className="kiosk-minimal-container">
          <button className="kiosk-minimal-back" onClick={() => setStep('welcome')}>
            <Icon name="chevron_left" size={20} /> {t('back')}
          </button>
          
          <h2 className="kiosk-minimal-step-title">
            {language === 'uz' ? 'Qayerda ovqatlanasiz?' : 'Where will you eat?'}
          </h2>

          <div className="kiosk-minimal-choices">
            <div className="kiosk-minimal-choice" onClick={() => selectDining('eat_in')}>
              <div className="choice-icon"><Icon name="home" size={48} /></div>
              <h3>{language === 'uz' ? 'Shu yerda' : 'Eat In'}</h3>
            </div>

            <div className="kiosk-minimal-choice" onClick={() => selectDining('take_away')}>
              <div className="choice-icon"><Icon name="package" size={48} /></div>
              <h3>{language === 'uz' ? 'Olib ketish' : 'Take Away'}</h3>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'checkout_success') {
    return (
      <div className="kiosk-minimal-success">
        <div className="success-content">
          <div className="success-check"><Icon name="check" size={64} /></div>
          <h1>{t('order_success')}</h1>
          <div className="order-num">
            <span>{t('order_num')}</span>
            <h2>#0482</h2>
          </div>
          <p>{language === 'uz' ? '10 soniyadan so\'ng qaytamiz' : 'Returning in 10s'}</p>
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
