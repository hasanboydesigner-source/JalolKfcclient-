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
      <div className="kiosk-minimal-welcome" onClick={startOrdering}>
        <div className="kiosk-minimal-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="kiosk-minimal-brand"
          >
            <div className="brand-dot-pulse" />
            <h1>Jalol<span>KFC</span></h1>
          </motion.div>
          
          <div className="kiosk-hero-text">
            <motion.h2 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {language === 'uz' ? 'Mazali lahzalar' : language === 'ru' ? 'Вкусные моменты' : 'Delicious Moments'}
            </motion.h2>
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {language === 'uz' ? 'Boshlash uchun ekranga bosing' : language === 'ru' ? 'Нажмите, чтобы начать' : 'Touch anywhere to start'}
            </motion.p>
          </div>

          <div className="kiosk-minimal-langs" onClick={(e) => e.stopPropagation()}>
            {[
              { code: 'uz', label: 'UZ' },
              { code: 'ru', label: 'RU' },
              { code: 'en', label: 'EN' }
            ].map(lang => (
              <button 
                key={lang.code}
                onClick={() => changeLanguage(lang.code)} 
                className={language === lang.code ? 'active' : ''}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="kiosk-minimal-footer">
          <span>{new Date().getFullYear()} © JalolKFC Systems</span>
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
