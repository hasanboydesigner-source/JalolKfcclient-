import { Icon } from './Icons'
import { useLanguage } from '../context/LanguageContext'

const Cart = ({ cart, updateQty, subtotal, tax, total, orderType, setOrderType, paymentMethod, setPaymentMethod, handlePlaceOrder, setShowMobileCart, isCustomerView }) => {
  const { t, language } = useLanguage()

  // Localized Labels for Tabs
  const orderTabs = [
    { id: 'in_hall', label: t('in_hall'), icon: 'tables' },
    { id: 'takeaway', label: t('takeaway'), icon: 'package' },
    { id: 'delivery', label: t('delivery'), icon: 'delivery' }
  ]

  const paymentMethods = [
    { id: 'cash', label: t('cash'), icon: 'cash' },
    { id: 'card', label: t('card'), icon: 'card' },
    { id: 'qr', label: t('qr'), icon: 'qr' }
  ]

  return (
    <aside className="pos-cart-panel">
      <div className="cart-header">
        <div className="cart-title-row">
          <button className="cart-back-btn show-mobile" onClick={() => setShowMobileCart(false)}>
            <Icon name="chevron_left" size={20} />
            <span>{t('back')}</span>
          </button>
          <div>
            <div className="cart-order-num">{t('order_num')} #0482</div>
            <h2 className="cart-title">{t('cart_title')}</h2>
          </div>
          <div className="cart-header-actions">
            <div className="cart-time-badge hidden-mobile">
              <Icon name="clock" size={14} />
              <span>{new Date().toLocaleTimeString(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <button className="close-cart-btn" onClick={() => setShowMobileCart(false)}>
              <Icon name="delete" size={20} />
            </button>
          </div>
        </div>

        <div className="order-tabs">
          {!isCustomerView && orderTabs.map(tab => (
            <div
              key={tab.id}
              className={`order-tab ${orderType === tab.id ? 'active' : ''}`}
              onClick={() => setOrderType(tab.id)}
            >
              {tab.label}
            </div>
          ))}
        </div>
      </div>

      <div className="cart-items-scroller">
        {cart.length === 0 ? (
          <div className="cart-empty-state">
            <div className="empty-icon-wrapper">
              <Icon name="shopping_bag" size={64} strokeWidth={1} />
            </div>
            <h3>{t('empty_cart')}</h3>
            <p>{t('empty_cart_msg')}</p>
          </div>
        ) : (
          cart.map(item => (
            <div key={item._id} className="cart-item">
              <img src={item.image} alt={item.name} className="cart-item-thumb" />
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">{(item.price * item.qty).toLocaleString()} {t('sum')}</div>
              </div>
              <div className="qty-control">
                <button className="qty-btn" onClick={() => updateQty(item._id, -1)}>
                  <Icon name="minus" size={12} />
                </button>
                <span className="qty-val">{item.qty}</span>
                <button className="qty-btn" onClick={() => updateQty(item._id, 1)}>
                  <Icon name="plus" size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="cart-footer">
        <div className="summary-stack">
          <div className="row-sub">
            <span>{t('subtotal')}</span>
            <span>{subtotal.toLocaleString()} {t('sum')}</span>
          </div>
          <div className="row-sub">
            <span>{t('service_fee')}</span>
            <span>{tax.toLocaleString()} {t('sum')}</span>
          </div>
          <div className="row-total">
            <span>{t('total')}</span>
            <span>{total.toLocaleString()} {t('sum')}</span>
          </div>
        </div>

        <div className="payment-section">
          <div className="section-label">{t('payment_method')}</div>
          <div className="payment-grid">
            {paymentMethods.map(method => (
              <button
                key={method.id}
                className={`payment-method-card ${paymentMethod === method.id ? 'active' : ''}`}
                onClick={() => setPaymentMethod(method.id)}
              >
                <Icon name={method.icon} size={18} />
                <span>{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button className="checkout-btn" onClick={handlePlaceOrder}>
          {t('confirm_order')}
        </button>
      </div>
    </aside>
  )
}

export default Cart
