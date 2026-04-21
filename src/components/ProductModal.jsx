import { useLanguage } from '../context/LanguageContext'

const ProductModal = ({ isModalOpen, setIsModalOpen, editingProduct, formData, setFormData, selectedFile, setSelectedFile, handleSaveProduct, INITIAL_CATEGORIES }) => {
  const { t } = useLanguage()

  const getTagOptions = (category) => {
    switch (category) {
      case 'burgers':
        return [
          { value: 'Asl', label: t('original') },
          { value: 'Achchiq', label: t('spicy') },
          { value: 'Non Veg', label: t('non_veg') },
          { value: 'Veg', label: t('veg') },
          { value: 'Double', label: t('double') }
        ];
      case 'pizza':
        return [
          { value: 'Asl', label: t('original') },
          { value: 'Achchiq', label: t('spicy') },
          { value: 'Qo\'ziqorinli', label: "Qo'ziqorinli" },
          { value: 'Pishloqli', label: "Pishloqli" }
        ];
      case 'buckets':
        return [
          { value: 'Asl', label: t('original') },
          { value: 'Achchiq', label: t('spicy') },
          { value: 'Duo', label: t('duo') },
          { value: 'Family', label: t('family') },
        ];
      case 'drinks':
        return [
          { value: '0.5L', label: "0.5 L" },
          { value: '1.0L', label: "1.0 L" },
          { value: '1.5L', label: "1.5 L" },
          { value: '0.33L', label: "0.33 L" },
          { value: 'Gazlangan', label: "Gazlangan" },
          { value: 'Tabiiy', label: "Tabiiy" },
        ];
      case 'sides':
        return [
          { value: 'Standart', label: "Standart" },
          { value: 'Kichik', label: "Kichik (Small)" },
          { value: 'O\'rta', label: "O'rta (Medium)" },
          { value: 'Katta', label: "Katta (Large)" },
          { value: 'Box', label: "Box (Qutida)" },
        ];
      default:
        return [
          { value: 'Asl', label: t('original') },
          { value: 'Achchiq', label: t('spicy') },
          { value: 'Veg', label: t('veg') },
        ];
    }
  };

  if (!isModalOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-sheet">
        <div className="modal-header">
          <h2 className="modal-title">{editingProduct ? t('edit_product') : t('add_product')}</h2>
          <p style={{ color: 'var(--pos-text-muted)', fontSize: '0.85rem', marginTop: '4px', fontWeight: 600 }}>{t('professional_desc')}</p>
        </div>
        
        <form onSubmit={handleSaveProduct}>
          <div className="form-grid">
            <div className="form-field">
              <label>{t('product_name')}</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Masalan: Klassik Burger"
                required 
              />
            </div>
            <div className="form-field">
              <label>{t('category')}</label>
              <select 
                value={formData.category} 
                onChange={(e) => {
                  const newCategory = e.target.value;
                  const newTags = getTagOptions(newCategory);
                  setFormData({...formData, category: newCategory, tag: newTags[0].value});
                }}
              >
                {INITIAL_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-3">
            <div className="form-field">
              <label>{t('price')} ({t('sum')})</label>
              <input 
                type="number" 
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: e.target.value})} 
                placeholder="0"
                required 
              />
            </div>
            <div className="form-field">
              <label>{t('category')}</label>
              <select 
                value={formData.tag} 
                onChange={(e) => setFormData({...formData, tag: e.target.value})}
              >
                {getTagOptions(formData.category).map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Aksiya</label>
              <input 
                type="text" 
                value={formData.discount} 
                onChange={(e) => setFormData({...formData, discount: e.target.value})} 
                placeholder="Masalan: 10% Off"
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="form-field">
              <label>{t('desc')}</label>
              <textarea 
                value={formData.desc} 
                onChange={(e) => setFormData({...formData, desc: e.target.value})} 
                placeholder="..."
                rows={4}
                style={{ resize: 'none' }}
              ></textarea>
            </div>
            <div className="form-field">
              <label>{t('upload_img')}</label>
              <div style={{ 
                background: 'var(--slate-50)', 
                border: '1px dashed var(--pos-border)', 
                borderRadius: 'var(--radius-lg)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  style={{ fontSize: '0.8rem', width: '100%' }}
                />
                {editingProduct && !selectedFile && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--pos-text-dim)', fontWeight: 600 }}>
                    {t('current_img')}
                  </div>
                )}
                {selectedFile && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--pos-success)', fontWeight: 700 }}>
                    {t('new_img_selected')}: {selectedFile.name}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer-actions">
            <button 
              type="button" 
              className="qty-btn cancel-btn" 
              onClick={() => setIsModalOpen(false)}
            >
              {t('cancel')}
            </button>
            <button 
              type="submit" 
              className="checkout-btn save-btn"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductModal
