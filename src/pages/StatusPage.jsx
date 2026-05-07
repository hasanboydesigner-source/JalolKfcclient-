import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, Volume2, Info } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';

const API_URL = '/api';
const CHIME_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3';

const StatusPage = () => {
  const [orders, setOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/stats`);
      const activeOrders = res.data.recentOrders.filter(o => 
        ['Pending', 'Preparing', 'Ready'].includes(o.status)
      );
      setOrders(activeOrders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    }
  };

  const handleStatusUpdate = useCallback((updatedOrder) => {
    if (updatedOrder.status === 'Ready') {
      new Audio(CHIME_SOUND).play().catch(e => console.log('Audio blocked', e));
    }
    setOrders(prev => {
      if (['Completed', 'Cancelled'].includes(updatedOrder.status)) {
        return prev.filter(o => o._id !== updatedOrder._id);
      }
      return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
    });
  }, []);

  const handleNewOrder = useCallback((order) => {
    setOrders(prev => [order, ...prev]);
  }, []);

  useSocket(handleNewOrder, handleStatusUpdate);

  useEffect(() => {
    fetchOrders();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const preparingOrders = orders.filter(o => ['Pending', 'Preparing'].includes(o.status));
  const readyOrders = orders.filter(o => o.status === 'Ready');

  return (
    <div className="cds-container">
      <header className="cds-header">
        <div className="cds-logo">JALOL KFC</div>
        <div className="cds-clock">
          {currentTime.toLocaleTimeString('en-US', { hour12: false })}
        </div>
      </header>

      <main className="cds-grid">
        <div className="cds-panel preparing">
          <div className="panel-header">
            <Clock className="icon" size={24} />
            <h2>TAYYORLANMOQDA</h2>
            <div className="count">{preparingOrders.length}</div>
          </div>
          <div className="panel-content">
            <AnimatePresence mode="popLayout">
              {preparingOrders.map(order => (
                <motion.div
                  key={order._id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="cds-number"
                >
                  #{order._id.slice(-4).toUpperCase()}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div className="cds-panel ready">
          <div className="panel-header">
            <CheckCircle2 className="icon" size={24} />
            <h2>MARHAMAT, TAYYOR!</h2>
            <div className="count">{readyOrders.length}</div>
          </div>
          <div className="panel-content">
            <AnimatePresence mode="popLayout">
              {readyOrders.map(order => (
                <motion.div
                  key={order._id}
                  layout
                  initial={{ opacity: 0, y: 50, scale: 1.2 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="cds-number pulse"
                >
                  #{order._id.slice(-4).toUpperCase()}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <footer className="cds-footer">
        <div className="marquee">
          <span> <Info size={16} /> Buyurtmangiz tayyor bo'lganda ekranimizda raqamingiz ko'rinadi va ovozli habar beriladi. </span>
          <span> <Volume2 size={16} /> Iltimos, navbatingizni kuting. Yoqimli ishtaha! </span>
        </div>
      </footer>
    </div>
  );
};

export default StatusPage;
