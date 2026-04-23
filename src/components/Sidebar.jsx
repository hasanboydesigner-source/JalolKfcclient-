import { useNavigate, useLocation } from 'react-router-dom'
import { Icon } from './Icons'
import { useLanguage } from '../context/LanguageContext'

const Sidebar = ({ user }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  
  const currentView = location.pathname === '/admin' ? 'admin' : location.pathname === '/stats' ? 'stats' : 'pos'
  const isAdmin = user?.role === 'admin'

  return (
    <aside className="pos-sidebar">
      <div className="logo-container hidden-mobile">
        <div className="logo-badge">JL</div>
        <div className="brand-name">Jalol KFC</div>
      </div>
      <nav className="nav-stack">
        <div 
          className={`nav-item ${currentView === 'pos' ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          <Icon name="menu" size={22} />
          <span className="nav-label">{t('pos')}</span>
        </div>

        {isAdmin && (
          <>
            <div 
              className={`nav-item ${currentView === 'admin' ? 'active' : ''}`}
              onClick={() => navigate('/admin')}
            >
              <Icon name="settings" size={22} />
              <span className="nav-label">{t('admin')}</span>
            </div>
            <div 
              className={`nav-item ${currentView === 'stats' ? 'active' : ''}`}
              onClick={() => navigate('/stats')}
            >
              <Icon name="chart" size={22} />
              <span className="nav-label">{t('stats')}</span>
            </div>
            <div 
              className={`nav-item ${currentView === 'kitchen' ? 'active' : ''}`}
              onClick={() => navigate('/kitchen')}
            >
              <Icon name="pizza" size={22} />
              <span className="nav-label">Oshxona</span>
            </div>
          </>
        )}
      </nav>
    </aside>
  )
}

export default Sidebar
