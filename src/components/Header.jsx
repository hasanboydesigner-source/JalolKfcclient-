import { useState } from 'react'
import { Icon } from './Icons'
import ProfileModal from './ProfileModal'
import { useLanguage } from '../context/LanguageContext'
import { useSettings } from '../context/SettingsContext'
import { Sliders, Bell, Wifi, WifiOff, RefreshCw } from 'lucide-react'

const ConnectionStatusWidget = ({ isOnline }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [lastChecked, setLastChecked] = useState(() => new Date().toLocaleTimeString())
  const [isPinging, setIsPinging] = useState(false)

  const getOfflineCount = () => {
    try {
      return JSON.parse(localStorage.getItem('offline_orders') || '[]').length
    } catch {
      return 0
    }
  }

  const handlePingTest = () => {
    setIsPinging(true)
    setTimeout(() => {
      setLastChecked(new Date().toLocaleTimeString())
      setIsPinging(false)
    }, 400)
  }

  const offlineCount = getOfflineCount()

  return (
    <div className="status-widget-wrapper">
      <button 
        type="button"
        className={`header-status-badge ${isOnline ? 'is-online' : 'is-offline'}`}
        onClick={() => setIsOpen(!isOpen)}
        title={isOnline ? "Tizim holati: Onlayn (Batafsil ma'lumot uchun bosing)" : "Tizim holati: Oflayn"}
        aria-label="Connection Status"
        aria-expanded={isOpen}
      >
        <span className="status-beacon">
          <span className="beacon-ping"></span>
          <span className="beacon-core"></span>
        </span>
        <span className="status-label-text hidden-mobile">
          {isOnline ? 'Onlayn' : 'Oflayn'}
        </span>
      </button>

      {isOpen && (
        <>
          <div className="modal-backdrop dropdown-backdrop" onClick={() => setIsOpen(false)} />
          <div className="status-details-popover">
            <div className="status-popover-header">
              <div className="status-popover-title">
                {isOnline ? (
                  <Wifi size={15} className="text-emerald" />
                ) : (
                  <WifiOff size={15} className="text-rose" />
                )}
                <span>{isOnline ? 'Tarmoq aloqasi' : 'Oflayn rejim'}</span>
              </div>
              <span className={`status-badge-chip ${isOnline ? 'chip-success' : 'chip-danger'}`}>
                {isOnline ? 'Onlayn' : 'Oflayn'}
              </span>
            </div>

            <div className="status-popover-body">
              <div className="conn-stat-row">
                <span className="conn-stat-label">Internet holati</span>
                <span className={`conn-stat-value ${isOnline ? 'text-emerald' : 'text-rose'}`}>
                  {isOnline ? 'Faol ulangan' : 'Uzilgan'}
                </span>
              </div>
              <div className="conn-stat-row">
                <span className="conn-stat-label">Sinxronizatsiya</span>
                <span className="conn-stat-value">{isOnline ? 'WebSocket faol' : 'To‘xtatilgan'}</span>
              </div>
              <div className="conn-stat-row">
                <span className="conn-stat-label">Oflayn navbat</span>
                <span className="conn-stat-value">
                  {offlineCount > 0 ? `${offlineCount} ta buyurtma` : '0 ta (yuborilgan)'}
                </span>
              </div>
              <div className="conn-stat-row">
                <span className="conn-stat-label">Oxirgi tekshiruv</span>
                <span className="conn-stat-value text-dim">{lastChecked}</span>
              </div>
            </div>

            <div className="status-popover-footer">
              <button 
                type="button" 
                className="status-refresh-btn"
                onClick={handlePingTest}
                disabled={isPinging}
              >
                <RefreshCw size={12} className={isPinging ? 'spin-anim' : ''} />
                <span>{isPinging ? 'Tekshirilmoqda...' : 'Aloqani tekshirish'}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

const Header = ({ 
  user,
  searchQuery, 
  setSearchQuery, 
  showMobileCart, 
  setShowMobileCart, 
  cartCount, 
  onLogout,
  isCustomerView,
  tableParam,
  pendingOrders,
  onCompleteOrder,
  isOnline,
  onOpenSettings
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isPendingOpen, setIsPendingOpen] = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('pos_theme') === 'dark'
  })

  const { language, t, changeLanguage } = useLanguage()
  const { formatPrice } = useSettings()

  const toggleDarkMode = () => {
    const newTheme = isDarkMode ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('pos_theme', newTheme)
    setIsDarkMode(!isDarkMode)
  }

  return (
    <header className="pos-header">
      <div className="header-main">
        {isCustomerView && (
          <div className="header-left hidden-mobile">
             <h2 className="table-badge">Stol #{tableParam}</h2>
          </div>
        )}

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
          {/* Connection Status Widget */}
          <ConnectionStatusWidget isOnline={isOnline} />

          {/* Theme Toggle Button */}
          <button 
            className="header-tool-btn" 
            onClick={toggleDarkMode}
            title={isDarkMode ? 'Yorug‘ rejim' : 'Qorong‘i rejim'}
            aria-label="Toggle theme"
          >
            <Icon name={isDarkMode ? "sun" : "moon"} size={20} />
          </button>

          {/* Language Selector */}
          <div className="lang-selector-wrapper">
            <button 
              className="header-tool-btn lang-btn" 
              onClick={() => setShowLangMenu(!showLangMenu)}
              aria-label="Change language"
            >
              <span className="lang-code-text">{language.toUpperCase()}</span>
            </button>

            {showLangMenu && (
              <>
                <div className="modal-backdrop dropdown-backdrop" onClick={() => setShowLangMenu(false)} />
                <div className="lang-dropdown-menu">
                  <button 
                    className={`lang-option ${language === 'uz' ? 'active' : ''}`}
                    onClick={() => { changeLanguage('uz'); setShowLangMenu(false); }}
                  >
                    O‘zbekcha
                  </button>
                  <button 
                    className={`lang-option ${language === 'ru' ? 'active' : ''}`}
                    onClick={() => { changeLanguage('ru'); setShowLangMenu(false); }}
                  >
                    Русский
                  </button>
                  <button 
                    className={`lang-option ${language === 'en' ? 'active' : ''}`}
                    onClick={() => { changeLanguage('en'); setShowLangMenu(false); }}
                  >
                    English
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Settings Shortcut Button for Admin */}
          {user?.role === 'admin' && onOpenSettings && (
            <button
              className="header-tool-btn"
              onClick={onOpenSettings}
              title="Tizim Sozlamalari"
              aria-label="Settings"
            >
              <Sliders size={20} />
            </button>
          )}

          {/* Mobile Cart Trigger */}
          <button 
            className="header-tool-btn show-mobile cart-trigger-btn"
            onClick={() => setShowMobileCart(!showMobileCart)}
            aria-label="Cart"
          >
            <Icon name="shopping_bag" size={20} />
            {cartCount > 0 && <span className="cart-badge-dot">{cartCount}</span>}
          </button>

          {/* Pending Orders Notification Bell */}
          {!isCustomerView && (
            <div className="notification-bell-wrapper">
              <button 
                className={`header-tool-btn ${pendingOrders && pendingOrders.length > 0 ? 'has-notifications' : ''}`}
                onClick={() => setIsPendingOpen(!isPendingOpen)}
                aria-label="Notifications"
              >
                <Bell size={20} />
                {pendingOrders && pendingOrders.length > 0 && (
                  <span className="badge-count">{pendingOrders.length}</span>
                )}
              </button>

              {isPendingOpen && (
                <>
                  <div className="modal-backdrop dropdown-backdrop" onClick={() => setIsPendingOpen(false)} />
                  <div className="pending-orders-dropdown">
                    <h3 className="dropdown-title">Yangi buyurtmalar</h3>
                    {(!pendingOrders || pendingOrders.length === 0) ? (
                      <p className="empty-msg">Hozircha buyurtmalar yo'q.</p>
                    ) : (
                      pendingOrders.map(order => (
                        <div key={order._id} className="pending-order-card">
                          <div className="order-card-header">
                            <span className="order-table">Stol #{order.tableNumber || '?'}</span>
                            <span className="order-total">{formatPrice(order.total)}</span>
                          </div>
                          <button className="complete-btn" onClick={() => onCompleteOrder(order._id)}>Bajarildi</button>
                        </div>
                      ))
                    )}
                  </div>
                </>
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
                isDarkMode={isDarkMode}
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
