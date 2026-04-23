import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { Icon } from '../components/Icons'
import { useLanguage } from '../context/LanguageContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const KitchenPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const { t } = useLanguage()

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/stats`)
      // Filter only Pending, Preparing, or Ready orders
      const activeOrders = res.data.recentOrders.filter(o => 
        ['Pending', 'Preparing', 'Ready'].includes(o.status)
      )
      setOrders(activeOrders)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch orders:', err)
    }
  }

  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

  const updateStatus = async (id, newStatus) => {
    try {
      await axios.put(`${API_URL}/orders/${id}/status`, { status: newStatus })
      fetchOrders()
    } catch (err) {
      alert('Xatolik yuz berdi')
    }
  }

  if (loading && orders.length === 0) {
    return (
      <div className="kitchen-loading">
        <div className="loader"></div>
        <p>Oshxona yuklanmoqda...</p>
      </div>
    )
  }

  const preparingOrders = orders.filter(o => o.status === 'Preparing' || o.status === 'Pending')
  const readyOrders = orders.filter(o => o.status === 'Ready')

  return (
    <div className="kitchen-container">
      <header className="kitchen-header">
        <div className="kitchen-title">
          <Icon name="pizza" size={32} />
          <h1>Oshxona Displeyi (KDS)</h1>
        </div>
        <div className="kitchen-stats">
          <div className="stat-item">
            <span className="stat-label">Tayyorlanmoqda:</span>
            <span className="stat-value">{preparingOrders.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Tayyor:</span>
            <span className="stat-value ready">{readyOrders.length}</span>
          </div>
        </div>
      </header>

      <main className="kitchen-grid">
        {/* Preparing Section */}
        <section className="kitchen-section">
          <h2 className="section-title preparing">Tayyorlanmoqda</h2>
          <div className="orders-list">
            {preparingOrders.length === 0 ? (
              <div className="empty-kitchen">Buyurtmalar yo'q</div>
            ) : (
              preparingOrders.map(order => (
                <div key={order._id} className="kitchen-order-card">
                  <div className="order-card-header">
                    <span className="order-id">#{order._id.toString().slice(-4).toUpperCase()}</span>
                    <span className="order-time">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="order-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="kitchen-item">
                        <span className="item-qty">{item.qty}x</span>
                        <span className="item-name">{item.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-card-footer">
                    <button 
                      className="btn-ready" 
                      onClick={() => updateStatus(order._id, 'Ready')}
                    >
                      <Icon name="plus" size={16} />
                      TAYYOR
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Ready Section */}
        <section className="kitchen-section">
          <h2 className="section-title ready">Tayyor</h2>
          <div className="orders-list">
            {readyOrders.length === 0 ? (
              <div className="empty-kitchen">Tayyor buyurtmalar yo'q</div>
            ) : (
              readyOrders.map(order => (
                <div key={order._id} className="kitchen-order-card ready">
                  <div className="order-card-header">
                    <span className="order-id">#{order._id.toString().slice(-4).toUpperCase()}</span>
                    <span className="order-time">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="order-items">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="kitchen-item">
                        <span className="item-qty">{item.qty}x</span>
                        <span className="item-name">{item.name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="order-card-footer">
                    <button 
                      className="btn-complete" 
                      onClick={() => updateStatus(order._id, 'Completed')}
                    >
                      TOPHIRILDI
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

export default KitchenPage
