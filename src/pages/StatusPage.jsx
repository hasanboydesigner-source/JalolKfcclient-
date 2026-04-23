import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Icon } from '../components/Icons'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const StatusPage = () => {
  const [orders, setOrders] = useState([])

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/stats`)
      // Only show Preparing and Ready orders
      const activeOrders = res.data.recentOrders.filter(o => 
        ['Pending', 'Preparing', 'Ready'].includes(o.status)
      )
      setOrders(activeOrders)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    }
  }

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [])

  const preparingOrders = orders.filter(o => o.status === 'Preparing' || o.status === 'Pending')
  const readyOrders = orders.filter(o => o.status === 'Ready')

  return (
    <div className="status-container">
      <div className="status-grid">
        {/* Preparing Section */}
        <div className="status-column preparing">
          <div className="status-header">
            <Icon name="clock" size={48} />
            <h2>TAYYORLANMOQDA</h2>
          </div>
          <div className="status-list">
            {preparingOrders.map(order => (
              <div key={order._id} className="status-number">
                {order._id.toString().slice(-4).toUpperCase()}
              </div>
            ))}
          </div>
        </div>

        {/* Ready Section */}
        <div className="status-column ready">
          <div className="status-header">
            <Icon name="package" size={48} />
            <h2>MARHAMAT, TAYYOR!</h2>
          </div>
          <div className="status-list">
            {readyOrders.map(order => (
              <div key={order._id} className="status-number animate-pulse">
                {order._id.toString().slice(-4).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="status-footer">
        <div className="footer-content">
          <div className="brand">Jalol KFC</div>
          <div className="message">Yoqimli ishtaha!</div>
          <div className="time">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </footer>
    </div>
  )
}

export default StatusPage
