import React from 'react'
import { 
  Banknote, 
  CreditCard, 
  QrCode, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  Clock, 
  ArrowLeft,
  Armchair,
  X
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useSettings } from '../context/SettingsContext'
import { getBgRemovedUrl } from '../utils/imageUtils'

const Cart = ({ 
  cart, 
  updateQty, 
  subtotal, 
  tax, 
  total, 
  orderType, 
  setOrderType, 
  paymentMethod, 
  setPaymentMethod, 
  handlePlaceOrder, 
  isPlacingOrder,
  setShowMobileCart, 
  isCustomerView,
  recommendedProducts,
  addToCart,
  isKiosk,
  onCheckout,
  selectedTable,
  onOpenTableSelector,
  onClearSelectedTable
}) => {
  const { t, language } = useLanguage()
  const { settings, formatPrice } = useSettings()

  const orderTabs = [
    { id: 'in_hall', label: t('in_hall') || 'Zalda' },
    { id: 'takeaway', label: t('takeaway') || 'Olib ketish' },
    { id: 'delivery', label: t('delivery') || 'Yetkazib' }
  ]

  const paymentMethods = [
    { id: 'cash', label: t('cash') || 'Naqd', icon: Banknote },
    { id: 'card', label: t('card') || 'Karta', icon: CreditCard },
    { id: 'qr', label: t('qr') || 'QR', icon: QrCode }
  ]

  const taxLabel = settings.pricing?.taxLabel || t('tax') || 'QQS'
  const taxRate = settings.pricing?.taxRate || 0

  return (
    <aside className={isKiosk ? "kiosk-cart-internal" : "pos-cart-panel"}>
      {/* Cart Header */}
      <div className="cart-header">
        <div className="cart-title-row">
          <button 
            type="button" 
            className="cart-back-btn show-mobile" 
            onClick={() => setShowMobileCart(false)}
          >
            <ArrowLeft size={18} />
            <span>{t('back') || 'Orqaga'}</span>
          </button>

          <div className="cart-title-container">
            <div className="cart-order-num">
              {t('cart_title') || 'Savat'} ({cart.reduce((s, i) => s + i.qty, 0)})
            </div>
          </div>

          <div className="cart-header-actions">
            <div className="cart-time-badge hidden-mobile">
              <Clock size={14} />
              <span>
                {new Date().toLocaleTimeString(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <button 
              type="button"
              className="close-cart-btn show-mobile" 
              onClick={() => setShowMobileCart(false)}
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Clean Segmented Order Type Tabs */}
        {!isCustomerView && (
          <div className="order-tabs">
            {orderTabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`order-tab ${orderType === tab.id ? 'active' : ''}`}
                onClick={() => setOrderType(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Table Selector Row for Dine-In */}
        {!isCustomerView && orderType === 'in_hall' && (
          <div style={{ marginTop: '10px' }}>
            {selectedTable ? (
              <div className="cart-table-pill-row">
                <div className="cart-table-pill-left">
                  <div className={`cart-table-badge ${selectedTable.status === 'OCCUPIED' ? 'occupied' : 'free'}`}>
                    #{selectedTable.tableNumber}
                  </div>
                  <div className="cart-table-pill-info">
                    <div className="cart-table-pill-name">
                      Stol #{selectedTable.tableNumber}
                      {selectedTable.status === 'OCCUPIED' && (
                        <span className="cart-table-tag-occupied">Qo‘shimcha</span>
                      )}
                    </div>
                    <div className="cart-table-pill-sub">
                      {selectedTable.zone || 'Asosiy zal'} &middot; {selectedTable.capacity || 4} kishi
                    </div>
                  </div>
                </div>

                <div className="cart-table-pill-actions">
                  <button
                    type="button"
                    className="cart-table-btn-text"
                    onClick={onOpenTableSelector}
                  >
                    O‘zgartirish
                  </button>
                  <button
                    type="button"
                    className="cart-table-btn-icon"
                    onClick={onClearSelectedTable}
                    title="Stolni tozalash"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="cart-no-table-btn"
                onClick={onOpenTableSelector}
              >
                <Armchair size={14} />
                <span>Stol tanlash</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Cart Items List */}
      <div className="cart-items-scroller">
        {cart.length === 0 ? (
          <div className="cart-empty-state">
            <div className="empty-icon-wrapper">
              <ShoppingBag size={48} strokeWidth={1.5} />
            </div>
            <h3>{t('empty_cart') || "Savat bo'sh"}</h3>
            <p>{t('empty_cart_msg') || "Mahsulotlarni tanlang"}</p>
          </div>
        ) : (
          <>
            <div className="cart-items-list">
              {cart.map(item => (
                <div key={item._id} className="cart-item">
                  <img 
                    src={getBgRemovedUrl(item.image)} 
                    alt={item.name} 
                    className="cart-item-thumb" 
                  />
                  <div className="cart-item-info">
                    <div className="cart-item-name">
                      {item.name}
                      {item.tag && item.tag !== 'Standart' && item.tag !== 'Non Veg' && (
                        <span style={{ fontSize: '0.72rem', color: '#f59e0b', marginLeft: '6px', fontWeight: 700 }}>
                          [{item.tag}]
                        </span>
                      )}
                    </div>
                    <div className="cart-item-price">
                      {formatPrice(item.price * item.qty)}
                      {item.unit && item.unit !== 'dona' && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--pos-text-muted)', marginLeft: '4px' }}>
                          ({item.qty} {item.unit === 'porsiya' ? 'pors' : item.unit})
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="qty-control">
                    <button 
                      type="button" 
                      className="qty-btn" 
                      onClick={() => updateQty(item._id, -1)}
                      aria-label="Kamaytirish"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="qty-val">{item.qty}</span>
                    <button 
                      type="button" 
                      className="qty-btn" 
                      onClick={() => updateQty(item._id, 1)}
                      aria-label="Oshirish"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {recommendedProducts && recommendedProducts.length > 0 && settings.kiosk?.smartRecommendations !== false && (
              <div className="cart-recommendations">
                <h4 className="recommendation-title">Tavsiya etamiz:</h4>
                <div className="recommendation-scroll">
                  {recommendedProducts.map(product => (
                    <div key={product._id} className="recommendation-card">
                      <img src={getBgRemovedUrl(product.image)} alt={product.name} className="rec-img" />
                      <div className="rec-info">
                        <div className="rec-name">{product.name}</div>
                        <div className="rec-price">{formatPrice(product.price)}</div>
                        <button 
                          type="button" 
                          className="rec-add-btn" 
                          onClick={() => addToCart(product)}
                        >
                          <Plus size={12} />
                          <span>Qo‘shish</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Cart Summary & Payment Footer */}
      <div className="cart-footer">
        <div className="summary-stack">
          {selectedTable?.status === 'OCCUPIED' && (
            <div className="cart-addon-strip">
              <span>Hozirgi: <b>{formatPrice(selectedTable.currentTotal || 0)}</b></span>
              <span className="cart-addon-arrow">→</span>
              <span>Yangi: <b>{formatPrice((selectedTable.currentTotal || 0) + total)}</b></span>
            </div>
          )}

          <div className="row-sub">
            <span>{selectedTable?.status === 'OCCUPIED' ? 'Qo‘shimcha taomlar' : (t('subtotal') || 'Oraliq summa')}</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          {settings.pricing?.taxEnabled && (
            <div className="row-sub">
              <span>{taxLabel} ({taxRate}%)</span>
              <span>{formatPrice(tax)}</span>
            </div>
          )}

          <div className="row-total">
            <span>{selectedTable?.status === 'OCCUPIED' ? 'Qo‘shiladigan summa' : (t('total') || 'Jami summa')}</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Payment Methods: Only for Takeaway/Delivery */}
        {orderType !== 'in_hall' ? (
          <div className="payment-section">
            <div className="section-label">{t('payment_method') || "To'lov turi"}</div>
            <div className="payment-grid">
              {paymentMethods.map(method => {
                const IconComp = method.icon
                return (
                  <button
                    key={method.id}
                    type="button"
                    className={`payment-method-card ${paymentMethod === method.id ? 'active' : ''}`}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <IconComp size={18} />
                    <span>{method.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="cart-dine-in-notice">
            <span>To‘lov mijoz ketayotganda kassada stol bo‘yicha yopiladi</span>
          </div>
        )}

        {/* Primary Checkout Button */}
        <button 
          type="button"
          className={`checkout-btn ${isPlacingOrder ? 'is-loading' : ''} ${(!isCustomerView && orderType === 'in_hall' && !selectedTable && cart.length > 0) ? 'need-table' : ''}`} 
          disabled={cart.length === 0 || isPlacingOrder}
          onClick={
            isKiosk 
              ? onCheckout 
              : (!isCustomerView && orderType === 'in_hall' && !selectedTable)
                ? onOpenTableSelector
                : handlePlaceOrder
          }
        >
          <span className="checkout-btn-label">
            {isPlacingOrder 
              ? 'Qabul qilinmoqda...' 
              : isKiosk 
                ? (t('confirm_order') || 'Buyurtma berish') 
                : (!isCustomerView && orderType === 'in_hall' && !selectedTable)
                  ? 'Stolni tanlang'
                  : selectedTable?.status === 'OCCUPIED'
                    ? `Stol #${selectedTable.tableNumber} ga qo‘shish`
                    : selectedTable
                      ? `Stol #${selectedTable.tableNumber} ga biriktirish`
                      : 'Buyurtmani tasdiqlash'}
          </span>
          <span className="checkout-btn-price">
            {selectedTable?.status === 'OCCUPIED' ? `+${formatPrice(total)}` : formatPrice(total)}
          </span>
        </button>
      </div>
    </aside>
  )
}

export default Cart