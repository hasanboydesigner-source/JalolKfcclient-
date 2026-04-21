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
    <div style={{ 
      position: 'absolute',
      top: 'calc(100% + 12px)',
      right: '0',
      zIndex: 5000,
      animation: 'slideUp 0.2s ease'
    }}>
      <div 
        ref={modalRef}
        style={{ 
          width: '280px',
          background: 'var(--pos-surface)',
          borderRadius: 'var(--radius-xl)',
          boxShadow: 'var(--shadow-premium)',
          border: '1px solid var(--pos-border-subtle)',
          overflow: 'hidden'
        }}
      >
        <div style={{ padding: '20px', borderBottom: '1px solid var(--pos-border-subtle)', background: 'var(--slate-50)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="profile-avatar" style={{ width: '36px', height: '36px' }}>
              <Icon name="user" size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{user?.name || t('profile')}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--pos-text-muted)', textTransform: 'capitalize' }}>
                {user?.role === 'admin' ? t('administrator') : t('cashier')}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '8px' }}>
          {!showPassForm ? (
            <>
              <button 
                className="nav-item" 
                style={{ height: '40px', border: 'none', background: 'none' }}
                onClick={() => setShowPassForm(true)}
              >
                <Icon name="settings" size={16} /> 
                <span className="nav-label" style={{ fontSize: '0.85rem' }}>{t('change_passcode')}</span>
              </button>
              <button 
                className="nav-item" 
                style={{ height: '40px', border: 'none', background: 'none', color: 'var(--pos-danger)' }}
                onClick={onLogout}
              >
                <Icon name="logout" size={16} /> 
                <span className="nav-label" style={{ fontSize: '0.85rem' }}>{t('logout_confirm')}</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleUpdatePasscode} style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.7rem' }}>{t('old_passcode')}</label>
                <input 
                  type="password" 
                  maxLength="4"
                  placeholder="****"
                  style={{ height: '36px', padding: '8px 12px', fontSize: '0.9rem' }}
                  value={passData.oldPin}
                  onChange={(e) => setPassData({...passData, oldPin: e.target.value})}
                  required 
                />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.7rem' }}>{t('new_passcode')}</label>
                <input 
                  type="password" 
                  maxLength="4"
                  placeholder="****"
                  style={{ height: '36px', padding: '8px 12px', fontSize: '0.9rem' }}
                  value={passData.newPin}
                  onChange={(e) => setPassData({...passData, newPin: e.target.value})}
                  required 
                />
              </div>
              <div className="form-field" style={{ marginBottom: 0 }}>
                <label style={{ fontSize: '0.7rem' }}>{t('confirm_passcode')}</label>
                <input 
                  type="password" 
                  maxLength="4"
                  placeholder="****"
                  style={{ height: '36px', padding: '8px 12px', fontSize: '0.9rem' }}
                  value={passData.confirmPin}
                  onChange={(e) => setPassData({...passData, confirmPin: e.target.value})}
                  required 
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button 
                  type="button" 
                  className="qty-btn" 
                  style={{ flex: 1, height: '36px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
                  onClick={() => setShowPassForm(false)}
                >
                  {t('back')}
                </button>
                <button 
                  type="submit" 
                  className="checkout-btn" 
                  style={{ flex: 1.5, height: '36px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }} 
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
