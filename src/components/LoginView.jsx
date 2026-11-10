import React, { useState, useEffect, useCallback } from 'react'
import { Delete, Sun, Moon, UtensilsCrossed } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useSettings } from '../context/SettingsContext'

const KEYPAD_KEYS = [
  { val: '1' },
  { val: '2' },
  { val: '3' },
  { val: '4' },
  { val: '5' },
  { val: '6' },
  { val: '7' },
  { val: '8' },
  { val: '9' },
  { val: 'C', type: 'clear' },
  { val: '0' },
  { val: '⌫', type: 'backspace' }
]

const LoginView = ({ onLogin }) => {
  const { t } = useLanguage()
  const { settings } = useSettings()

  const [pin, setPin] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 
           localStorage.getItem('pos_theme') || 
           'light'
  })

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
    localStorage.setItem('pos_theme', nextTheme)
  }

  const checkPin = useCallback(async (code) => {
    if (!code || code.length < 4 || isVerifying) return
    setIsVerifying(true)
    setErrorMsg('')
    try {
      const success = await onLogin(code)
      if (!success) {
        throw new Error('Invalid PIN')
      }
    } catch (_err) {
      setErrorMsg('Noto‘g‘ri PIN-kod')
      setIsVerifying(false)
      setTimeout(() => {
        setPin('')
        setErrorMsg('')
      }, 700)
    }
  }, [isVerifying, onLogin])

  const handleDigit = useCallback((digit) => {
    if (pin.length < 4 && !isVerifying) {
      const newPin = pin + digit
      setPin(newPin)
      if (newPin.length === 4) {
        checkPin(newPin)
      }
    }
  }, [pin, isVerifying, checkPin])

  const handleBackspace = useCallback(() => {
    if (pin.length > 0 && !isVerifying) {
      setPin(prev => prev.slice(0, -1))
      setErrorMsg('')
    }
  }, [pin.length, isVerifying])

  const handleClear = useCallback(() => {
    if (!isVerifying) {
      setPin('')
      setErrorMsg('')
    }
  }, [isVerifying])

  // Physical Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        handleBackspace()
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        handleClear()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleDigit, handleBackspace, handleClear])

  const brandName = settings.business?.name || 'JALOL KFC'

  return (
    <div className="pos-login-terminal">
      <div className="login-minimal-container">
        {/* Brand Icon & Name */}
        <div className="login-brand-block">
          <div className="login-brand-icon">
            {settings.business?.logoUrl ? (
              <img 
                src={settings.business.logoUrl} 
                alt={brandName} 
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '12px' }} 
              />
            ) : (
              <UtensilsCrossed size={24} />
            )}
          </div>
          <h1 className="login-brand-name">{brandName}</h1>
          <span className="login-sub-text">Kassir PIN-kodini kiriting</span>
        </div>

        {/* Discreet PIN Dots */}
        <div className="login-pin-dots">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < pin.length
            return (
              <div 
                key={idx} 
                className={`login-dot ${isFilled ? 'filled' : ''} ${errorMsg ? 'error' : ''}`}
              />
            )
          })}
        </div>

        {/* Error notification */}
        <div className="login-error-label">
          {errorMsg || (isVerifying ? 'Tekshirilmoqda...' : '')}
        </div>

        {/* Minimalist Keypad */}
        <div className="login-keypad-grid">
          {KEYPAD_KEYS.map((k, idx) => {
            const isClear = k.type === 'clear'
            const isBack = k.type === 'backspace'

            return (
              <button
                key={idx}
                type="button"
                className={`login-key-btn ${isClear || isBack ? 'action-key' : ''}`}
                onClick={() => {
                  if (isClear) handleClear()
                  else if (isBack) handleBackspace()
                  else handleDigit(k.val)
                }}
                disabled={isVerifying}
                aria-label={isClear ? 'Tozalash' : isBack ? 'Orqaga' : `Raqam ${k.val}`}
              >
                {isBack ? (
                  <Delete size={20} />
                ) : (
                  <span>{k.val}</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Sleek Footer */}
        <div className="login-terminal-foot">
          <span>Kassa #1 • Onlayn</span>
          <span>•</span>
          <button 
            type="button" 
            className="login-theme-toggle"
            onClick={toggleTheme}
            title={theme === 'dark' ? "Kunduzgi rejim" : "Tungi rejim"}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginView