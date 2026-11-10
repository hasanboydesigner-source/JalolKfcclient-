import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  Clock, 
  Check, 
  ArrowLeft, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  Sun,
  Moon,
  CheckCircle2
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useSocket } from '../hooks/useSocket';

const KitchenPage = () => {
  const navigate = useNavigate();
  const { settings } = useSettings();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [checkedItems, setCheckedItems] = useState({});
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'ready' | 'all'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [theme, setTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') || 
           localStorage.getItem('pos_theme') || 
           'light';
  });

  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem('kds_muted') === 'true';
  });

  const audio = useMemo(() => {
    const soundUrl = settings?.kds?.soundUrl || '/bell.wav';
    const a = new Audio(soundUrl);
    a.volume = 0.8;
    return a;
  }, [settings?.kds?.soundUrl]);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await axios.get('/api/orders?status=Pending,Preparing,Ready');
      setOrders(res.data || []);
    } catch (err) {
      console.error('KDS fetch error:', err);
      if (!silent) toast.error("Buyurtmalarni yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  // Sound playback on new order
  const playSound = useCallback(() => {
    if (isMuted || !audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [isMuted, audio]);

  // WebSocket Live Updates
  const handleNewOrder = useCallback((order) => {
    playSound();
    setOrders(prev => {
      if (prev.some(o => o._id === order._id)) return prev;
      return [order, ...prev];
    });
    const num = (order.orderNumber || order._id.slice(-4)).replace(/^#+/, '');
    toast.info(`Yangi buyurtma: #${num}`, { autoClose: 2000 });
  }, [playSound]);

  const handleStatusUpdate = useCallback((updatedOrder) => {
    setOrders(prev => {
      if (['Completed', 'Cancelled'].includes(updatedOrder.status)) {
        return prev.filter(o => o._id !== updatedOrder._id);
      }
      return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
    });
  }, []);

  const { isConnected } = useSocket(handleNewOrder, handleStatusUpdate);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('pos_theme', next);
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('kds_muted', String(next));
      return next;
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Status Bump
  const updateStatus = useCallback(async (orderId, nextStatus) => {
    setOrders(prev => {
      if (['Completed', 'Cancelled'].includes(nextStatus)) {
        return prev.filter(o => o._id !== orderId);
      }
      return prev.map(o => o._id === orderId ? { ...o, status: nextStatus } : o);
    });

    try {
      await axios.put(`/api/orders/${orderId}/status`, { status: nextStatus });
    } catch (err) {
      console.error('Status error:', err);
      fetchOrders(true);
    }
  }, [fetchOrders]);

  // Toggle item line
  const toggleItemDone = (orderId, itemIdx) => {
    const key = `${orderId}_${itemIdx}`;
    setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Elapsed time
  const getElapsed = useCallback((createdAt) => {
    if (!createdAt) return { text: '00:00', mins: 0 };
    const diffSec = Math.max(0, Math.floor((currentTime.getTime() - new Date(createdAt).getTime()) / 1000));
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    return {
      text: `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`,
      mins
    };
  }, [currentTime]);

  const preparingOrders = useMemo(() => orders.filter(o => ['Pending', 'Preparing'].includes(o.status)), [orders]);
  const readyOrders = useMemo(() => orders.filter(o => o.status === 'Ready'), [orders]);

  const displayedOrders = useMemo(() => {
    if (activeTab === 'active') return preparingOrders;
    if (activeTab === 'ready') return readyOrders;
    return orders;
  }, [activeTab, preparingOrders, readyOrders, orders]);

  // Spacebar to bump first order
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === 'Space' && displayedOrders.length > 0) {
        e.preventDefault();
        const first = displayedOrders[0];
        const next = ['Pending', 'Preparing'].includes(first.status) ? 'Ready' : 'Completed';
        updateStatus(first._id, next);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [displayedOrders, updateStatus]);

  const brandName = settings.business?.name || 'KFC';

  return (
    <div className="kds-root">
      {/* 3-Column Header: Never Overflows, Always Symmetrical */}
      <header className="kds-topbar">
        {/* Left: Back button + Brand + Live Pill */}
        <div className="kds-topbar-left">
          <button 
            type="button" 
            className="kds-back-btn" 
            onClick={() => navigate('/')}
            title="Kassaga qaytish"
          >
            <ArrowLeft size={15} />
            <span>Kassa</span>
          </button>

          <div className="kds-brand-info">
            <span className="kds-brand-title">{brandName}</span>
            <span className="kds-brand-sub">Oshxona</span>
            <span className="kds-online-pill">
              <span className="kds-online-dot" />
              <span>{isConnected ? 'Onlayn' : 'Ulanmoqda'}</span>
            </span>
          </div>
        </div>

        {/* Center: Perfectly Centered Segmented Control */}
        <div className="kds-center-tabs">
          <button 
            type="button" 
            className={`kds-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            <span>Tayyorlanmoqda</span>
            <span className="kds-tab-badge">{preparingOrders.length}</span>
          </button>

          <button 
            type="button" 
            className={`kds-tab-btn ${activeTab === 'ready' ? 'active' : ''}`}
            onClick={() => setActiveTab('ready')}
          >
            <span>Tayyor</span>
            <span className="kds-tab-badge">{readyOrders.length}</span>
          </button>

          <button 
            type="button" 
            className={`kds-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <span>Barchasi</span>
            <span className="kds-tab-badge">{orders.length}</span>
          </button>
        </div>

        {/* Right: Clock & Operational Tools */}
        <div className="kds-topbar-right">
          <div className="kds-clock-box">
            <Clock size={13} style={{ opacity: 0.6 }} />
            <span className="kds-clock-text">
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </span>
          </div>

          <div className="kds-tool-divider" />

          <button 
            type="button" 
            className={`kds-icon-btn ${isMuted ? 'is-muted' : ''}`}
            onClick={toggleMute}
            title={isMuted ? "Ovozni yoqish" : "Ovozni o‘chirish"}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>

          <button 
            type="button" 
            className={`kds-icon-btn ${refreshing ? 'is-spinning' : ''}`}
            onClick={handleManualRefresh}
            title="Yangilash"
          >
            <RefreshCw size={14} className={refreshing ? 'spin-anim' : ''} />
          </button>

          <button 
            type="button" 
            className="kds-icon-btn"
            onClick={toggleFullscreen}
            title={isFullscreen ? "Kichiklashtirish" : "To‘liq ekran"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          <button 
            type="button" 
            className="kds-icon-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? "Kunduzgi rejim" : "Tungi rejim"}
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Content Area: Tickets Rack */}
      {settings?.kds?.enabled === false && (
        <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '12px 20px', borderRadius: '12px', margin: '14px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Oshxona displeyi (KDS) tizim sozlamalarida o‘chirilgan. Choyxona/kafe rejimida buyurtmalar kassa tomonidan to‘g‘ridan-to‘g‘ri boshqariladi.
            </span>
          </div>
          <button
            type="button"
            className="pos-action-btn-secondary"
            style={{ height: '32px', fontSize: '0.8rem', padding: '0 14px', background: '#ffffff', color: '#92400e', borderColor: '#fde68a' }}
            onClick={() => navigate('/')}
          >
            Kassaga qaytish
          </button>
        </div>
      )}

      <main className="kds-content-area">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#94a3b8', fontWeight: 600 }}>
            Yuklanmoqda...
          </div>
        ) : displayedOrders.length === 0 ? (
          <div className="kds-empty-box">
            <CheckCircle2 size={44} style={{ color: '#10b981', marginBottom: '12px' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 4px 0', color: 'inherit' }}>
              Buyurtmalar navbati bo‘sh
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
              Yangi buyurtmalar kelganda bu yerda avtomatik ko‘rinadi.
            </p>
          </div>
        ) : (
          <div className="kds-tickets-grid">
            {displayedOrders.map((order) => {
              const { text: timerText, mins } = getElapsed(order.createdAt);
              const isReady = order.status === 'Ready';
              const timerVariant = isReady ? 'normal' : mins >= 10 ? 'late' : mins >= 5 ? 'warning' : 'normal';

              const rawNum = String(order.orderNumber || (order._id ? order._id.slice(-4) : '001')).replace(/^#+/, '');
              const cleanOrderNum = `#${rawNum}`;

              return (
                <div key={order._id} className="kds-ticket-card">
                  {/* Top Row: #Number, Type, Timer */}
                  <div className="ticket-top-row">
                    <span className="ticket-number-tag">
                      {cleanOrderNum}
                    </span>

                    <div className="ticket-meta-badges">
                      <span className="ticket-type-pill">
                        {order.orderType || 'Zalda'} {order.tableNumber ? `(#${order.tableNumber})` : ''}
                      </span>
                      <span className={`ticket-timer-badge ${timerVariant}`}>
                        <Clock size={11} />
                        <span>{timerText}</span>
                      </span>
                    </div>
                  </div>

                  {/* Items Body */}
                  <div className="ticket-items-body">
                    {(order.items || []).map((item, idx) => {
                      const itemKey = `${order._id}_${idx}`;
                      const isDone = !!checkedItems[itemKey];

                      return (
                        <div 
                          key={idx}
                          className={`ticket-item-line ${isDone ? 'is-done' : ''}`}
                          onClick={() => toggleItemDone(order._id, idx)}
                          title="Belgilash uchun bosing"
                        >
                          <div className="item-quantity-box">
                            {item.qty || 1}
                          </div>
                          <div className="item-details-box">
                            <span className="item-title-name">
                              {item.name}
                            </span>
                            {item.tag && item.tag !== 'Standart' && item.tag !== 'Non Veg' && (
                              <span className="item-custom-note">
                                • {item.tag}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Single Clean Bump Action */}
                  <div className="ticket-footer-action">
                    {order.status === 'Ready' ? (
                      <button 
                        type="button"
                        className="btn-kds-bump completed-btn"
                        onClick={() => updateStatus(order._id, 'Completed')}
                      >
                        <Check size={16} />
                        <span>Topshirildi</span>
                      </button>
                    ) : (
                      <button 
                        type="button"
                        className="btn-kds-bump"
                        onClick={() => updateStatus(order._id, 'Ready')}
                      >
                        <Check size={16} />
                        <span>Tayyor</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default KitchenPage;