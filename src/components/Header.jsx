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
      <div className="header-main-row">
        <div className="header-left-brand">
          <div className="logo-badge">J</div>
          <div className="brand-name hidden-mobile">JalolKFC</div>
          {isCustomerView && (
             <h2 className="table-badge">Stol #{tableParam}</h2>
          )}
        </div>

        <div className="header-right-tools">
          {!isOnline && (
            <div className="offline-badge">
              <Icon name="clock" size={14} />
              <span>Oflayn</span>
            </div>
          )}
          
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="language-selector"
          >
            <option value="uz">UZ</option>
            <option value="ru">RU</option>
            <option value="en">EN</option>
          </select>

          <button onClick={toggleDarkMode} className="theme-toggle header-tool-btn">
            <Icon name={isDarkMode ? 'sun' : 'moon'} size={20} />
          </button>

          <button 
            className={`mobile-cart-toggle header-tool-btn ${showMobileCart ? 'active' : ''}`}
            onClick={() => setShowMobileCart(!showMobileCart)}
          >
            <Icon name="cart" size={22} />
            {cartCount > 0 && (
              <div className="cart-badge">{cartCount}</div>
            )}
          </button>

          {!isCustomerView && (
            <div style={{ position: 'relative' }}>
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
                        <div className="order-items">
                          {order.items.map((i, idx) => (
                            <div key={idx}>- {i.qty}x {i.name}</div>
                          ))}
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
            <div style={{ position: 'relative' }}>
              <div className="profile-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <div className="profile-info hidden-mobile">
                  <div className="profile-name">{user?.name || 'Admin'}</div>
                  <div className="profile-role">
                    {user?.role === 'admin' ? t('administrator') : t('cashier')}
                  </div>
                </div>
                <div className="profile-avatar">
                  <Icon name="user" size={18} strokeWidth={2.5} />
                </div>
              </div>

              <ProfileModal 
                isOpen={isDropdownOpen} 
                onClose={() => setIsDropdownOpen(false)} 
                onLogout={onLogout}
                user={user}
                currentView={currentView}
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
