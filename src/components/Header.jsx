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
  onCompleteOrder
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
      <div className="search-field" style={{ background: isCustomerView ? 'transparent' : '' }}>
        {isCustomerView ? (
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--pos-text)' }}>Stol #{tableParam}</h2>
        ) : (
          <>
            <Icon name="search" size={18} className="text-dim" />
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </>
        )}
      </div>
      
      <div className="header-right-tools">
        {/* Language Selection Select */}
        <div className="language-selector-wrapper">
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="language-selector"
          >
            <option value="uz">UZ</option>
            <option value="ru">RU</option>
            <option value="en">EN</option>
          </select>
          <div style={{
            position: 'absolute',
            right: '10px',
            pointerEvents: 'none',
            color: 'var(--pos-text-muted)',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Icon name="chevron_down" size={14} />
          </div>
        </div>
        

        <button 
          onClick={toggleDarkMode}
          className="theme-toggle header-tool-btn"
        >
          <Icon name={isDarkMode ? 'sun' : 'moon'} size={20} />
        </button>

        <button 
          className={`mobile-cart-toggle header-tool-btn ${showMobileCart ? 'active' : ''}`}
          onClick={() => setShowMobileCart(!showMobileCart)}
        >
          <Icon name="cart" size={22} />
          {cartCount > 0 && (
            <div className="cart-badge" style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: 'var(--brand-primary)',
              color: 'white',
              fontSize: '10px',
              fontWeight: 800,
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              {cartCount}
            </div>
          )}
        </button>

        {!isCustomerView && (
          <div style={{ position: 'relative' }}>
            <div className="profile-trigger hidden-mobile" onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ cursor: 'pointer' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>{user?.name || 'Foydalanuvchi'}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--pos-text-muted)', textTransform: 'capitalize' }}>
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

        {!isCustomerView && (
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsPendingOpen(!isPendingOpen)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--slate-100)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <Icon name="clock" size={20} />
              {pendingOrders?.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'red',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 800,
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {pendingOrders.length}
                </div>
              )}
            </button>

            {isPendingOpen && (
              <div style={{
                position: 'absolute',
                top: '50px',
                right: 0,
                width: '300px',
                background: 'var(--pos-surface)',
                border: '1px solid var(--pos-border)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-lg)',
                zIndex: 1000,
                maxHeight: '400px',
                overflowY: 'auto',
                padding: '16px'
              }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem' }}>Yangi buyurtmalar</h3>
                {(!pendingOrders || pendingOrders.length === 0) ? (
                  <p style={{ color: 'var(--pos-text-muted)', margin: 0, fontSize: '0.9rem' }}>Hozircha buyurtmalar yo'q.</p>
                ) : (
                  pendingOrders.map(order => (
                    <div key={order._id} style={{ 
                      padding: '12px',
                      background: 'var(--slate-50)',
                      borderRadius: '8px',
                      marginBottom: '12px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>Stol #{order.tableNumber || '?'}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--pos-text-muted)' }}>{order.total.toLocaleString()} so'm</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--pos-text)', marginBottom: '12px' }}>
                        {order.items.map((i, idx) => (
                          <div key={idx}>- {i.qty}x {i.name}</div>
                        ))}
                      </div>
                      <button 
                        onClick={() => onCompleteOrder(order._id)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          background: 'var(--brand-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Bajarildi
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
