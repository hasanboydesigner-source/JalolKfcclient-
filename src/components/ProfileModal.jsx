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

  return (
    <div className="profile-modal-overlay">
      <div ref={modalRef} className="profile-modal-content">
        <div className="profile-modal-header">
          <div className="profile-modal-avatar">
            <Icon name="user" size={32} strokeWidth={2.5} />
          </div>
          <div className="profile-modal-name">{user?.name || t('profile')}</div>
          <div className="profile-modal-role">
            {user?.role === 'admin' ? t('administrator') : t('cashier')}
          </div>
        </div>

        <div className="profile-modal-body">
          {!showPassForm ? (
            <>
              <button 
                className="profile-action-btn" 
                onClick={() => setShowPassForm(true)}
              >
                <Icon name="settings" size={20} /> 
                <span>{t('change_passcode')}</span>
              </button>
              <button 
                className="profile-action-btn logout" 
                onClick={onLogout}
              >
                <Icon name="logout" size={20} /> 
                <span>{t('logout_confirm')}</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleUpdatePasscode} className="minimal-form">
              <div className="form-field">
                <label>{t('old_passcode')}</label>
                <input 
                  type="password" 
                  maxLength="4"
                  placeholder="****"
                  value={passData.oldPin}
                  onChange={(e) => setPassData({...passData, oldPin: e.target.value})}
                  required 
                />
              </div>
              <div className="form-field">
                <label>{t('new_passcode')}</label>
                <input 
                  type="password" 
                  maxLength="4"
                  placeholder="****"
                  value={passData.newPin}
                  onChange={(e) => setPassData({...passData, newPin: e.target.value})}
                  required 
                />
              </div>
              <div className="form-field">
                <label>{t('confirm_passcode')}</label>
                <input 
                  type="password" 
                  maxLength="4"
                  placeholder="****"
                  value={passData.confirmPin}
                  onChange={(e) => setPassData({...passData, confirmPin: e.target.value})}
                  required 
                />
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="profile-action-btn" 
                  onClick={() => setShowPassForm(false)}
                >
                  {t('back')}
                </button>
                <button 
                  type="submit" 
                  className="profile-action-btn active" 
                  disabled={loading}
                >
                  {loading ? '...' : t('save')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileModal
