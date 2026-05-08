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
  Timer
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../hooks/useSocket';
import { getBgRemovedUrl } from '../utils/imageUtils';

const NEW_ORDER_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3';

const KitchenPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { t } = useLanguage();
  const audio = useMemo(() => new Audio(NEW_ORDER_SOUND), []);

  // Live Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await axios.get('/api/stats');
      const activeOrders = res.data.recentOrders.filter(o => 
        ['Pending', 'Preparing', 'Ready'].includes(o.status)
      );
      setOrders(activeOrders);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast.error("Ma'lumotlarni yuklashda xatolik", { theme: "dark" });
    }
  };

  const handleNewOrder = useCallback((newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    audio.play().catch(e => console.log('Audio play failed:', e));
    toast.success(`NEW ORDER: #${newOrder._id.slice(-4).toUpperCase()}`, {
      icon: <ShoppingCart size={18} />,
      position: "top-right",
      theme: "dark"
    });
  }, [audio]);

  const handleStatusUpdate = useCallback((updatedOrder) => {
    setOrders(prev => {
      if (['Completed', 'Cancelled'].includes(updatedOrder.status)) {
        return prev.filter(o => o._id !== updatedOrder._id);
      }
      return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
    });
  }, []);

  const socket = useSocket(handleNewOrder, handleStatusUpdate);

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
      <header className="kds-header">
        <div className="kds-brand">
          <ChefHat size={22} color="#e4002b" />
          <h1>KDS BOARD</h1>
          <div className="kds-status-tag">
            {isConnected ? <Signal size={12} /> : <SignalLow size={12} />}
            {isConnected ? 'SYSTEM LIVE' : 'RECONNECTING'}
          </div>
        </div>

        <div className="kds-stats-center">
          <div className="kds-stat-item">
            <span className="val">{preparingOrders.length}</span>
            <span className="lbl">Preparing</span>
          </div>
          <div className="kds-stat-item">
            <span className="val" style={{ color: '#10b981' }}>{readyOrders.length}</span>
            <span className="lbl">Ready</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'monospace' }}>
              {currentTime.toLocaleTimeString('en-US', { hour12: false })}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: 600 }}>
              {currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </div>
          </div>
          <button className="kds-control-btn" onClick={() => document.documentElement.requestFullscreen()}>
            <Maximize2 size={16} />
          </button>
        </div>
      </header>

      <main className="kds-main">
        <section className="kds-shelf">
          <div className="kds-shelf-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Timer size={14} color="#f59e0b" />
              <h2>FAOL BUYURTMALAR</h2>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#71717a' }}>{preparingOrders.length} BUYURTMA</span>
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
                <Package size={40} />
                <p>Queue is clear</p>
              </div>
            )}
          </div>
        </section>

        <section className="kds-shelf">
          <div className="kds-shelf-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={14} color="#10b981" />
              <h2>TAYYOR BUYURTMALAR</h2>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#71717a' }}>{readyOrders.length} BUYURTMA</span>
          </div>
          <div className="kds-scroll-area">
            <AnimatePresence mode="popLayout">
              {readyOrders.map(order => (
                <Ticket 
                  key={order._id} 
                  order={order} 
                  onAction={() => updateStatus(order._id, 'Completed')}
                  btnLabel="BAJARILDI"
                  btnClass="success"
                />
              ))}
            </AnimatePresence>
            {readyOrders.length === 0 && (
              <div className="kds-empty-box">
                <CheckCircle2 size={40} />
                <p>No orders ready</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

const Ticket = ({ order, onAction, btnLabel, btnClass }) => {
  const [timeStr, setTimeStr] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const created = new Date(order.createdAt);
      const now = new Date();
      const diffMs = now - created;
      const diffMins = diffMs / 60000;
      
      setTimeStr(formatDistanceToNow(created, { addSuffix: true }));
      setProgress(Math.min((diffMins / 20) * 100, 100));
    };
    update();
    const itv = setInterval(update, 1000);
    return () => clearInterval(itv);
  }, [order.createdAt]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="kds-ticket"
    >
      <div className="kds-ticket-urgency" style={{ width: `${progress}%`, background: progress > 75 ? '#ef4444' : (progress > 50 ? '#f59e0b' : '#3b82f6') }} />
      
      <div className="kds-ticket-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="id">#{order._id.slice(-4).toUpperCase()}</div>
          {order.tableNumber && (
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
        {order.items.map((item, i) => (
          <div key={i} className="kds-item-row">
            <div className="kds-item-qty">{item.qty}</div>
            <div className="kds-item-img-wrap">
              <img src={getBgRemovedUrl(item.image)} alt={item.name} className="kds-item-img" />
            </div>
            <div className="kds-item-name">{item.name}</div>
          </div>
        ))}
        {order.note && (
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '8px', borderLeft: '3px solid #f59e0b', fontSize: '0.8rem', color: '#d4d4d8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontWeight: 700, color: '#f59e0b', fontSize: '0.65rem', textTransform: 'uppercase' }}>
              <AlertCircle size={10} /> Kitchen Note
            </div>
            {order.note}
          </div>
        )}
      </div>

      <div className="kds-ticket-footer">
        <button className={`kds-action-btn ${btnClass}`} onClick={onAction}>
          {btnLabel}
        </button>
      </div>
    </motion.div>
  );
};

export default KitchenPage;
