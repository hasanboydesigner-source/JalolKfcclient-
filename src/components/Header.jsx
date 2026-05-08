import { useState, useEffect } from 'react'
import { Icon } from './Icons'
import ProfileModal from './ProfileModal'
import { useLanguage } from '../context/LanguageContext'

const Header = ({ 
  user,
  searchQuery, 
  setSearchQuery, 
  currentView, 
  showMobileCart, 
  setShowMobileCart, 
  cartCount, 
  onLogout,
  isCustomerView,
  tableParam,
  pendingOrders,
  onCompleteOrder,
  isOnline
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isPendingOpen, setIsPendingOpen] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(document.documentElement.getAttribute('data-theme') === 'dark')
  const { language, t, changeLanguage } = useLanguage()

  const toggleDarkMode = () => {
    const newTheme = isDarkMode ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('pos_theme', newTheme)
    setIsDarkMode(!isDarkMode)
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('pos_theme') || 'light'
    document.documentElement.setAttribute('data-theme', savedTheme)
    setIsDarkMode(savedTheme === 'dark')
  }, [])

  return (
    <header className="pos-header">
      <div className="header-main">
        <div className="header-left hidden-desktop">
          <div className="logo-badge">J</div>
          <span className="brand-name hidden-mobile">JalolKFC</span>
          {isCustomerView && (
             <h2 className="table-badge">Stol #{tableParam}</h2>
          )}
        </div>

        {!isCustomerView && (
          <div className="header-center">
            <div className="search-field">
              <Icon name="search" size={18} className="text-dim" />
              <input 
                type="text" 
                placeholder={t('search_placeholder')} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="header-right-tools">
          {!isOnline && (
            <div className="offline-badge">
              <Icon name="clock" size={14} />
              <span>Oflayn</span>
            </div>
          )}
          
          {/* Custom Language Dropdown */}
          <div className="tool-wrapper">
            <button className="header-tool-btn" onClick={() => setShowLangMenu(!showLangMenu)}>
              {language.toUpperCase()}
            </button>
            {showLangMenu && (
              <div className="compact-dropdown">
                {['uz', 'ru', 'en'].map(lang => (
                  <div 
                    key={lang} 
                    className={`dropdown-item ${language === lang ? 'active' : ''}`}
                    onClick={() => { changeLanguage(lang); setShowLangMenu(false); }}
                  >
                    {lang.toUpperCase()}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={toggleDarkMode} className="header-tool-btn">
            <Icon name={isDarkMode ? 'sun' : 'moon'} size={20} />
          </button>

          <button 
            className={`header-tool-btn ${showMobileCart ? 'active' : ''}`}
            onClick={() => setShowMobileCart(!showMobileCart)}
          >
            <Icon name="cart" size={22} />
            {cartCount > 0 && <div className="cart-badge">{cartCount}</div>}
          </button>

          {!isCustomerView && (
            <div className="tool-wrapper">
              <button 
                onClick={() => setIsPendingOpen(!isPendingOpen)}
                className={`header-tool-btn ${isPendingOpen ? 'active' : ''}`}
              >
                <Icon name="clock" size={20} />
                {pendingOrders?.length > 0 && (
                  <div className="pending-badge">{pendingOrders.length}</div>
                )}
              </button>

              {isPendingOpen && (
                <div className="pending-orders-dropdown">
                  <h3 className="dropdown-title">Yangi buyurtmalar</h3>
                  {(!pendingOrders || pendingOrders.length === 0) ? (
                    <p className="empty-msg">Hozircha buyurtmalar yo'q.</p>
                  ) : (
                    pendingOrders.map(order => (
                      <div key={order._id} className="pending-order-card">
                        <div className="order-card-header">
                          <span className="order-table">Stol #{order.tableNumber || '?'}</span>
                          <span className="order-total">{order.total.toLocaleString()} so'm</span>
                        </div>
                        <button className="complete-btn" onClick={() => onCompleteOrder(order._id)}>Bajarildi</button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {!isCustomerView && (
            <div className="tool-wrapper">
              <div 
                className={`header-tool-btn ${isDropdownOpen ? 'active' : ''}`} 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Icon name="user" size={20} />
              </div>

              <ProfileModal 
                isOpen={isDropdownOpen} 
                onClose={() => setIsDropdownOpen(false)} 
                onLogout={onLogout}
                user={user}
              />
            </div>
          )}
        </div>
      </div>

      {!isCustomerView && (
        <div className="search-row">
          <div className="search-field">
            <Icon name="search" size={18} className="text-dim" />
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
