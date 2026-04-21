import React, { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

const LoginView = ({ onLogin }) => {
  const { t } = useLanguage()
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    
    const handleKeyDown = (e) => {
      // Numbers 0-9
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key)
      }
      // Backspace
      if (e.key === 'Backspace') {
        handleBackspace()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      clearInterval(timer)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [pin]) // Re-bind when pin change to avoid stale closure in checkPin if needed, 
            // though handleDigit usage here is fine since it doesn't rely on current pin state 
            // directly but through setPin callback if modified. Let's keep it safe.

  const handleDigit = (digit) => {
    if (pin.length < 4) {
      const newPin = pin + digit
      setPin(newPin)
      if (newPin.length === 4) {
        checkPin(newPin)
      }
    }
  }

  const checkPin = async (code) => {
    try {
      const success = await onLogin(code)
      if (!success) {
        throw new Error('Invalid PIN')
      }
    } catch (err) {
      setError(true)
      setTimeout(() => {
        setError(false)
        setPin('')
      }, 600)
    }
  }

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1))
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <header style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--slate-100)' }}>
          <div style={{ textAlign: 'left' }}>
            <h1 className="login-brand">JALOL KFC</h1>
            <p className="login-subtitle" style={{ marginBottom: 0 }}>{t('terminal_entry')}</p>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--slate-800)', letterSpacing: '-0.02em' }}>
            {formatTime(time)}
          </div>
        </header>

        <div className="pin-display" style={{ marginBottom: '32px' }}>
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className={`pin-dot ${i < pin.length ? 'active' : ''} ${error ? 'error' : ''}`}
            />
          ))}
        </div>

        <div className="numpad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button key={num} className="num-btn" onClick={() => handleDigit(num.toString())}>
              {num}
            </button>
          ))}
          <div style={{ width: 64 }}></div>
          <button className="num-btn" onClick={() => handleDigit('0')}>0</button>
          <button className="num-btn clear" onClick={handleBackspace}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"></path>
              <line x1="18" y1="9" x2="12" y2="15"></line>
              <line x1="12" y1="9" x2="18" y2="15"></line>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginView
