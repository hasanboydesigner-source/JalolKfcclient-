import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2 } from 'lucide-react';
import { useSocket } from '../hooks/useSocket';
import { useSettings } from '../context/SettingsContext';

const StatusPage = () => {
  const { settings } = useSettings();
  const [orders, setOrders] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  const chimeSound = settings.statusScreen?.chimeSoundUrl || 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3';
  const businessName = settings.business?.name || 'RESTORAN';

  const handleStatusUpdate = useCallback((updatedOrder) => {
    if (updatedOrder.status === 'Ready' && settings.statusScreen?.chimeSoundEnabled !== false) {
      new Audio(chimeSound).play().catch(e => console.log('Audio blocked', e));
    }
    setOrders(prev => {
      if (['Completed', 'Cancelled'].includes(updatedOrder.status)) {
        return prev.filter(o => o._id !== updatedOrder._id);
      }
      const exists = prev.some(o => o._id === updatedOrder._id);
      if (exists) {
        return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
      }
      return [updatedOrder, ...prev];
    });
  }, [chimeSound, settings]);

  const handleNewOrder = useCallback((order) => {
    setOrders(prev => [order, ...prev]);
  }, []);

  useSocket(handleNewOrder, handleStatusUpdate);

  useEffect(() => {
    let isMounted = true;
    axios.get('/api/orders?status=Pending,Preparing,Ready')
      .then(res => {
        if (isMounted) {
          setOrders(res.data || []);
        }
      })
      .catch(err => {
        console.error('Failed to fetch orders for status screen:', err);
      });

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const preparingOrders = orders.filter(o => ['Pending', 'Preparing'].includes(o.status));
  const readyOrders = orders.filter(o => o.status === 'Ready');

  return (
    <div className="cds-container">
      <header className="cds-header">
        <div className="cds-logo">{businessName}</div>
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
                  {order.orderNumber || `#${order._id.slice(-4).toUpperCase()}`}
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
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="cds-number pulse"
                >
                  {order.orderNumber || `#${order._id.slice(-4).toUpperCase()}`}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StatusPage;
