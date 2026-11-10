import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useSettings } from '../context/SettingsContext'
import { 
  LayoutGrid, 
  Package, 
  BarChart3, 
  ChefHat, 
  Sliders,
  User,
  Armchair
} from 'lucide-react'

const Sidebar = ({ user, onOpenSettings }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  const { settings } = useSettings()
  
  const currentView = 
    location.pathname === '/admin' ? 'admin' : 
    location.pathname === '/stats' ? 'stats' : 
    location.pathname === '/kitchen' ? 'kitchen' : 
    location.pathname === '/tables' ? 'tables' : 'pos'
  const isAdmin = user?.role === 'admin'
  const isKdsEnabled = settings.kds?.enabled !== false
  const brandName = settings.business?.name || 'POS Tizimi'

  const navItems = [
    { id: 'pos', path: '/', label: t('pos') || 'POS Terminal', icon: LayoutGrid, visible: true },
    { id: 'tables', path: '/tables', label: 'Stollar (Zal)', icon: Armchair, visible: true },
    { id: 'admin', path: '/admin', label: t('admin') || 'Admin Paneli', icon: Package, visible: isAdmin },
    { id: 'stats', path: '/stats', label: t('stats') || 'Statistika', icon: BarChart3, visible: isAdmin },
    { id: 'kitchen', path: '/kitchen', label: 'Oshxona (KDS)', icon: ChefHat, visible: isAdmin && isKdsEnabled },
  ]

  return (
    <aside className="pos-sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand-header">
        <div className="sidebar-brand-badge">
          {settings.business?.logoUrl ? (
            <img 
              src={settings.business.logoUrl} 
              alt={brandName} 
              className="sidebar-brand-img"
            />
          ) : (
            <span className="sidebar-brand-monogram">
              {brandName.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="sidebar-brand-info">
          <span className="sidebar-brand-name">{brandName}</span>
          <span className="sidebar-brand-tag">Savdo Tizimi</span>
        </div>
      </div>

      {/* Navigation Stack */}
      <nav className="nav-stack">
        {navItems.filter(item => item.visible).map(item => {
          const IconComp = item.icon
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              type="button"
              className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <IconComp size={18} className="sidebar-nav-icon" />
              <span className="sidebar-nav-label">{item.label}</span>
              {isActive && <span className="sidebar-active-indicator" />}
            </button>
          )
        })}

        {/* Settings button if Admin */}
        {isAdmin && onOpenSettings && (
          <button
            type="button"
            className="sidebar-nav-btn"
            onClick={onOpenSettings}
          >
            <Sliders size={18} className="sidebar-nav-icon" />
            <span className="sidebar-nav-label">Sozlamalar</span>
          </button>
        )}
      </nav>

      {/* Cashier Footer Profile */}
      <div className="sidebar-footer">
        <div className="sidebar-cashier-card">
          <div className="sidebar-cashier-avatar">
            <User size={15} />
          </div>
          <div className="sidebar-cashier-meta">
            <span className="sidebar-cashier-name">
              {user?.name || (isAdmin ? 'Administrator' : 'Kassir')}
            </span>
            <span className="sidebar-cashier-role">
              {isAdmin ? 'Admin' : 'Smena faol'}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
