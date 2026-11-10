import React from 'react'
import { useSettings } from '../context/SettingsContext'

const SplashScreen = ({ isExiting }) => {
  const { settings } = useSettings()

  return (
    <div className={`splash-overlay ${isExiting ? 'exit' : ''}`}>
      <div className="splash-content">
        <h1 className="splash-logo-text">{settings.business?.name || 'POS TIZIMI'}</h1>
        <div className="splash-loader">
          <div className="splash-loader-bar"></div>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
