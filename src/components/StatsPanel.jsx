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
      return (
        <div style={{ background: 'var(--pos-surface)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--pos-border)', boxShadow: 'var(--shadow-lg)' }}>
          <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--pos-text-muted)' }}>{payload[0].payload.name}</p>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: 900, color: 'var(--pos-text)' }}>{payload[0].value.toLocaleString()} <small>{t('sum')}</small></p>
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
      <div className="admin-header-row" style={{ marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 className="stats-title" style={{ fontWeight: 800 }}>{t('stats_title')}</h2>
          <p style={{ color: 'var(--pos-text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>{t('stats_subtitle')}</p>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <div className="stats-date-wrapper" style={{ height: '44px' }}>
            <Icon name="all" size={18} />
            <input 
              type="date" 
              className="stats-date-input" 
              value={statsDate}
              onChange={(e) => setStatsDate(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--pos-text-muted)', background: 'var(--slate-100)', padding: '6px 12px', borderRadius: '12px' }}>
            {t('last_update').toUpperCase()}: <span style={{ color: 'var(--pos-text)' }}>{new Date().toLocaleTimeString(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>

        <div className="analytics-charts-grid" style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* Weekly Revenue Trend */}
          <div className="chart-box" style={{ 
            background: 'var(--pos-surface)', 
            borderRadius: '20px', 
            padding: '24px', 
            border: '1px solid var(--pos-border-subtle)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '20px' }}>{t('revenue_7d')}</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-100)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--pos-text-muted)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--pos-text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" radius={[6, 6, 0, 0]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? 'var(--brand-primary)' : 'var(--slate-300)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Peak Hours Analysis */}
          <div className="chart-box" style={{ 
            background: 'var(--pos-surface)', 
            borderRadius: '20px', 
            padding: '24px', 
            border: '1px solid var(--pos-border-subtle)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '20px' }}>Tig'iz vaqtlar (24s)</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={peakHoursData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--slate-100)" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'var(--pos-text-muted)' }} interval={2} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--pos-text-muted)' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="var(--brand-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--brand-primary)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="chart-box" style={{ 
            background: 'var(--pos-surface)', 
            borderRadius: '20px', 
            padding: '24px', 
            border: '1px solid var(--pos-border-subtle)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '20px' }}>Kategoriyalar ulushi</h3>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="_id"
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginTop: '10px' }}>
                {categoryDistribution.map((entry, index) => (
                  <div key={entry._id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: COLORS[index % COLORS.length] }}></div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--pos-text-muted)' }}>{t(entry._id) || entry._id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      {/* Metrics Grid */}
      <div className="metrics-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
        gap: '12px', 
        marginBottom: '32px' 
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

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
        gap: '24px' 
      }}>
        {/* Recent Orders */}
        <div className="admin-table-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ 
            padding: '16px 24px', 
            borderBottom: '1px solid var(--pos-border-subtle)', 
            fontWeight: 800, 
            fontSize: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {t('recent_orders')}
            <span style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', background: 'var(--slate-50)', padding: '4px 10px', borderRadius: '10px' }}>{recentOrders.length} {t('orders_count')}</span>
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
                    <td style={{ fontSize: '0.85rem', fontWeight: 600 }}>{new Date(order.createdAt).toLocaleTimeString(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td style={{ fontWeight: 800, color: 'var(--pos-text)' }}>{order.total.toLocaleString()}</td>
                    <td><span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--pos-text-muted)' }}>{order.paymentMethod}</span></td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '6px', 
                        fontSize: '0.7rem', 
                        fontWeight: 800,
                        background: order.status === 'Completed' ? '#ecfdf5' : '#fef2f2',
                        color: order.status === 'Completed' ? '#065f46' : '#991b1b'
                      }}>
                        {order.status === 'Completed' ? t('status_completed') : order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="show-mobile" style={{ padding: '8px', flex: 1 }}>
            {paginatedOrders.map(order => (
              <div key={order._id} style={{ 
                padding: '12px 16px', 
                background: 'var(--pos-surface)', 
                borderRadius: '12px', 
                marginBottom: '8px',
                border: '1px solid var(--pos-border-subtle)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--pos-text-muted)', fontWeight: 600 }}>
                    {new Date(order.createdAt).toLocaleTimeString(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--pos-text)', fontSize: '1rem' }}>
                    {order.total.toLocaleString()} <small style={{ fontSize: '0.65rem' }}>{t('sum')}</small>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--pos-text-muted)', marginBottom: '4px' }}>{order.paymentMethod}</div>
                  <div style={{ 
                    fontSize: '0.65rem', 
                    fontWeight: 800,
                    color: order.status === 'Completed' ? 'var(--pos-success)' : 'var(--pos-danger)'
                  }}>
                    ● {order.status === 'Completed' ? t('status_completed') : order.status}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <PaginationControls />
        </div>

        {/* Top Products */}
        <div className="admin-table-wrapper">
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--pos-border-subtle)', fontWeight: 800, fontSize: '1rem' }}>
            {t('top_sold')}
          </div>
          <div style={{ padding: '12px' }}>
            {topProducts.map((p, idx) => (
              <div key={p._id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '12px',
                borderRadius: '12px',
                background: idx === 0 ? 'var(--slate-50)' : 'transparent',
                marginBottom: '4px'
              }}>
                <div style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '8px', 
                  background: idx === 0 ? 'var(--brand-primary)' : 'var(--slate-100)',
                  color: idx === 0 ? 'white' : 'var(--pos-text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.8rem'
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p._id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--pos-text-muted)', fontWeight: 600 }}>{p.totalSold} {t('sold_count')}</div>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--pos-text)', fontSize: '0.9rem' }}>
                  {p.revenue.toLocaleString()}
                </div>
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
    <div className="metric-card-inner" style={{ 
      background: 'var(--pos-surface)', 
      padding: '20px', 
      borderRadius: 'var(--radius-xl)', 
      border: '1px solid var(--pos-border-subtle)',
      boxShadow: 'var(--shadow-sm)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div className="metric-icon-box" style={{ 
        width: '52px', 
        height: '52px', 
        background: gradient, 
        color: 'white', 
        borderRadius: '14px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        boxShadow: `0 8px 16px -4px ${color}40`,
        flexShrink: 0
      }}>
        <Icon name={icon} size={24} />
      </div>
      <div>
        <div className="metric-label-text" style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--pos-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <div className="metric-value-text" style={{ fontSize: '1.4rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--pos-text)' }}>{value}</div>
          {unit && <span className="metric-unit-text" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--pos-text-muted)' }}>{unit}</span>}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--pos-text-dim)', fontWeight: 600 }}>{subValue}</div>
      </div>
    </div>
  )
}

export default StatsPanel
