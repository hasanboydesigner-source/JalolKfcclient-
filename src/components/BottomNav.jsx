import { useNavigate, useLocation } from 'react-router-dom'
import { Icon } from './Icons'
import { useLanguage } from '../context/LanguageContext'

const BottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useLanguage()
  
  const currentView = location.pathname === '/admin' ? 'admin' : 
                     location.pathname === '/stats' ? 'stats' : 
                     location.pathname === '/kitchen' ? 'kitchen' : 'pos'

  return (
    <nav className="bottom-navigation">
      <div 
        className={`mobile-nav-item ${currentView === 'pos' ? 'active' : ''}`}
        onClick={() => navigate('/')}
      >
        <Icon name="menu" size={20} />
        <span>{t('pos')}</span>
      </div>
      <div 
        className={`mobile-nav-item ${currentView === 'kitchen' ? 'active' : ''}`}
        onClick={() => navigate('/kitchen')}
      >
        <Icon name="clock" size={20} />
        <span>{t('kitchen')}</span>
      </div>
      <div 
        className={`mobile-nav-item ${currentView === 'admin' ? 'active' : ''}`}
        onClick={() => navigate('/admin')}
      >
        <Icon name="settings" size={20} />
        <span>{t('admin')}</span>
      </div>
      <div 
        className={`mobile-nav-item ${currentView === 'stats' ? 'active' : ''}`}
        onClick={() => navigate('/stats')}
      >
        <Icon name="chart" size={20} />
        <span>{t('stats')}</span>
      </div>
    </nav>
  )
}

export default BottomNav
