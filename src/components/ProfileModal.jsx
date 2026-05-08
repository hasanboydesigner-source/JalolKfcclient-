import React, { useState, useEffect, useRef } from 'react'
import { Icon } from './Icons'
import { toast } from 'react-toastify'
import axios from 'axios'
import { useLanguage } from '../context/LanguageContext'

const ProfileModal = ({ isOpen, onClose, onLogout, user, currentView }) => {
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

  // If password form is shown, use the full modal overlay style
  if (showPassForm) {
    return (
      <div className="profile-modal-overlay">
        <div ref={modalRef} className="profile-modal-container">
          <div className="profile-modal-header">
            <div className="profile-modal-title">{t('change_passcode')}</div>
            <div className="profile-modal-subtitle">
              {user?.role === 'admin' ? t('administrator') : t('cashier')}
            </div>
          </div>

          <div className="profile-modal-body">
            <form onSubmit={handleUpdatePasscode}>
              <div className="modal-input-group">
                <label className="modal-label">{t('old_passcode')}</label>
                <input 
                  type="password" 
                  className="modal-input"
                  maxLength="4"
                  placeholder="****"
                  value={passData.oldPin}
                  onChange={(e) => setPassData({...passData, oldPin: e.target.value})}
                  required 
                />
              </div>
              <div className="modal-input-group">
                <label className="modal-label">{t('new_passcode')}</label>
                <input 
                  type="password" 
                  className="modal-input"
                  maxLength="4"
                  placeholder="****"
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
                  placeholder="****"
                  value={passData.confirmPin}
                  onChange={(e) => setPassData({...passData, confirmPin: e.target.value})}
                  required 
                />
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
      </div>
    )
  }

  // Otherwise, show as a dropdown
  return (
    <div ref={modalRef} className="compact-dropdown profile-modal-container" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '12px', width: '280px' }}>
      <div className="profile-modal-header" style={{ padding: '20px 24px' }}>
        <div className="profile-modal-title" style={{ fontSize: '1.1rem' }}>{user?.name || t('profile')}</div>
        <div className="profile-modal-subtitle">
          {user?.role === 'admin' ? t('administrator') : t('cashier')}
        </div>
      </div>

      <div className="profile-modal-body" style={{ padding: '0 12px 12px' }}>
        <button 
          className="profile-action-btn" 
          onClick={() => setShowPassForm(true)}
          style={{ marginBottom: '4px' }}
        >
          <Icon name="settings" size={18} /> 
          <span>{t('change_passcode')}</span>
        </button>
        <button 
          className="profile-action-btn logout" 
          onClick={onLogout}
          style={{ color: 'var(--pos-danger)' }}
        >
          <Icon name="logout" size={18} /> 
          <span>{t('logout_confirm')}</span>
        </button>
      </div>
    </div>
  )
}

export default ProfileModal
