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

  const { t, language, setLanguage } = useLanguage();
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
      <div className="kiosk-minimal-welcome">
        <div className="kiosk-minimal-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="kiosk-minimal-brand"
          >
            <div className="brand-dot" />
            <h1>JalolKFC</h1>
          </motion.div>
          
          <h2 className="kiosk-minimal-title">
            {language === 'uz' ? 'Xush kelibsiz' : language === 'ru' ? 'Добро пожаловать' : 'Welcome'}
          </h2>

          <button className="kiosk-minimal-start-btn" onClick={startOrdering}>
            {language === 'uz' ? 'Buyurtma berish' : language === 'ru' ? 'Начать заказ' : 'Start Order'}
          </button>

          <div className="kiosk-minimal-langs">
            <button onClick={() => setLanguage('uz')} className={language === 'uz' ? 'active' : ''}>UZ</button>
            <button onClick={() => setLanguage('ru')} className={language === 'ru' ? 'active' : ''}>RU</button>
            <button onClick={() => setLanguage('en')} className={language === 'en' ? 'active' : ''}>EN</button>
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
