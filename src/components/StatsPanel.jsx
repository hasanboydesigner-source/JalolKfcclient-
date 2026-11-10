import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area
} from 'recharts';
import {
  Calendar, RefreshCw, Download, Printer, ChevronLeft, ChevronRight,
  TrendingUp, Banknote, CreditCard, QrCode, Search, Eye, X,
  ShoppingBag, CheckCircle, Clock, ShieldAlert,
  Layers, ArrowUpRight, FileSpreadsheet, Percent, Receipt
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

const formatOrderNum = (num, id) => {
  if (num) {
    const clean = String(num).replace(/^#+/, '');
    return `#${clean}`;
  }
  return `#${(id || '').slice(-4).toUpperCase()}`;
};

const formatCompactNumber = (number) => {
  if (!number || isNaN(number)) return '0';
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1).replace('.0', '') + 'M';
  }
  if (number >= 1000) {
    return (number / 1000).toFixed(0) + 'k';
  }
  return number.toString();
};

const StatsPanel = ({ stats, loading: _loading, statsDate, setStatsDate, onRefresh }) => {
  const { t, language } = useLanguage();
  const { formatPrice, settings } = useSettings();

  const [activeRange, setActiveRange] = useState('today'); // 'today' | 'yesterday' | '7days' | 'month'
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showZReportModal, setShowZReportModal] = useState(false);
  const itemsPerPage = 8;

  const {
    overall = { total: 0, count: 0 },
    daily = { total: 0, count: 0 },
    cancelled = { total: 0, count: 0 },
    topProducts = [],
    recentOrders = [],
    weeklyTrend = [],
    peakHours = []
  } = stats || {};

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Quick Preset Handlers
  const handleSetToday = () => {
    setActiveRange('today');
    setStatsDate(todayStr);
    setCurrentPage(1);
  };

  const handleSetYesterday = () => {
    setActiveRange('yesterday');
    const dt = new Date();
    dt.setDate(dt.getDate() - 1);
    setStatsDate(dt.toISOString().split('T')[0]);
    setCurrentPage(1);
  };

  const handlePrevDay = () => {
    const [y, m, d] = statsDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 1);
    setStatsDate(dt.toISOString().split('T')[0]);
    setActiveRange('custom');
    setCurrentPage(1);
  };

  const handleNextDay = () => {
    if (statsDate === todayStr) return;
    const [y, m, d] = statsDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + 1);
    setStatsDate(dt.toISOString().split('T')[0]);
    setActiveRange('custom');
    setCurrentPage(1);
  };

  const handleRefreshClick = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  };

  // Payment Breakdown
  const paymentBreakdown = useMemo(() => {
    const res = {
      cash: { key: 'naqd', label: 'Naqd pul', count: 0, total: 0, icon: Banknote, color: '#10b981' },
      card: { key: 'karta', label: 'Plastik karta', count: 0, total: 0, icon: CreditCard, color: '#3b82f6' },
      qr: { key: 'qr', label: 'QR to‘lov', count: 0, total: 0, icon: QrCode, color: '#f59e0b' }
    };

    if (Array.isArray(recentOrders)) {
      recentOrders.forEach(o => {
        if (!o || o.status !== 'Completed') return;
        const method = (o.paymentMethod || '').toLowerCase();
        if (method.includes('naqd') || method.includes('cash')) {
          res.cash.count++;
          res.cash.total += (o.total || 0);
        } else if (method.includes('karta') || method.includes('card') || method.includes('humo') || method.includes('uzcard')) {
          res.card.count++;
          res.card.total += (o.total || 0);
        } else {
          res.qr.count++;
          res.qr.total += (o.total || 0);
        }
      });
    }

    const sumTotal = res.cash.total + res.card.total + res.qr.total;
    return {
      items: [
        { ...res.cash, percent: sumTotal > 0 ? Math.round((res.cash.total / sumTotal) * 100) : 0 },
        { ...res.card, percent: sumTotal > 0 ? Math.round((res.card.total / sumTotal) * 100) : 0 },
        { ...res.qr, percent: sumTotal > 0 ? Math.round((res.qr.total / sumTotal) * 100) : 0 }
      ],
      sumTotal
    };
  }, [recentOrders]);

  // Chart data
  const chartData = useMemo(() => {
    return weeklyTrend.map(item => {
      const [year, month, day] = (item._id || '').split('-').map(Number);
      const d = new Date(year, month - 1, day);
      const dateName = !isNaN(d.getTime()) 
        ? d.toLocaleDateString(language === 'ru' ? 'ru-RU' : 'uz-UZ', { day: '2-digit', month: 'short' })
        : item._id;
      return {
        dateId: item._id,
        name: dateName,
        revenue: item.revenue || 0,
        isCurrent: item._id === statsDate
      };
    });
  }, [weeklyTrend, statsDate, language]);

  // Peak hours data (00:00 to 23:00)
  const peakHoursData = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const hourData = peakHours.find(h => h._id === i);
      return {
        hour: `${i < 10 ? '0' : ''}${i}:00`,
        count: hourData ? hourData.count : 0
      };
    });
  }, [peakHours]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return recentOrders.filter(o => {
      const matchSearch = !searchQuery || 
        (o.orderNumber && o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (o._id && o._id.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchSearch) return false;

      if (paymentFilter === 'all') return true;
      const method = (o.paymentMethod || '').toLowerCase();
      if (paymentFilter === 'naqd') return method.includes('naqd') || method.includes('cash');
      if (paymentFilter === 'karta') return method.includes('karta') || method.includes('card');
      if (paymentFilter === 'qr') return method.includes('qr') || method.includes('click') || method.includes('payme');
      return true;
    });
  }, [recentOrders, searchQuery, paymentFilter]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
  const paginatedOrders = useMemo(() => {
    return filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const avgCheck = daily?.count > 0 ? Math.round(daily.total / daily.count) : 0;

  // Export CSV Handler
  const handleExportCSV = () => {
    if (!recentOrders || recentOrders.length === 0) {
      alert("Eksport qilish uchun buyurtmalar topilmadi");
      return;
    }

    const headers = ["Buyurtma #", "Sana", "Vaqt", "Turi", "To'lov turi", "Mahsulotlar soni", "Jami (so'm)", "Holat"];
    const rows = recentOrders.map(o => [
      o.orderNumber || o._id,
      new Date(o.createdAt).toLocaleDateString(),
      new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      o.orderType || 'Zalda',
      o.paymentMethod || 'Naqd',
      (o.items || []).reduce((sum, item) => sum + (item.qty || 1), 0),
      o.total,
      o.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF"
      + [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `hisobot_kfc_${statsDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const businessName = settings.business?.name || 'JALOL KFC';

  return (
    <div className="reports-container">
      {/* ===================================================================
          1. TOP COMMAND BAR & DATE SELECTOR
          =================================================================== */}
      <header className="reports-command-bar">
        <div className="reports-title-group">
          <h1 className="reports-main-title">{t('stats_title') || 'Statistika va Hisobotlar'}</h1>
          <p className="reports-sub-caption">
            Tanlangan sana: <strong>{statsDate}</strong> {statsDate === todayStr ? '(Bugun)' : ''}
          </p>
        </div>

        <div className="reports-controls-right">
          {/* Quick presets */}
          <div className="reports-range-pills">
            <button
              type="button"
              className={`range-pill-btn ${activeRange === 'today' ? 'active' : ''}`}
              onClick={handleSetToday}
            >
              Bugun
            </button>
            <button
              type="button"
              className={`range-pill-btn ${activeRange === 'yesterday' ? 'active' : ''}`}
              onClick={handleSetYesterday}
            >
              Kecha
            </button>
          </div>

          {/* Stepper Date Picker */}
          <div className="reports-date-stepper">
            <button
              type="button"
              className="reports-step-btn"
              onClick={handlePrevDay}
              title="Oldingi kun"
            >
              <ChevronLeft size={14} />
            </button>
            <input 
              type="date"
              value={statsDate}
              onChange={(e) => {
                if (e.target.value) {
                  setStatsDate(e.target.value);
                  setActiveRange('custom');
                  setCurrentPage(1);
                }
              }}
              className="reports-date-input"
            />
            <button
              type="button"
              className="reports-step-btn"
              onClick={handleNextDay}
              disabled={statsDate === todayStr}
              title="Keyingi kun"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Z-Report Modal Trigger */}
          <button
            type="button"
            className="reports-action-btn btn-zreport"
            onClick={() => setShowZReportModal(true)}
            title="Smena yopish Z-Hisoboti"
          >
            <Printer size={14} />
            <span>Z-Hisobot</span>
          </button>

          {/* CSV Export */}
          <button
            type="button"
            className="reports-action-btn"
            onClick={handleExportCSV}
            title="Excel / CSV yuklab olish"
          >
            <Download size={14} />
            <span>Eksport</span>
          </button>

          {/* Refresh */}
          <button
            type="button"
            className="reports-action-btn icon-only"
            onClick={handleRefreshClick}
            title="Yangilash"
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
          </button>
        </div>
      </header>

      {/* ===================================================================
          2. EXECUTIVE KPI METRICS (4 CARDS)
          =================================================================== */}
      <section className="reports-kpi-grid">
        {/* Gross Revenue */}
        <div className="kpi-card-panel">
          <div className="kpi-head-row">
            <span className="kpi-title-text">Kunlik tushum</span>
            <div className="kpi-icon-bubble emerald">
              <TrendingUp size={15} />
            </div>
          </div>
          <div className="kpi-main-metric">
            {formatPrice(daily.total)}
          </div>
          <div className="kpi-sub-foot">
            <span>Jami daromaddan: {formatPrice(overall.total)}</span>
          </div>
        </div>

        {/* Orders Count */}
        <div className="kpi-card-panel">
          <div className="kpi-head-row">
            <span className="kpi-title-text">Buyurtmalar soni</span>
            <div className="kpi-icon-bubble blue">
              <ShoppingBag size={15} />
            </div>
          </div>
          <div className="kpi-main-metric">
            {daily.count} ta
          </div>
          <div className="kpi-sub-foot">
            <span>Bajarilgan cheklar hajmi</span>
          </div>
        </div>

        {/* Average Check */}
        <div className="kpi-card-panel">
          <div className="kpi-head-row">
            <span className="kpi-title-text">O‘rtacha chek</span>
            <div className="kpi-icon-bubble amber">
              <Banknote size={15} />
            </div>
          </div>
          <div className="kpi-main-metric">
            {formatPrice(avgCheck)}
          </div>
          <div className="kpi-sub-foot">
            <span>Har bir xaridorga to‘g‘ri kelgan</span>
          </div>
        </div>

        {/* Cancellations / Fraud Audit */}
        <div className="kpi-card-panel">
          <div className="kpi-head-row">
            <span className="kpi-title-text">Bekor qilinganlar</span>
            <div className="kpi-icon-bubble rose">
              <ShieldAlert size={15} />
            </div>
          </div>
          <div className="kpi-main-metric" style={{ color: cancelled.count > 0 ? '#ef4444' : undefined }}>
            {cancelled.count} ta
          </div>
          <div className="kpi-sub-foot">
            <span>Zarar: {formatPrice(cancelled.total || 0)}</span>
          </div>
        </div>
      </section>

      {/* ===================================================================
          3. 2-COLUMN LAYOUT: CHARTS & PAYMENT RECONCILIATION
          =================================================================== */}
      <div className="reports-layout-grid">
        {/* Left Column: Weekly Trend & Peak Hours */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Weekly Revenue Trend */}
          <div className="reports-panel-card">
            <div className="panel-card-header">
              <div>
                <h3 className="panel-card-title">Haftalik Savdo Dinamikasi</h3>
                <span className="panel-card-caption">Oxirgi 7 kunlik daromad grafigi</span>
              </div>
            </div>

            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tickFormatter={formatCompactNumber} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip 
                    formatter={(val) => [formatPrice(val), 'Savdo']}
                    contentStyle={{ borderRadius: '8px', background: '#0f172a', color: '#fff', border: 'none', fontSize: '0.8rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Peak Hours Rush Bar Chart */}
          <div className="reports-panel-card">
            <div className="panel-card-header">
              <div>
                <h3 className="panel-card-title">Soatlik Buyurtmalar Taqsimoti (Peak Hours)</h3>
                <span className="panel-card-caption">Kun davomida mijozlar eng ko‘p kelgan vaqtlar</span>
              </div>
            </div>

            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHoursData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={2} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip 
                    formatter={(val) => [`${val} ta buyurtma`, 'Buyurtmalar']}
                    contentStyle={{ borderRadius: '10px', background: '#1e293b', color: '#fff', border: 'none' }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Balance & Bestsellers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Payment Method Balance */}
          <div className="reports-panel-card">
            <div className="panel-card-header">
              <div>
                <h3 className="panel-card-title">To‘lovlar Balansi (Kassa Inkassatsiyasi)</h3>
                <span className="panel-card-caption">Naqd pul va elektron to‘lovlar nisbati</span>
              </div>
            </div>

            <div className="payment-balance-list">
              {paymentBreakdown.items.map((m, idx) => {
                const IconComp = m.icon;
                const isFilterActive = paymentFilter === m.key;
                return (
                  <div 
                    key={idx} 
                    className={`payment-row-card ${isFilterActive ? 'active-filter' : ''}`}
                    onClick={() => {
                      setPaymentFilter(prev => prev === m.key ? 'all' : m.key);
                      setCurrentPage(1);
                    }}
                    title={`${m.label} bo‘yicha filtrlash`}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="payment-row-left">
                      <div className="kpi-icon-bubble" style={{ background: `${m.color}20`, color: m.color }}>
                        <IconComp size={18} />
                      </div>
                      <div>
                        <div className="payment-method-name">{m.label}</div>
                        <div className="payment-method-count">{m.count} ta chek</div>
                      </div>
                    </div>

                    <div className="payment-row-right">
                      <div className="payment-method-total">{formatPrice(m.total)}</div>
                      <span className="payment-method-percent">{m.percent}% ulush</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="reports-panel-card">
            <div className="panel-card-header">
              <div>
                <h3 className="panel-card-title">Eng Ko‘p Sotilgan Mahsulotlar</h3>
                <span className="panel-card-caption">Top-10 xaridorgir taomlar</span>
              </div>
            </div>

            {topProducts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Ma’lumot mavjud emas</div>
            ) : (
              <table className="top-products-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nomi</th>
                    <th>Soni</th>
                    <th style={{ textAlign: 'right' }}>Summa</th>
                  </tr>
                </thead>
                <tbody>
                  {topProducts.slice(0, 6).map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className={`rank-badge top-${idx + 1}`}>{idx + 1}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{item._id}</td>
                      <td>{item.totalSold} dona</td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>{formatPrice(item.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* ===================================================================
          4. RECENT ORDERS TABLE
          =================================================================== */}
      <section className="reports-panel-card">
        <div className="panel-card-header">
          <div>
            <h3 className="panel-card-title">Buyurtmalar Ro‘yxati (So‘nggi Tranzaksiyalar)</h3>
            <span className="panel-card-caption">Jami {filteredOrders.length} ta buyurtma qayd etilgan</span>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text"
              placeholder="Qidiruv (#raqam yoki ID)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid var(--pos-border, #cbd5e1)',
                background: 'var(--pos-surface, #fff)',
                color: 'inherit',
                fontSize: '0.8rem'
              }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="top-products-table">
            <thead>
              <tr>
                <th>Chek #</th>
                <th>Vaqt</th>
                <th>Turi</th>
                <th>To‘lov</th>
                <th>Mahsulotlar</th>
                <th>Jami Summa</th>
                <th>Holat</th>
                <th style={{ textAlign: 'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map(order => {
                const orderNumStr = formatOrderNum(order.orderNumber, order._id);
                const isCompleted = order.status === 'Completed';
                const isCancelled = order.status === 'Cancelled';
                return (
                  <tr key={order._id}>
                    <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{orderNumStr}</td>
                    <td>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td>
                      {order.orderType === 'in_hall' || order.orderType === 'Zalda'
                        ? `Zalda ${order.tableNumber ? `(#${order.tableNumber})` : ''}`
                        : order.orderType === 'takeaway' || order.orderType === 'Olib ketish'
                          ? 'Olib ketish'
                          : (order.orderType || 'Zalda')}
                    </td>
                    <td>{order.paymentMethod || 'Naqd'}</td>
                    <td>{(order.items || []).reduce((sum, item) => sum + (item.qty || 1), 0)} ta</td>
                    <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatPrice(order.total)}</td>
                    <td>
                      <span className={`status-pill ${isCompleted ? 'success' : isCancelled ? 'danger' : 'warning'}`}>
                        {isCompleted ? 'Bajarildi' : isCancelled ? 'Bekor qilingan' : order.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="reports-action-btn icon-only"
                        onClick={() => setSelectedOrder(order)}
                        title="Buyurtma tafsilotini ko‘rish"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '16px' }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Sahifa {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              className="reports-action-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            >
              Oldingi
            </button>
            <button
              type="button"
              className="reports-action-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            >
              Keyingi
            </button>
          </div>
        )}
      </section>

      {/* ===================================================================
          5. Z-REPORT (DAILY SHIFT SUMMARY) THERMAL MODAL
          =================================================================== */}
      {showZReportModal && (
        <div className="pos-modal-backdrop" onClick={() => setShowZReportModal(false)}>
          <div className="zreport-modal-content" onClick={e => e.stopPropagation()}>
            <div className="zreport-paper">
              <div className="zreport-header">
                <h2 className="zreport-brand">{businessName}</h2>
                <div className="zreport-title">*** KUNLIK Z-HISOBOT ***</div>
                <div style={{ fontSize: '0.75rem' }}>Sana: {statsDate} | Vaqt: {new Date().toLocaleTimeString()}</div>
                <div style={{ fontSize: '0.75rem' }}>Kassa #1 • Terminal ID: POS-01</div>
              </div>

              <div style={{ margin: '12px 0' }}>
                <div className="zreport-row">
                  <span>Boshlang'ich kassa:</span>
                  <span>0 so'm</span>
                </div>
                <div className="zreport-row">
                  <span>Jami buyurtmalar:</span>
                  <span>{daily.count} ta</span>
                </div>
                <div className="zreport-row">
                  <span>Bekor qilinganlar:</span>
                  <span>{cancelled.count} ta</span>
                </div>
              </div>

              <div style={{ borderTop: '1px dashed #000', paddingTop: '8px', margin: '8px 0' }}>
                <div style={{ fontWeight: 800, fontSize: '0.85rem', marginBottom: '6px' }}>TO'LOV USULLARI:</div>
                {paymentBreakdown.items.map((m, idx) => (
                  <div key={idx} className="zreport-row">
                    <span>{m.label} ({m.count}):</span>
                    <span>{formatPrice(m.total)}</span>
                  </div>
                ))}
              </div>

              <div className="zreport-total-row">
                <div className="zreport-row">
                  <span>SOF TUSHUM (INKASSATSIYA):</span>
                  <span>{formatPrice(daily.total)}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.75rem', marginTop: '16px' }}>
                <div>SMENA MUVOFAQQIYATLI YOPILDI</div>
                <div>Kassir imzosi: ______________</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="btn-bump"
                style={{ flex: 1, height: '40px', borderRadius: '8px' }}
                onClick={() => window.print()}
              >
                <Printer size={15} /> Chekni chop etish
              </button>
              <button
                type="button"
                className="pos-action-btn-secondary"
                style={{ height: '40px', padding: '0 20px', borderRadius: '8px' }}
                onClick={() => setShowZReportModal(false)}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          6. ORDER DETAIL MODAL (TRANSACTION INSPECTOR)
          =================================================================== */}
      {selectedOrder && (
        <div className="pos-modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="pos-modal-card order-detail-modal-card" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="pos-modal-head">
              <div className="pos-modal-title-group">
                <div className="order-detail-icon-box">
                  <Receipt size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 className="pos-modal-title">
                      Buyurtma {formatOrderNum(selectedOrder.orderNumber, selectedOrder._id)}
                    </h3>
                    <span className={`status-pill ${selectedOrder.status === 'Completed' ? 'success' : selectedOrder.status === 'Cancelled' ? 'danger' : 'warning'}`}>
                      {selectedOrder.status === 'Completed' ? 'Bajarildi' : selectedOrder.status === 'Cancelled' ? 'Bekor qilingan' : selectedOrder.status}
                    </span>
                  </div>
                  <p className="pos-modal-subtitle">
                    {new Date(selectedOrder.createdAt).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })} • {new Date(selectedOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="pos-action-btn-secondary"
                style={{ width: '34px', height: '34px', padding: 0 }}
                onClick={() => setSelectedOrder(null)}
                aria-label="Yopish"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="order-detail-modal-body">
              {/* Meta Grid */}
              <div className="order-meta-grid">
                <div className="order-meta-card">
                  <span className="order-meta-label">Xizmat turi</span>
                  <span className="order-meta-val">
                    {selectedOrder.orderType === 'in_hall' || selectedOrder.orderType === 'Zalda'
                      ? `Zalda ${selectedOrder.tableNumber ? `(Stol #${selectedOrder.tableNumber})` : ''}`
                      : selectedOrder.orderType === 'takeaway' || selectedOrder.orderType === 'Olib ketish'
                        ? 'Olib ketish (Takeaway)'
                        : (selectedOrder.orderType || 'Zalda')}
                  </span>
                </div>

                <div className="order-meta-card">
                  <span className="order-meta-label">To‘lov usuli</span>
                  <span className="order-meta-val">
                    {selectedOrder.paymentMethod || 'Naqd'}
                  </span>
                </div>

                <div className="order-meta-card">
                  <span className="order-meta-label">Kassir / Xodim</span>
                  <span className="order-meta-val">
                    {selectedOrder.user?.name || selectedOrder.cashierName || 'Administrator'}
                  </span>
                </div>

                <div className="order-meta-card">
                  <span className="order-meta-label">Jami mahsulotlar</span>
                  <span className="order-meta-val">
                    {(selectedOrder.items || []).reduce((sum, item) => sum + (item.qty || 1), 0)} ta taom
                  </span>
                </div>
              </div>

              {/* Items List Table */}
              <div className="order-items-wrapper">
                <div className="order-items-header-title">Buyurtma tarkibi</div>
                <table className="order-items-table">
                  <thead>
                    <tr>
                      <th style={{ width: '36px' }}>#</th>
                      <th>Mahsulot</th>
                      <th style={{ textAlign: 'center', width: '60px' }}>Soni</th>
                      <th style={{ textAlign: 'right', width: '110px' }}>Narxi</th>
                      <th style={{ textAlign: 'right', width: '120px' }}>Jami</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedOrder.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="item-idx">{idx + 1}</td>
                        <td>
                          <span className="item-title">{item.name}</span>
                          {item.selectedVariant && (
                            <span className="item-variant">{item.selectedVariant}</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{item.qty}×</td>
                        <td style={{ textAlign: 'right', color: 'var(--pos-text-muted, #64748b)' }}>{formatPrice(item.price)}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                          {formatPrice((item.price || 0) * (item.qty || 1))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Breakdown */}
              <div className="order-totals-box">
                <div className="order-totals-row">
                  <span>Oraliq summa:</span>
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPrice(selectedOrder.subtotal || selectedOrder.total)}</span>
                </div>
                {selectedOrder.tax > 0 && (
                  <div className="order-totals-row">
                    <span>QQS (5%):</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatPrice(selectedOrder.tax)}</span>
                  </div>
                )}
                {selectedOrder.discount > 0 && (
                  <div className="order-totals-row discount">
                    <span>Aksiya / Chegirma:</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>-{formatPrice(selectedOrder.discount)}</span>
                  </div>
                )}
                <div className="order-totals-grand">
                  <span>Jami to‘lov summasi:</span>
                  <span className="grand-val">{formatPrice(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            {/* Modal Foot */}
            <div className="pos-modal-foot" style={{ justifyContent: 'space-between' }}>
              <button
                type="button"
                className="pos-action-btn-secondary"
                style={{ height: '38px', padding: '0 16px', gap: '6px' }}
                onClick={() => window.print()}
                title="Chekni chop etish"
              >
                <Printer size={15} />
                <span>Chekni chop etish</span>
              </button>

              <button
                type="button"
                className="pos-action-btn-primary"
                style={{ width: 'auto', padding: '0 24px', height: '38px' }}
                onClick={() => setSelectedOrder(null)}
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsPanel;