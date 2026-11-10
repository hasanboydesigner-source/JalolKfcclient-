import React, { useState } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { useLanguage } from '../context/LanguageContext'
import { useSettings } from '../context/SettingsContext'
import { Upload, ImageIcon, Check } from 'lucide-react'

const ProductModal = ({ 
  isModalOpen, 
  setIsModalOpen, 
  editingProduct, 
  formData, 
  setFormData, 
  selectedFile, 
  setSelectedFile, 
  handleSaveProduct, 
  INITIAL_CATEGORIES 
}) => {
  const { t } = useLanguage()
  const { settings } = useSettings()
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [customCatInput, setCustomCatInput] = useState('')

  const currencySymbol = settings?.localization?.currencySymbol || "so'm"

  const handleCategoryChange = (e) => {
    const val = e.target.value
    if (val === '__new__') {
      setIsCustomCategory(true)
    } else {
      setIsCustomCategory(false)
      setFormData({ ...formData, category: val })
    }
  }

  const handleAddCustomCategory = () => {
    if (customCatInput.trim()) {
      const slug = customCatInput.trim().toLowerCase().replace(/\s+/g, '_')
      setFormData({ ...formData, category: slug })
      setIsCustomCategory(false)
      setCustomCatInput('')
    }
  }

  const quickTags = ['Standart', 'Katta', 'Porsiya', 'Yarim (0.5)', 'Achchiq', 'Maxsus']

  const modalFooter = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', width: '100%' }}>
      <Button 
        variant="secondary" 
        onClick={() => setIsModalOpen(false)}
      >
        {t('cancel') || 'Bekor qilish'}
      </Button>
      <Button 
        variant="primary" 
        onClick={handleSaveProduct}
      >
        {t('save') || 'Saqlash'}
      </Button>
    </div>
  )

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      title={editingProduct ? (t('edit_product') || 'Mahsulotni tahrirlash') : (t('add_product') || 'Yangi mahsulot')}
      subtitle="Taom yoki mahsulot tafsilotlarini kiriting"
      maxWidth="620px"
      footer={modalFooter}
    >
      <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Row 1: Name and Category */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="ui-form-group">
            <label className="ui-label">Mahsulot nomi</label>
            <input 
              type="text"
              required
              className="ui-input"
              value={formData.name || ''} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              placeholder="Masalan: Palov, Shashlik, Burger, Lavash, Choy..."
            />
          </div>

          <div className="ui-form-group">
            <label className="ui-label">Kategoriya</label>
            {!isCustomCategory ? (
              <select 
                className="ui-select"
                value={formData.category || 'all'}
                onChange={handleCategoryChange}
              >
                {INITIAL_CATEGORIES.filter(c => c.id !== 'all').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="__new__">+ Yangi kategoriya kiritish...</option>
              </select>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                <input 
                  type="text" 
                  className="ui-input"
                  value={customCatInput} 
                  onChange={(e) => setCustomCatInput(e.target.value)} 
                  placeholder="Yangi nom..."
                  autoFocus
                />
                <Button variant="secondary" size="sm" onClick={handleAddCustomCategory}>
                  <Check size={14} />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Price and Unit */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="ui-form-group">
            <label className="ui-label">Narxi ({currencySymbol})</label>
            <input 
              type="number" 
              required
              className="ui-input"
              value={formData.price || ''} 
              onChange={(e) => setFormData({...formData, price: e.target.value})} 
              placeholder="Masalan: 35000"
            />
          </div>

          <div className="ui-form-group">
            <label className="ui-label">O‘lchov birligi</label>
            <select 
              className="ui-select"
              value={formData.unit || 'dona'} 
              onChange={(e) => setFormData({...formData, unit: e.target.value})}
            >
              <option value="dona">Dona</option>
              <option value="porsiya">Porsiya (1 pors)</option>
              <option value="yarim">Yarim (0.5 pors)</option>
              <option value="kg">Kilogramm (kg)</option>
              <option value="litr">Litr</option>
            </select>
          </div>
        </div>

        {/* Row 3: Discount and Tag */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div className="ui-form-group">
            <label className="ui-label">Aksiya / Chegirma (ixtiyoriy)</label>
            <input 
              type="text" 
              className="ui-input"
              value={formData.discount || ''} 
              onChange={(e) => setFormData({...formData, discount: e.target.value})} 
              placeholder="Masalan: -10%, Aksiya"
            />
          </div>

          <div className="ui-form-group">
            <label className="ui-label">Modifikator / Teg</label>
            <input 
              type="text" 
              className="ui-input"
              value={formData.tag || ''} 
              onChange={(e) => setFormData({...formData, tag: e.target.value})} 
              placeholder="Standart"
            />
            <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
              {quickTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setFormData({...formData, tag})}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '9999px',
                    border: '1px solid var(--ds-border)',
                    background: formData.tag === tag ? 'var(--ds-primary)' : 'var(--ds-surface)',
                    color: formData.tag === tag ? 'var(--ds-primary-text)' : 'var(--ds-text-muted)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: Description */}
        <div className="ui-form-group">
          <label className="ui-label">Tavsif (ixtiyoriy)</label>
          <textarea 
            className="ui-textarea"
            value={formData.desc || ''} 
            onChange={(e) => setFormData({...formData, desc: e.target.value})} 
            placeholder="Mahsulot tarkibi yoki qisqacha ma'lumot..."
            rows={2}
          />
        </div>

        {/* Row 5: Image Upload */}
        <div className="ui-form-group">
          <label className="ui-label">Rasm</label>
          <div style={{
            border: '1.5px dashed var(--ds-border)',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center',
            cursor: 'pointer',
            background: 'var(--ds-surface-subtle)',
            position: 'relative'
          }}>
            <input 
              type="file" 
              id="product-file-upload"
              accept="image/*"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
            />
            {selectedFile ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#10b981', fontWeight: 600, fontSize: '0.85rem' }}>
                <ImageIcon size={20} />
                <span>{selectedFile.name} tanlandi</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--ds-text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>
                <Upload size={18} />
                <span>Rasm yuklash uchun bu yerga bosing yoki faylni tashlang</span>
              </div>
            )}
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default ProductModal