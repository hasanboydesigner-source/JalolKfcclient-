import { Icon } from './Icons'
import { useLanguage } from '../context/LanguageContext'

const AdminPanel = ({ products, searchQuery, handleOpenModal, handleDeleteProduct, INITIAL_CATEGORIES }) => {
  const { t } = useLanguage()
  const filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <section className="admin-view-inner">
      <div className="admin-header-row">
        <h2 style={{ fontSize: '2rem', fontWeight: 800 }}>{t('admin')}</h2>
        <button className="checkout-btn" style={{ width: 'auto', padding: '14px 28px' }} onClick={() => handleOpenModal()}>
          + {t('add_product')}
        </button>
      </div>
      
      <div className="admin-table-wrapper hidden-mobile">
        <table className="refined-table">
          <thead>
            <tr>
              <th>{t('product_name')}</th>
              <th>{t('category')}</th>
              <th>{t('price')}</th>
              <th>Aksiya</th>
              <th style={{ textAlign: 'right' }}>{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(product => (
              <tr key={product._id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <img src={product.image} className="table-img" alt="" />
                    <div className="table-name-group">
                      <div className="table-name">{product.name}</div>
                      <div className="table-category-tag">
                        {product.tag === 'Veg' ? t('veg') : product.tag === 'Non Veg' ? t('non_veg') : product.tag}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span style={{ 
                    padding: '6px 12px', 
                    background: 'var(--slate-100)', 
                    borderRadius: '8px', 
                    fontSize: '0.8rem', 
                    fontWeight: 700 
                  }}>
                    {INITIAL_CATEGORIES.find(c => c.id === product.category)?.name}
                  </span>
                </td>
                <td>
                  <span className="table-price">{product.price.toLocaleString()} {t('sum')}</span>
                </td>
                <td>
                  {product.discount ? (
                    <span style={{ color: 'var(--pos-danger)', fontWeight: 700, fontSize: '0.85rem' }}>{product.discount}</span>
                  ) : (
                    <span style={{ color: 'var(--pos-text-dim)', fontSize: '0.85rem' }}>{t('no_discount')}</span>
                  )}
                </td>
                <td>
                  <div className="action-stack" style={{ justifyContent: 'flex-end' }}>
                    <button className="mini-action-btn edit" onClick={() => handleOpenModal(product)}><Icon name="edit" size={16} /></button>
                    <button className="mini-action-btn delete" onClick={() => handleDeleteProduct(product._id)}><Icon name="delete" size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card-list show-mobile">
        {filtered.map(product => (
          <div key={product._id} className="mobile-admin-card">
            <div className="card-main-info">
              <img src={product.image} alt="" className="card-thumb" />
              <div className="card-details">
                <div className="card-name">{product.name}</div>
                <div className="card-meta">
                  <span>{INITIAL_CATEGORIES.find(c => c.id === product.category)?.name}</span>
                  <span className="dot">•</span>
                  <span>{product.price.toLocaleString()} {t('sum')}</span>
                </div>
              </div>
            </div>
            <div className="card-actions">
              <button className="mobile-action-btn edit" onClick={() => handleOpenModal(product)}>
                <Icon name="edit" size={18} /> {t('edit_product')}
              </button>
              <button className="mobile-action-btn delete" onClick={() => handleDeleteProduct(product._id)}>
                <Icon name="delete" size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default AdminPanel
