import React, { useState, useEffect } from 'react'
import { Icon } from './Icons'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie, LineChart, Line } from 'recharts'
import { useLanguage } from '../context/LanguageContext'

const StatsPanel = ({ stats, loading, statsDate, setStatsDate }) => {
  const { t, language } = useLanguage()
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [statsDate]);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', fontWeight: 600, color: 'var(--pos-text-dim)' }}>{t('loading')}...</div>

  const { overall, daily, topProducts, recentOrders, weeklyTrend = [], categoryDistribution = [], peakHours = [] } = stats

  const chartData = weeklyTrend.map(item => ({
    name: new Date(item._id).toLocaleDateString(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uz-UZ', { day: '2-digit', month: 'short' }),
    revenue: item.revenue
  }));

  const peakHoursData = Array.from({ length: 24 }, (_, i) => {
    const hourData = peakHours.find(h => h._id === i)
    return {
      hour: `${i}:00`,
      count: hourData ? hourData.count : 0
    }
  })

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

  // Pagination logic
  const totalPages = Math.ceil(recentOrders.length / itemsPerPage);
  const paginatedOrders = recentOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const label = data.name || data.hour || (t(data._id) || data._id);
      const isCount = data.count !== undefined;
      
      return (
        <div style={{ background: 'var(--pos-surface)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--pos-border)', boxShadow: 'var(--shadow-lg)' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--pos-text-muted)' }}>{label}</p>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--pos-text)' }}>
            {payload[0].value.toLocaleString()} 
            <small style={{ marginLeft: '4px' }}>{isCount ? t('sold_count') : t('sum')}</small>
          </p>
        </div>
      );
    }
    return null;
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: '16px', 
        padding: '16px 20px', 
        borderTop: '1px solid var(--pos-border-subtle)' 
      }}>
        <button 
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="mini-action-btn"
          style={{ 
            width: 'auto', 
            padding: '0 12px', 
            height: '32px', 
            fontSize: '0.75rem',
            fontWeight: 700,
            opacity: currentPage === 1 ? 0.3 : 1, 
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Icon name="all" size={12} style={{ transform: 'rotate(180deg)' }} />
          {t('prev')}
        </button>
        
        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--pos-text-muted)', minWidth: '40px', textAlign: 'center' }}>
          {currentPage} / {totalPages}
        </span>

        <button 
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="mini-action-btn"
          style={{ 
            width: 'auto', 
            padding: '0 12px', 
            height: '32px', 
            fontSize: '0.75rem',
            fontWeight: 700,
            opacity: currentPage === totalPages ? 0.3 : 1, 
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {t('next')}
          <Icon name="all" size={12} />
        </button>
      </div>
    );
  };

  return (
    <section className="stats-view-inner" style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '100px' }}>
      <div className="admin-header-row" style={{ marginBottom: '24px', gap: '16px' }}>
        <div className="stats-header-info">
          <h2 className="stats-title" style={{ fontWeight: 800, margin: 0 }}>{t('stats_title')}</h2>
          <p style={{ color: 'var(--pos-text-muted)', fontSize: '0.85rem', fontWeight: 600, margin: '4px 0 0' }}>{t('stats_subtitle')}</p>
        </div>
        
        <div className="stats-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="stats-date-wrapper" style={{ height: '40px' }}>
            <Icon name="all" size={16} />
            <input 
              type="date" 
              className="stats-date-input" 
              value={statsDate}
              onChange={(e) => setStatsDate(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
          </div>
          <div className="last-update-badge" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--pos-text-muted)', background: 'var(--slate-100)', padding: '6px 12px', borderRadius: '12px' }}>
            {t('last_update').toUpperCase()}: <span style={{ color: 'var(--pos-text)' }}>{new Date().toLocaleTimeString(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

      <div className="analytics-charts-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        marginBottom: '24px'
      }}>
        {/* Weekly Revenue Trend */}
        <div className="chart-box stats-card-premium">
          <h3 className="chart-title">{t('revenue_7d')}</h3>
          <div className="chart-container-inner" style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-100)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--pos-text-muted)' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--pos-text-muted)' }} />
                <Tooltip 
                  content={<CustomTooltip />} 
                  cursor={{ fill: 'var(--pos-border-subtle)', opacity: 0.4 }}
                />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={32}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? 'var(--brand-primary)' : 'var(--slate-300)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Hours Analysis */}
        <div className="chart-box stats-card-premium">
          <h3 className="chart-title">Tig'iz vaqtlar (24s)</h3>
          <div className="chart-container-inner" style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={peakHoursData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-100)" />
                <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--pos-text-muted)' }} interval={3} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--pos-text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="count" stroke="var(--brand-primary)" strokeWidth={3} dot={{ r: 3, fill: 'var(--brand-primary)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-box stats-card-premium">
          <h3 className="chart-title">Kategoriyalar ulushi</h3>
          <div className="chart-container-inner" style={{ width: '100%', minHeight: 320 }}>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="_id"
                    stroke="none"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend-grid">
              {categoryDistribution.map((entry, index) => (
                <div key={entry._id} className="legend-item">
                  <div className="legend-dot" style={{ background: COLORS[index % COLORS.length] }}></div>
                  <span className="legend-text">{t(entry._id) || entry._id}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="metrics-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <MetricCard 
          title={statsDate === new Date().toISOString().split('T')[0] ? `${t('today')} ${t('total_sales')}` : t('total_sales')} 
          value={`${daily.total.toLocaleString()}`} 
          unit={t('sum')}
          subValue={`${daily.count} ${t('orders_count')}`}
          icon="cash"
          color="#10b981"
          gradient="linear-gradient(135deg, #10b981 0%, #059669 100%)"
        />
        <MetricCard 
          title={t('avg_check')} 
          value={`${overall.count > 0 ? Math.round(overall.total / overall.count).toLocaleString() : 0}`} 
          unit={t('sum')}
          subValue={t('all')}
          icon="chart"
          color="#6366f1"
          gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
        />
        <MetricCard 
          title={t('top_sold')} 
          value={topProducts.length > 0 ? topProducts[0]._id : t('unknown')} 
          subValue={topProducts.length > 0 ? `${topProducts[0].totalSold} ${t('sold_count')}` : t('no_sales')}
          icon="burger"
          color="#f59e0b"
          gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
        />
      </div>

      <div className="stats-bottom-grid">
        {/* Recent Orders */}
        <div className="admin-table-wrapper stats-card-premium" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header-premium">
            <span className="card-title-text">{t('recent_orders')}</span>
            <span className="count-badge">{recentOrders.length} {t('orders_count')}</span>
          </div>
          
          <div className="hidden-mobile">
            <table className="refined-table">
              <thead>
                <tr>
                  <th>{t('time') || 'Vaqt'}</th>
                  <th>{t('total') || 'Summa'}</th>
                  <th>{t('payment_method') || "To'lov"}</th>
                  <th>{t('status') || 'Holat'}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map(order => (
                  <tr key={order._id}>
                    <td>{new Date(order.createdAt).toLocaleTimeString(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="table-price">{order.total.toLocaleString()}</td>
                    <td className="table-muted">{order.paymentMethod}</td>
                    <td>
                      <span className={`status-pill ${order.status === 'Completed' ? 'success' : 'danger'}`}>
                        {order.status === 'Completed' ? t('status_completed') : order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="show-mobile" style={{ padding: '12px' }}>
            {paginatedOrders.map(order => (
              <div key={order._id} className="mobile-order-card-refined">
                <div className="card-left">
                  <span className="order-time">{new Date(order.createdAt).toLocaleTimeString(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="order-price">{order.total.toLocaleString()} <small>{t('sum')}</small></span>
                </div>
                <div className="card-right">
                  <span className="order-method">{order.paymentMethod}</span>
                  <span className={`order-status-dot ${order.status === 'Completed' ? 'success' : 'danger'}`}>
                    {order.status === 'Completed' ? t('status_completed') : order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <PaginationControls />
        </div>

        {/* Top Products */}
        <div className="admin-table-wrapper stats-card-premium">
          <div className="card-header-premium">
            <span className="card-title-text">{t('top_sold')}</span>
          </div>
          <div className="top-products-list" style={{ padding: '12px' }}>
            {topProducts.map((p, idx) => (
              <div key={p._id} className="top-product-item">
                <div className={`rank-badge ${idx === 0 ? 'top' : ''}`}>{idx + 1}</div>
                <div className="product-info">
                  <span className="product-name">{p._id}</span>
                  <span className="product-meta">{p.totalSold} {t('sold_count')}</span>
                </div>
                <div className="product-revenue">{p.revenue.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

const MetricCard = ({ title, value, unit, subValue, icon, color, gradient }) => {
  return (
    <div className="metric-card-inner stats-card-premium" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px' }}>
      <div className="metric-icon-box" style={{ 
        width: '48px', 
        height: '48px', 
        background: gradient, 
        color: 'white', 
        borderRadius: '14px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        boxShadow: `0 8px 16px -4px ${color}40`,
        flexShrink: 0
      }}>
        <Icon name={icon} size={22} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div className="metric-label-text">{title}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
          <div className="metric-value-text">{value}</div>
          {unit && <span className="metric-unit-text">{unit}</span>}
        </div>
        <div className="metric-subtext">{subValue}</div>
      </div>
    </div>
  )
}

export default StatsPanel
