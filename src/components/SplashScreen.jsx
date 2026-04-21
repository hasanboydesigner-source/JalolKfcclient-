import React from 'react'

const SplashScreen = ({ isExiting }) => {
  return (
    <div className={`splash-overlay ${isExiting ? 'exit' : ''}`}>
      <div className="splash-content">
        <h1 className="splash-logo-text">JALOL KFC</h1>
        <div className="splash-loader">
          <div className="splash-loader-bar"></div>
        </div>
      </div>
    </div>
  )
}

export default SplashScreen
