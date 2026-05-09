import React from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../context/LanguageContext'
import { X, Package, Tag, DollarSign, Layers, AlignLeft, Upload, Image as ImageIcon, AlertCircle } from 'lucide-react'

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

  const modalContent = (
    <div className="modal-overlay">
      <div className="modal-sheet">
        <button className="modal-close-btn" onClick={() => setIsModalOpen(false)}>
          <X size={20} />
        </button>

        <div className="modal-header">
          <div className="modal-icon-header">
            <Package size={24} color="var(--slate-900)" />
          </div>
          <h2 className="modal-title">{editingProduct ? t('edit_product') : t('add_product')}</h2>
          <p style={{ color: 'var(--pos-text-muted)', fontSize: '0.85rem', marginTop: '4px', fontWeight: 600 }}>
            {editingProduct ? "Mahsulot ma'lumotlarini tahrirlash" : "Yangi mahsulot ma'lumotlarini kiriting"}
          </p>
        </div>
        
        <form onSubmit={handleSaveProduct} className="premium-form">
          <div className="form-grid">
            <div className="form-field">
              <label>
                <Layers size={14} />
                {t('product_name')}
              </label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="Masalan: Klassik Burger"
                required 
              />
            </div>
            <div className="form-field">
              <label>
                <Tag size={14} />
                {t('category')}
              </label>
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
              <label>
                <DollarSign size={14} />
                {t('price')} ({t('sum')})
              </label>
              <input 
                type="number" 
                value={formData.price} 
                onChange={(e) => setFormData({...formData, price: e.target.value})} 
                placeholder="0"
                required 
              />
            </div>
            <div className="form-field">
              <label>
                <Layers size={14} />
                Teg / Turi
              </label>
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
              <label>
                <Tag size={14} />
                Aksiya / Chegirma
              </label>
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
              <label>
                <AlignLeft size={14} />
                {t('desc')}
              </label>
              <textarea 
                value={formData.desc} 
                onChange={(e) => setFormData({...formData, desc: e.target.value})} 
                placeholder="Mahsulot haqida qisqacha ma'lumot..."
                rows={3}
                style={{ resize: 'none' }}
              ></textarea>
            </div>
            <div className="form-field">
              <label>
                <Upload size={14} />
                {t('upload_img')}
              </label>
              <div className="premium-upload-area">
                <input 
                  type="file" 
                  id="file-upload"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="hidden-file-input"
                />
                <label htmlFor="file-upload" className="upload-drop-zone">
                  {selectedFile ? (
                    <div className="upload-success">
                      <ImageIcon size={24} />
                      <span>{selectedFile.name}</span>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <Upload size={24} />
                      <span>Rasm yuklash yoki tanlash</span>
                    </div>
                  )}
                </label>
                {editingProduct && !selectedFile && (
                  <div className="current-img-hint">
                    <AlertCircle size={12} />
                    Hozirgi rasm saqlanadi
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer-actions">
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={() => setIsModalOpen(false)}
            >
              {t('cancel')}
            </button>
            <button 
              type="submit" 
              className="save-btn"
            >
              {t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export default ProductModal
