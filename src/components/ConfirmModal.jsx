import { useLanguage } from '../context/LanguageContext'

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }) => {
  const { t } = useLanguage()
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel} style={{ zIndex: 6000 }}>
      <div 
        className="confirm-modal-sheet" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="confirm-modal-content">
          <h3 className="confirm-modal-title">{t('confirm_title')}</h3>
          <p className="confirm-modal-message">{message}</p>
          
          <div className="confirm-modal-actions">
            <button className="confirm-btn cancel" onClick={onCancel}>
              {t('no')}
            </button>
            <button className="confirm-btn confirm" onClick={onConfirm}>
              {t('yes')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
