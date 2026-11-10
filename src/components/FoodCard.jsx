import React from 'react'
import { Plus, Minus } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useSettings } from '../context/SettingsContext'
import { getBgRemovedUrl } from '../utils/imageUtils'

const FoodCard = ({ product, addToCart, updateQty, cart }) => {
  const { t } = useLanguage()
  const { formatPrice } = useSettings()
  const cartItem = cart.find(item => item._id === product._id)
  const currentQty = cartItem ? cartItem.qty : 0

  return (
    <article 
      className="product-card"
      onClick={() => {
        if (currentQty === 0) addToCart(product)
      }}
    >
      <div className="product-card-badges">
        {product.discount && (
          <span className="discount-tag">
            {product.discount}
          </span>
        )}
        {product.tag && product.tag !== 'Standart' && product.tag !== 'Non Veg' && (
          <span className="product-badge-tag">
            {product.tag}
          </span>
        )}
      </div>
      
      <div className="product-visual">
        <img 
          src={getBgRemovedUrl(product.image) || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'} 
          alt={product.name} 
          className="product-img" 
          loading="lazy" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
          }}
        />
      </div>
      
      <div className="product-content">
        <div className="product-info-minimal">
          <h3 className="product-name-label">{product.name}</h3>
          <div className="product-price-label">
            {formatPrice(product.price)}
            {product.unit && product.unit !== 'dona' && (
              <span className="product-unit-label">/ {product.unit === 'porsiya' ? 'pors' : product.unit === 'yarim' ? '0.5 pors' : product.unit}</span>
            )}
          </div>
        </div>

        <div className="card-action-area">
          {currentQty === 0 ? (
            <button 
              type="button"
              className="add-action-btn" 
              onClick={(e) => { e.stopPropagation(); addToCart(product); }}
            >
              <span>{t('add_to_cart') || "Qo'shish"}</span>
            </button>
          ) : (
            <div className="card-qty-selector" onClick={(e) => e.stopPropagation()}>
              <button 
                type="button"
                className="card-qty-btn minus" 
                onClick={() => updateQty(product._id, -1)}
                aria-label="Kamaytirish"
              >
                <Minus size={14} />
              </button>
              <span className="card-qty-val">{currentQty}</span>
              <button 
                type="button"
                className="card-qty-btn plus" 
                onClick={() => updateQty(product._id, 1)}
                aria-label="Oshirish"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default FoodCard