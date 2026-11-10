import React, { useState, useEffect, useRef } from 'react'
import { X, KeyRound, LogOut } from 'lucide-react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { useLanguage } from '../context/LanguageContext'

const ProfileModal = ({ isOpen, onClose, onLogout, user, isDarkMode }) => {
  const { t } = useLanguage()
  const [showPassForm, setShowPassForm] = useState(false)
  const [passData, setPassData] = useState({ oldPin: '', newPin: '', confirmPin: '' })
  const [loading, setLoading] = useState(false)
  const modalRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleUpdatePasscode = async (e) => {
    e.preventDefault()
    if (passData.newPin !== passData.confirmPin) {
      return toast.error(t('passcode_mismatch'))
    }
    if (passData.newPin.length !== 4) {
      return toast.error(t('passcode_length'))
    }

    setLoading(true)
    try {
      const res = await axios.put('/api/auth/passcode', {
        oldPin: passData.oldPin,
        newPasscode: passData.newPin,
        role: user?.role || 'admin'
      })
      if (res.data.success) {
        toast.success(t('passcode_success'))
        setShowPassForm(false)
        setPassData({ oldPin: '', newPin: '', confirmPin: '' })
        onClose()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('unknown'))
    } finally {
      setLoading(false)
    }
  }

  const surfaceBg = isDarkMode ? '#0f172a' : '#ffffff';
  const textColor = isDarkMode ? '#e2e8f0' : '#0f172a';

  // If password form is shown, use the full modal overlay style
  if (showPassForm) {
    return (
      <div className="profile-modal-overlay" onClick={onClose}>
        <div 
          ref={modalRef} 
          className="profile-modal-container" 
          style={{ backgroundColor: surfaceBg }}
          onClick={e => e.stopPropagation()}
        >
          <div className="profile-modal-header">
            <div>
              <h3 className="profile-modal-title" style={{ color: textColor }}>{t('change_passcode')}</h3>
              <p className="profile-modal-subtitle">
                {user?.role === 'admin' ? t('administrator') : t('cashier')} • Yangi 4 xonali PIN kod
              </p>
            </div>
            <button
              type="button"
              className="profile-modal-close-btn"
              onClick={() => {
                setShowPassForm(false)
                onClose()
              }}
              aria-label="Yopish"
            >
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleUpdatePasscode}>
            <div className="profile-modal-body">
              <div className="modal-input-group">
                <label className="modal-label">{t('old_passcode')}</label>
                <input 
                  type="password" 
                  className="modal-input"
                  maxLength="4"
                  placeholder="••••"
                  value={passData.oldPin}
                  onChange={(e) => setPassData({...passData, oldPin: e.target.value})}
                  required 
                  autoFocus
                />
              </div>
              <div className="modal-input-group">
                <label className="modal-label">{t('new_passcode')}</label>
                <input 
                  type="password" 
                  className="modal-input"
                  maxLength="4"
                  placeholder="••••"
                  value={passData.newPin}
                  onChange={(e) => setPassData({...passData, newPin: e.target.value})}
                  required 
                />
              </div>
              <div className="modal-input-group">
                <label className="modal-label">{t('confirm_passcode')}</label>
                <input 
                  type="password" 
                  className="modal-input"
                  maxLength="4"
                  placeholder="••••"
                  value={passData.confirmPin}
                  onChange={(e) => setPassData({...passData, confirmPin: e.target.value})}
                  required 
                />
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="modal-btn modal-btn-cancel" 
                onClick={() => setShowPassForm(false)}
              >
                {t('back')}
              </button>
              <button 
                type="submit" 
                className="modal-btn modal-btn-save" 
                disabled={loading}
              >
                {loading ? '...' : t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Otherwise, show as a dropdown
  return (
    <div 
      ref={modalRef} 
      className="profile-modal-container dropdown-mode" 
      style={{ 
        backgroundColor: surfaceBg,
        position: 'absolute',
        top: '100%',
        right: 0,
        zIndex: 1000
      }}
    >
      <div className="profile-modal-header" style={{ padding: '12px 14px 10px', borderBottom: '1px solid #f1f5f9' }}>
        <div>
          <div className="profile-modal-title" style={{ fontSize: '0.92rem', color: textColor }}>
            {user?.name || (user?.role === 'admin' ? 'Administrator' : 'Kassir')}
          </div>
          <div className="profile-modal-subtitle" style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '1px' }}>
            {user?.role === 'admin' ? 'Boshqaruvchi hisobi' : 'Smena xodimi'}
          </div>
        </div>
      </div>

      <div className="profile-modal-body" style={{ padding: '6px' }}>
        <button 
          className="profile-action-btn" 
          onClick={() => setShowPassForm(true)}
          style={{ color: textColor }}
        >
          <KeyRound size={15} /> 
          <span>{t('change_passcode')}</span>
        </button>
        <button 
          className="profile-action-btn logout" 
          onClick={onLogout}
          style={{ color: '#ef4444' }}
        >
          <LogOut size={15} /> 
          <span>{t('logout_confirm')}</span>
        </button>
      </div>
    </div>
  )
}

export default ProfileModal
