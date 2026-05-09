import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import { 
  ChefHat, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Signal, 
  SignalLow, 
  Maximize2,
  Package,
  ShoppingCart,
  Timer,
  Play
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../hooks/useSocket';
import { getBgRemovedUrl } from '../utils/imageUtils';

const NEW_ORDER_SOUND = '/bell.wav'; // Local custom bell sound

const KitchenPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { t } = useLanguage();
  const audio = useMemo(() => {
    const a = new Audio(NEW_ORDER_SOUND);
    a.volume = 0.8;
    return a;
  }, []);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/orders');
      // Ensure we only show active orders in the kitchen
      const activeOrders = res.data.filter(o => 
        ['Pending', 'Preparing', 'Ready'].includes(o.status)
      );
      setOrders(activeOrders);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      // Fallback to stats if orders endpoint fails, but it usually doesn't have items
      try {
        const res = await axios.get('/api/stats');
        const activeOrders = (res.data.recentOrders || []).filter(o => 
          ['Pending', 'Preparing', 'Ready'].includes(o.status)
        );
        setOrders(activeOrders);
      } catch (e) {
        toast.error("Ma'lumotlarni yuklashda xatolik", { theme: "dark" });
      } finally {
        setLoading(false);
      }
    }
  };

  const playNotification = useCallback(() => {
    // 1. Play bell chime
    if (audio) {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Audio playback failed:", error);
        });
      }
    }

    // 2. Voice notification in Uzbek
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech to avoid queueing
      window.speechSynthesis.cancel();

      const msg = new SpeechSynthesisUtterance("Yangi buyurtma");
      
      const voices = window.speechSynthesis.getVoices();
      const preferredVoices = ['uz', 'tr', 'ru', 'en'];
      
      let selectedVoice = null;
      for (const lang of preferredVoices) {
        selectedVoice = voices.find(v => v.lang.toLowerCase().startsWith(lang));
        if (selectedVoice) break;
      }
      
      if (selectedVoice) msg.voice = selectedVoice;
      msg.lang = selectedVoice ? selectedVoice.lang : 'uz-UZ';
      msg.rate = 0.9;
      msg.pitch = 1.0;
      msg.volume = 1.0;
      
      window.speechSynthesis.speak(msg);
    }
  }, [audio]);

  const handleNewOrder = useCallback((newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    playNotification();
    toast.success(`YANGI BUYURTMA: #${newOrder._id.slice(-4).toUpperCase()}`, {
      icon: <ShoppingCart size={18} />,
      position: "top-right",
      theme: "dark"
    });
  }, [playNotification]);

  const handleStatusUpdate = useCallback((updatedOrder) => {
    setOrders(prev => {
      if (['Completed', 'Cancelled'].includes(updatedOrder.status)) {
        return prev.filter(o => o._id !== updatedOrder._id);
      }
      return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
    });
  }, []);

  const [audioEnabled, setAudioEnabled] = useState(() => {
    return sessionStorage.getItem('kds_audio_active') === 'true';
  });

  const socket = useSocket(handleNewOrder, handleStatusUpdate);

  const activateAudio = () => {
    // Prime the audio object with a silent play or immediate play
    audio.play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        setAudioEnabled(true);
        sessionStorage.setItem('kds_audio_active', 'true');
        toast.success("Ovozli tizim faollashtirildi", { theme: "dark", autoClose: 1500 });
        // Also prime speech synthesis
        if ('speechSynthesis' in window) {
          const m = new SpeechSynthesisUtterance("");
          window.speechSynthesis.speak(m);
        }
      })
      .catch(e => {
        console.error("Audio activation failed:", e);
        toast.error("Ovozni yoqib bo'lmadi. Brauzer sozlamalarini tekshiring.");
      });
  };

  useEffect(() => {
    if (socket) {
      setIsConnected(socket.connected);
      socket.on('connect', () => setIsConnected(true));
      socket.on('disconnect', () => setIsConnected(false));
    }
  }, [socket]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    // Optimistic UI Update (Instant Feedback)
    setOrders(prev => {
      if (['Completed', 'Cancelled'].includes(newStatus)) {
        return prev.filter(o => o._id !== orderId);
      }
      return prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o);
    });

    try {
      await axios.put(`/api/orders/${orderId}/status`, { status: newStatus });
    } catch (err) {
      console.error('Status update failed:', err);
      // If the API call fails, fetch fresh data to revert the optimistic update
      fetchOrders();
    }
  };

  const preparingOrders = orders.filter(o => ['Pending', 'Preparing'].includes(o.status));
  const readyOrders = orders.filter(o => o.status === 'Ready');

  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'ready'

  if (loading) {
    return (
      <div className="kds-loader-wrap">
        <div className="kds-custom-loader" />
        <span style={{ fontSize: '0.85rem', color: '#71717a', fontWeight: 500 }}>INITIALIZING SYSTEM...</span>
      </div>
    );
  }

  return (
    <div className="kds-container">
      {!audioEnabled && (
        <div className="kds-audio-overlay">
          <div className="kds-overlay-content">
            <div className="kds-overlay-icon">
              <ChefHat size={48} color="#e4002b" />
            </div>
            <h2>KDS TIZIMI TAYYOR</h2>
            <p>Ovozli bildirishnomalar va real-vaqt sinxronizatsiyasini boshlash uchun tugmani bosing</p>
            <button className="kds-start-btn" onClick={activateAudio}>
              <Play size={22} fill="white" />
              TIZIMNI YUKLASH
            </button>
          </div>
        </div>
      )}

      <header className="kds-header">
        <div className="kds-brand-section">
          <div className="kds-brand">
            <ChefHat size={20} color="#e4002b" />
            <h1>KDS BOARD</h1>
          </div>
          <div className={`kds-status-tag ${isConnected ? 'live' : 'reconnecting'}`}>
            <Signal size={10} />
            <span>{isConnected ? 'LIVE' : 'OFFLINE'}</span>
          </div>
        </div>

        <div className="kds-stats-center">
          <div className="kds-stat-item">
            <span className="val">{preparingOrders.length}</span>
            <span className="lbl">PREPARING</span>
          </div>
          <div className="kds-stat-divider"></div>
          <div className="kds-stat-item">
            <span className="val success">{readyOrders.length}</span>
            <span className="lbl">READY</span>
          </div>
        </div>

        <div className="kds-header-right">
          <button 
            className="kds-audio-btn" 
            onClick={activateAudio}
            title="Ovozni faollashtirish"
          >
            <SignalLow size={16} />
            <span>OVOZ</span>
          </button>
          <div className="kds-time-box">
            <span className="time">{currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
            <span className="date">{currentTime.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}</span>
          </div>
          <button className="kds-fullscreen-btn" onClick={() => document.documentElement.requestFullscreen()}>
            <Maximize2 size={14} />
          </button>
        </div>
      </header>

      <div className="kds-mobile-tabs show-mobile">
        <button 
          className={`kds-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <Timer size={16} />
          <span>FAOL ({preparingOrders.length})</span>
        </button>
        <button 
          className={`kds-tab-btn ${activeTab === 'ready' ? 'active' : ''}`}
          onClick={() => setActiveTab('ready')}
        >
          <CheckCircle2 size={16} />
          <span>TAYYOR ({readyOrders.length})</span>
        </button>
      </div>

      <main className="kds-main">
        {(activeTab === 'active' || window.innerWidth > 900) && (
          <section className="kds-shelf active-orders">
            <div className="kds-shelf-header">
              <div className="shelf-title">
                <Timer size={14} color="#f59e0b" />
                <h2>FAOL BUYURTMALAR</h2>
              </div>
              <span className="shelf-count">{preparingOrders.length}</span>
            </div>
            <div className="kds-scroll-area">
              <AnimatePresence mode="popLayout">
                {preparingOrders.map(order => (
                  <Ticket 
                    key={order._id} 
                    order={order} 
                    onAction={() => updateStatus(order._id, 'Ready')}
                    btnLabel="TAYYOR"
                    btnClass="primary"
                  />
                ))}
              </AnimatePresence>
              {preparingOrders.length === 0 && (
                <div className="kds-empty-box">
                  <div className="empty-icon-wrap">
                    <Package size={32} />
                  </div>
                  <p>Oshxona bo'sh</p>
                  <span>Yangi buyurtmalar kutilmoqda</span>
                </div>
              )}
            </div>
          </section>
        )}

        {(activeTab === 'ready' || window.innerWidth > 900) && (
          <section className="kds-shelf ready-orders">
            <div className="kds-shelf-header">
              <div className="shelf-title">
                <CheckCircle2 size={14} color="#10b981" />
                <h2>TAYYOR BUYURTMALAR</h2>
              </div>
              <span className="shelf-count">{readyOrders.length}</span>
            </div>
            <div className="kds-scroll-area">
              <AnimatePresence mode="popLayout">
                {readyOrders.map(order => (
                  <Ticket 
                    key={order._id} 
                    order={order} 
                    onAction={() => updateStatus(order._id, 'Completed')}
                    btnLabel="TOPSHIRILDI"
                    btnClass="success"
                  />
                ))}
              </AnimatePresence>
              {readyOrders.length === 0 && (
                <div className="kds-empty-box">
                  <div className="empty-icon-wrap success">
                    <CheckCircle2 size={32} />
                  </div>
                  <p>Tayyor buyurtmalar yo'q</p>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

const Ticket = ({ order, onAction, btnLabel, btnClass }) => {
  const [timeStr, setTimeStr] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!order?.createdAt) return;
    
    const update = () => {
      const created = new Date(order.createdAt);
      const now = new Date();
      if (isNaN(created.getTime())) return;
      
      const diffMs = now - created;
      const diffMins = diffMs / 60000;
      
      setTimeStr(formatDistanceToNow(created, { addSuffix: true }));
      setProgress(Math.min((diffMins / 20) * 100, 100));
    };
    update();
    const itv = setInterval(update, 10000); // 10s is enough for relative time
    return () => clearInterval(itv);
  }, [order?.createdAt]);

  const orderIdShort = order?._id ? (typeof order._id === 'string' ? order._id.slice(-4).toUpperCase() : String(order._id).slice(-4)) : '????';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="kds-ticket"
    >
      <div 
        className="kds-ticket-urgency" 
        style={{ 
          width: `${progress}%`, 
          background: progress > 75 ? '#ef4444' : (progress > 50 ? '#f59e0b' : '#3b82f6'),
          minHeight: '4px'
        }} 
      />
      
      <div className="kds-ticket-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="id">#{orderIdShort}</div>
          {order?.tableNumber && (
            <div className="kds-table-badge">
              STOL #{order.tableNumber}
            </div>
          )}
        </div>
        <div className="time">
          <Clock size={12} />
          {timeStr}
        </div>
      </div>

      <div className="kds-ticket-body">
        {order?.items?.length > 0 ? (
          order.items.map((item, i) => (
            <div key={i} className="kds-item-row">
              <div className="kds-item-qty">{item.qty}</div>
              <div className="kds-item-img-wrap">
                <img src={getBgRemovedUrl(item.image)} alt={item.name} className="kds-item-img" />
              </div>
              <div className="kds-item-details">
                <div className="kds-item-name">{item.name}</div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '0.8rem' }}>
            No items in order
          </div>
        )}
        
        {order?.note && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '8px', borderLeft: '3px solid #f59e0b', fontSize: '0.8rem', color: '#71717a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontWeight: 700, color: '#f59e0b', fontSize: '0.65rem', textTransform: 'uppercase' }}>
              <AlertCircle size={10} /> Note
            </div>
            {order.note}
          </div>
        )}
      </div>

      <div className="kds-ticket-footer">
        <button className={`kds-action-btn ${btnClass}`} onClick={onAction}>
          {btnClass === 'success' ? <CheckCircle2 size={18} /> : <ChefHat size={18} />}
          {btnLabel}
        </button>
      </div>
    </motion.div>
  );
};

export default KitchenPage;
