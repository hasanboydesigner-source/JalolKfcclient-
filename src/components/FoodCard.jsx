import { Icon } from './Icons'
import { useLanguage } from '../context/LanguageContext'

const FoodCard = ({ product, addToCart, updateQty, cart }) => {
  const { t } = useLanguage()
  const cartItem = cart.find(item => item._id === product._id)
  const currentQty = cartItem ? cartItem.qty : 0

  return (
    <article className="product-card">
      {product.discount && (
        <span className="discount-tag">
          {product.discount}
        </span>
      )}
      
      <div className="product-visual">
        <img src={product.image} alt={product.name} className="product-img" loading="lazy" />
      </div>
      
      <div className="product-content">
        <div className="product-info-minimal">
          <h3 className="product-name-label">{product.name}</h3>
          <div className="product-price-label">{product.price.toLocaleString()} {t('sum')}</div>
        </div>

        <div className="card-action-area">
          {currentQty === 0 ? (
            <button className="add-action-btn" onClick={() => addToCart(product)}>
              <span className="hidden-mobile">{t('add_to_cart')}</span>
              <span className="show-mobile-flex" style={{ display: 'none', alignItems: 'center', gap: '8px' }}>
                <Icon name="plus" size={16} /> {t('add_to_cart')}
              </span>
            </button>
          ) : (
            <div className="card-qty-selector">
              <button className="card-qty-btn minus" onClick={() => updateQty(product._id, -1)}>
                <Icon name="minus" size={14} />
              </button>
              <span className="card-qty-val">{currentQty}</span>
              <button className="card-qty-btn plus" onClick={() => updateQty(product._id, 1)}>
                <Icon name="plus" size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default FoodCard
