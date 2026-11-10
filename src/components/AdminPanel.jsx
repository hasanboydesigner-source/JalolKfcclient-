import React, { useState } from 'react'
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useSettings } from '../context/SettingsContext'
import { getBgRemovedUrl } from '../utils/imageUtils'

const AdminPanel = ({ products, searchQuery = '', handleOpenModal, handleDeleteProduct, INITIAL_CATEGORIES = [] }) => {
  const { t } = useLanguage()
  const { formatPrice } = useSettings()
  const [activeCategory, setActiveCategory] = useState('all')
  const [localSearch, setLocalSearch] = useState('')

  const effectiveSearch = localSearch || searchQuery

  const filtered = products.filter(p => {
    const matchesSearch = !effectiveSearch || p.name.toLowerCase().includes(effectiveSearch.toLowerCase())
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <section className="admin-view-inner" style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* Header Row */}
      <div className="admin-header-row">
        <div>
          <h2 className="admin-title">Admin Paneli</h2>
          <p className="admin-subtitle">
            Menyu taomlari va mahsulotlar boshqaruvi • {filtered.length} ta mahsulot
          </p>
        </div>

        <button 
          type="button"
          className="fp-action-btn-primary" 
          onClick={() => handleOpenModal()}
        >
          <Plus size={15} />
          <span>{t('add_product')}</span>
        </button>
      </div>

      {/* Filter Controls: Category Tabs & Local Search */}
      <div className="floor-plan-controls" style={{ marginBottom: '14px' }}>
        <div className="segmented-zone-tabs">
          <button
            type="button"
            className={`zone-tab-pill ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            Barchasi ({products.length})
          </button>
          {INITIAL_CATEGORIES.map(cat => {
            const count = products.filter(p => p.category === cat.id).length
            return (
              <button
                key={cat.id}
                type="button"
                className={`zone-tab-pill ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name} ({count})
              </button>
            )
          })}
        </div>

        <div className="floor-plan-search-box">
          <Search 
            size={14} 
            style={{ 
              position: 'absolute', 
              left: '11px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#94a3b8',
              pointerEvents: 'none'
            }} 
          />
          <input
            type="text"
            className="floor-plan-search-input"
            placeholder="Mahsulot qidirish..."
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
          />
        </div>
      </div>
      
      {/* Products Table */}
      <div className="admin-table-wrapper hidden-mobile">
        <table className="refined-table">
          <thead>
            <tr>
              <th>Mahsulot nomi</th>
              <th>Kategoriya</th>
              <th>Narxi</th>
              <th>Aksiya</th>
              <th style={{ textAlign: 'right' }}>Amal</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                  <Package size={28} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <div>Mahsulot topilmadi</div>
                </td>
              </tr>
            ) : (
              filtered.map(product => {
                const catObj = INITIAL_CATEGORIES.find(c => c.id === product.category)
                return (
                  <tr key={product._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={getBgRemovedUrl(product.image)} className="table-img" alt="" />
                        <div className="table-name-group">
                          <div className="table-name">{product.name}</div>
                          <div className="table-category-tag">
                            {product.tag === 'Veg' ? t('veg') : product.tag === 'Non Veg' ? t('non_veg') : product.tag || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="table-cat-badge">
                        {catObj?.name || product.category}
                      </span>
                    </td>
                    <td>
                      <span className="table-price">{formatPrice(product.price)}</span>
                    </td>
                    <td>
                      {product.discount ? (
                        <span className="table-discount-badge">{product.discount}</span>
                      ) : (
                        <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div className="action-stack" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          type="button"
                          className="mini-action-btn edit" 
                          onClick={() => handleOpenModal(product)}
                          title="Tahrirlash"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          type="button"
                          className="mini-action-btn delete" 
                          onClick={() => handleDeleteProduct(product._id)}
                          title="O‘chirish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="admin-card-list show-mobile">
        {filtered.map(product => (
          <div key={product._id} className="mobile-admin-card">
            <div className="card-main-info">
              <img src={getBgRemovedUrl(product.image)} alt="" className="card-thumb" />
              <div className="card-details">
                <div className="card-name">{product.name}</div>
                <div className="card-meta">
                  <span>{INITIAL_CATEGORIES.find(c => c.id === product.category)?.name || product.category}</span>
                  <span className="dot">•</span>
                  <span>{formatPrice(product.price)}</span>
                </div>
              </div>
            </div>
            <div className="card-actions">
              <button 
                type="button"
                className="mobile-action-btn edit" 
                onClick={() => handleOpenModal(product)}
              >
                <Pencil size={15} /> {t('edit_product')}
              </button>
              <button 
                type="button"
                className="mobile-action-btn delete" 
                onClick={() => handleDeleteProduct(product._id)}
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default AdminPanel
