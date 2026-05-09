import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../components/Icons';
import PosPage from './PosPage';
import Cart from '../components/Cart';
import { useLanguage } from '../context/LanguageContext';

const KioskPage = (props) => {
  const { 
    activeCategory, 
    setActiveCategory, 
    INITIAL_CATEGORIES, 
    products, 
    loading, 
    filteredProducts, 
    addToCart, 
    updateQty, 
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

  const onCheckout = async (pMethod) => {
    // Sync payment method state with App.jsx if needed, 
    // but handlePlaceOrder uses current paymentMethod state from App.jsx
    // So we should ideally have set it. 
    const success = await handlePlaceOrder();
    if (success) {
      setStep('checkout_success');
      setTimeout(() => {
        setStep('welcome');
        clearCart();
      }, 10000); // Show success for 10 seconds
    }
  };

  if (step === 'welcome') {
    return (
      <div className="kiosk-welcome-screen">
        <div className="kiosk-hero">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="kiosk-logo-large"
          >
            <div className="logo-badge" style={{ width: 120, height: 120, fontSize: '3rem' }}>J</div>
            <h1>JalolKFC</h1>
          </motion.div>
          
          <motion.h2 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            {language === 'uz' ? 'Xush kelibsiz!' : language === 'ru' ? 'Добро пожаловать!' : 'Welcome!'}
          </motion.h2>

          <button className="kiosk-start-btn" onClick={startOrdering}>
            {language === 'uz' ? 'BUYURTMA BERISH' : language === 'ru' ? 'СДЕЛАТЬ ЗАКАЗ' : 'ORDER NOW'}
            <Icon name="chevron_right" size={32} />
          </button>

          <div className="kiosk-lang-selector">
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
      <div className="kiosk-step-screen">
        <div className="kiosk-container">
          <button className="kiosk-back-top" onClick={() => setStep('welcome')}>
            <Icon name="chevron_left" size={24} /> {t('back')}
          </button>
          
          <h2 className="kiosk-step-title">
            {language === 'uz' ? 'Qayerda ovqatlanasiz?' : language === 'ru' ? 'Где будете кушать?' : 'Where will you eat?'}
          </h2>

          <div className="kiosk-choice-grid">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="kiosk-choice-card" 
              onClick={() => selectDining('eat_in')}
            >
              <div className="choice-icon"><Icon name="home" size={64} /></div>
              <h3>{language === 'uz' ? 'Shu yerda' : language === 'ru' ? 'Здесь' : 'Eat In'}</h3>
            </motion.div>

            <motion.div 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="kiosk-choice-card" 
              onClick={() => selectDining('take_away')}
            >
              <div className="choice-icon"><Icon name="package" size={64} /></div>
              <h3>{language === 'uz' ? 'Olib ketish' : language === 'ru' ? 'С собой' : 'Take Away'}</h3>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'checkout_success') {
    return (
      <div className="kiosk-success-screen">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="success-content"
        >
          <div className="success-icon-large">
            <Icon name="check" size={100} />
          </div>
          <h1>{language === 'uz' ? 'Rahmat!' : 'Спасибо!'}</h1>
          <p>{language === 'uz' ? 'Buyurtmangiz qabul qilindi' : 'Ваш заказ принят'}</p>
          <div className="kiosk-order-number">
            <span>{t('order_num')}</span>
            <h2>#0482</h2>
          </div>
          <p className="kiosk-timer-msg">{language === 'uz' ? "10 soniyadan so'ng asosiy sahifaga qaytamiz..." : 'Возвращаемся cherez 10 sekund...'}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="kiosk-main-layout">
      <div className="kiosk-sidebar-menu">
        <div className="kiosk-menu-header">
          <button className="kiosk-exit-btn" onClick={() => setStep('dining_choice')}>
            <Icon name="chevron_left" size={20} /> {t('back')}
          </button>
          <div className="kiosk-dining-badge">
             <Icon name={diningOption === 'eat_in' ? 'home' : 'package'} size={16} />
             {diningOption === 'eat_in' ? t('eat_in') : t('take_away')}
          </div>
        </div>
        <div className="kiosk-pos-wrapper">
          <PosPage {...props} />
        </div>
      </div>
      
      <div className={`kiosk-cart-panel ${showCart ? 'open' : ''}`}>
        <Cart 
          {...props}
          onCheckout={onCheckout}
          isKiosk={true}
          setShowMobileCart={setShowCart}
        />
      </div>

      <button className="kiosk-mobile-cart-toggle show-mobile" onClick={() => setShowCart(true)}>
        <Icon name="shopping_bag" size={24} />
        {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
        {t('cart')}
      </button>

      {showCart && (
        <div className="cart-overlay show-mobile" onClick={() => setShowCart(false)} />
      )}
    </div>
  );
};

export default KioskPage;
