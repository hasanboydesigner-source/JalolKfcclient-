import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = '540px'
}) => {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const content = (
    <div className="ui-modal-overlay" onClick={onClose}>
      <div 
        className="ui-modal-card" 
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ui-modal-header">
          <div>
            <h3 className="ui-modal-title">{title}</h3>
            {subtitle && <p className="ui-modal-subtitle">{subtitle}</p>}
          </div>
          <button 
            type="button" 
            className="ui-modal-close-btn" 
            onClick={onClose}
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        </div>

        <div className="ui-modal-body">
          {children}
        </div>

        {footer && (
          <div className="ui-modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export default Modal