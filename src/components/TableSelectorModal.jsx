import React, { useState, useMemo } from 'react'
import { 
  X, 
  Armchair, 
  Users, 
  Search, 
  Plus, 
  Clock, 
  Receipt, 
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import { useSettings } from '../context/SettingsContext'

// Fallback default tables in case database is loading
const FALLBACK_DEFAULT_TABLES = Array.from({ length: 20 }, (_, i) => {
  const num = i + 1
  let zone = 'Asosiy zal'
  let capacity = 4
  if (num > 16) {
    zone = 'VIP'
    capacity = 8
  } else if (num > 12) {
    zone = 'Terrasa'
    capacity = 4
  }
  return {
    _id: `fallback-${num}`,
    tableNumber: String(num).padStart(2, '0'),
    name: `Stol ${num}`,
    zone,
    capacity,
    status: 'FREE',
    currentTotal: 0
  }
})

const TableSelectorModal = ({
  isOpen,
  onClose,
  tables = [],
  selectedTable = null,
  onSelectTable,
  onOpenTableDetail,
  onAddTable,
  isAdmin = false
}) => {
  const { formatPrice } = useSettings()
  const [activeZone, setActiveZone] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [now] = useState(() => Date.now())
  const [newTableData, setNewTableData] = useState({
    tableNumber: '',
    name: '',
    zone: 'Asosiy zal',
    capacity: 4
  })

  // Ensure tables is never empty for user display
  const effectiveTables = useMemo(() => {
    if (tables && tables.length > 0) return tables
    return FALLBACK_DEFAULT_TABLES
  }, [tables])

  // Extract unique zones
  const zones = useMemo(() => {
    const set = new Set(['all'])
    effectiveTables.forEach(t => {
      if (t.zone) set.add(t.zone)
    })
    return Array.from(set)
  }, [effectiveTables])

  // Filtered tables
  const filteredTables = useMemo(() => {
    return effectiveTables.filter(t => {
      const matchesZone = activeZone === 'all' || t.zone === activeZone
      const matchesSearch = !searchQuery || 
        String(t.tableNumber).toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesZone && matchesSearch
    })
  }, [effectiveTables, activeZone, searchQuery])

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = effectiveTables.length
    const free = effectiveTables.filter(t => t.status === 'FREE').length
    const occupied = effectiveTables.filter(t => t.status === 'OCCUPIED').length
    const bill = effectiveTables.filter(t => t.status === 'BILL_PRINTED').length
    return { total, free, occupied, bill }
  }, [effectiveTables])

  if (!isOpen) return null

  const handleTableClick = (table) => {
    if (table.status === 'OCCUPIED' || table.status === 'BILL_PRINTED') {
      if (onOpenTableDetail) {
        onOpenTableDetail(table)
      } else {
        onSelectTable(table)
        onClose()
      }
    } else {
      // Free table
      onSelectTable(table)
      onClose()
    }
  }

  const handleSaveNewTable = async (e) => {
    e.preventDefault()
    if (!newTableData.tableNumber) return
    if (onAddTable) {
      await onAddTable(newTableData)
      setShowAddModal(false)
      setNewTableData({ tableNumber: '', name: '', zone: 'Asosiy zal', capacity: 4 })
    }
  }

  return (
    <>
      <div className="pos-modal-backdrop" onClick={onClose}>
        <div 
          className="pos-modal-card" 
          style={{ maxWidth: '980px', maxHeight: '92vh' }} 
          onClick={e => e.stopPropagation()}
        >
        {/* Modal Head */}
        <div className="pos-modal-head" style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 className="pos-modal-title" style={{ fontSize: '1.15rem', fontWeight: 700 }}>Zal va Stollar Xaritasi</h3>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>
              Buyurtma berish uchun stolni tanlang yoki faol hisobni boshqaring
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isAdmin && onAddTable && (
              <button
                type="button"
                className="fp-action-btn"
                style={{ height: '34px', padding: '0 12px', fontSize: '0.8rem' }}
                onClick={() => setShowAddModal(true)}
              >
                <Plus size={14} />
                <span>Stol qo‘shish</span>
              </button>
            )}

            <button 
              type="button" 
              className="fp-action-btn" 
              style={{ width: '34px', height: '34px', padding: 0 }} 
              onClick={onClose}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="pos-modal-content">
          {/* Controls Bar: Zones Segmented Tabs & Search */}
          <div className="floor-plan-controls" style={{ marginBottom: '12px' }}>
            <div className="segmented-zone-tabs">
              {zones.map(z => (
                <button
                  key={z}
                  type="button"
                  className={`zone-tab-pill ${activeZone === z ? 'active' : ''}`}
                  onClick={() => setActiveZone(z)}
                >
                  {z === 'all' ? 'Barcha zallar' : z}
                </button>
              ))}
            </div>

            <div className="floor-plan-search-box" style={{ width: '220px' }}>
              <Search 
                size={14} 
                style={{ 
                  position: 'absolute', 
                  left: '11px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  color: '#94a3b8',
                  pointerEvents: 'none'
                }} 
              />
              <input
                type="text"
                className="floor-plan-search-input"
                placeholder="Stol raqami bo‘yicha..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Metrics Strip */}
          <div className="table-status-metrics-strip" style={{ marginBottom: '14px' }}>
            <div className="metric-stat-card all">
              <span className="metric-stat-dot all" />
              <div className="metric-stat-content">
                <span className="metric-stat-label">Jami</span>
                <span className="metric-stat-value">{metrics.total} ta</span>
              </div>
            </div>

            <div className="metric-stat-card free">
              <span className="metric-stat-dot free" />
              <div className="metric-stat-content">
                <span className="metric-stat-label">Bo‘sh stollar</span>
                <span className="metric-stat-value val-free">{metrics.free} ta</span>
              </div>
            </div>

            <div className="metric-stat-card occupied">
              <span className="metric-stat-dot occupied" />
              <div className="metric-stat-content">
                <span className="metric-stat-label">Band stollar</span>
                <span className="metric-stat-value val-occupied">{metrics.occupied} ta</span>
              </div>
            </div>

            {metrics.bill > 0 && (
              <div className="metric-stat-card bill">
                <span className="metric-stat-dot bill" />
                <div className="metric-stat-content">
                  <span className="metric-stat-label">Pre-chek</span>
                  <span className="metric-stat-value val-bill">{metrics.bill} ta</span>
                </div>
              </div>
            )}
          </div>

          {/* Tables Grid */}
        <div className="floor-tables-grid">
          {filteredTables.map(table => {
            const isOccupied = table.status === 'OCCUPIED'
            const isBill     = table.status === 'BILL_PRINTED'
            const isFree     = table.status === 'FREE'
            const isSelected = selectedTable && String(selectedTable._id) === String(table._id)
            const statusClass = isOccupied ? 'state-occupied' : isBill ? 'state-bill' : 'state-free'
            const elapsedMins = table.openedAt
              ? Math.max(1, Math.round((now - new Date(table.openedAt).getTime()) / 60000))
              : null

            const rawOrderNum = String(table.currentOrderNumber || '').replace(/^#+/, '')
            const orderLabel  = rawOrderNum ? `#${rawOrderNum}` : null

            return (
              <div
                key={table._id || table.tableNumber}
                className={`ptc ${statusClass} ${isSelected ? 'state-selected' : ''}`}
                onClick={() => handleTableClick(table)}
              >
                {/* Row 1: number + status pill */}
                <div className="ptc-head">
                  <span className="ptc-num">#{table.tableNumber}</span>
                  <span className={`ptc-pill ${statusClass}`}>
                    <span className={`ptc-dot ${statusClass}`} />
                    {isFree ? "Bo'sh" : isBill ? 'Pre-chek' : (orderLabel || 'Band')}
                  </span>
                </div>

                {/* Row 2: zone · capacity */}
                <div className="ptc-meta">
                  {table.zone || 'Asosiy zal'} &middot; {table.capacity || 4} kishi
                </div>

                {/* Row 3: price or empty label */}
                <div className="ptc-body">
                  {isFree ? (
                    <span className="ptc-empty-label">Tanlash uchun bosing</span>
                  ) : (
                    <>
                      <div className="ptc-price">{formatPrice(table.currentTotal || 0)}</div>
                      <div className="ptc-details">
                        {table.itemCount || 0} taom
                        {elapsedMins ? ` · ${elapsedMins}m` : ''}
                      </div>
                    </>
                  )}
                </div>

                {/* Row 4: actions */}
                <div className="ptc-foot">
                  {isFree ? (
                    <div className="ptc-free-btn">Stolni tanlash</div>
                  ) : (
                    <button
                      type="button"
                      className="ptc-settle-btn"
                      style={{ width: '100%' }}
                      onClick={e => {
                        e.stopPropagation()
                        handleTableClick(table)
                      }}
                    >
                      <Receipt size={13} />
                      <span>Boshqarish</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
        {/* Modal Foot */}
        <div className="pos-modal-foot">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b' }}>
            <Sparkles size={14} color="#f59e0b" />
            <span>Yashil — <b>Bo‘sh</b>, Qizil — <b>Band buyurtmalar</b></span>
          </div>

          <button 
            type="button" 
            className="pos-action-btn-secondary" 
            style={{ height: '36px', padding: '0 18px' }} 
            onClick={onClose}
          >
            Yopish
          </button>
        </div>
      </div>
    </div>

    {/* Add Table Floating Dialog */}
    {showAddModal && (
      <div className="pos-modal-backdrop" onClick={() => setShowAddModal(false)} style={{ zIndex: 1400 }}>
        <div className="pos-modal-card" style={{ maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
          <div className="pos-modal-head">
            <h3 className="pos-modal-title" style={{ fontSize: '1.15rem' }}>Yangi stol qo‘shish</h3>
            <button 
              type="button" 
              className="pos-action-btn-secondary" 
              style={{ width: '34px', height: '34px', padding: 0 }}
              onClick={() => setShowAddModal(false)}
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSaveNewTable}>
            <div className="pos-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="pos-modal-label">
                  Stol raqami *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 21 yoki VIP-2"
                  value={newTableData.tableNumber}
                  onChange={e => setNewTableData({ ...newTableData, tableNumber: e.target.value })}
                  className="pos-modal-input"
                />
              </div>
              <div>
                <label className="pos-modal-label">
                  Zal / Hudud
                </label>
                <input
                  type="text"
                  placeholder="Asosiy zal, Terrasa, VIP"
                  value={newTableData.zone}
                  onChange={e => setNewTableData({ ...newTableData, zone: e.target.value })}
                  className="pos-modal-input"
                />
              </div>
              <div>
                <label className="pos-modal-label">
                  Sig‘imi (kishi)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newTableData.capacity}
                  onChange={e => setNewTableData({ ...newTableData, capacity: Number(e.target.value) })}
                  className="pos-modal-input"
                />
              </div>
            </div>
            <div className="pos-modal-foot" style={{ justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                className="pos-action-btn-secondary" 
                style={{ height: '40px', padding: '0 16px' }}
                onClick={() => setShowAddModal(false)}
              >
                Bekor qilish
              </button>
              <button 
                type="submit" 
                className="pos-action-btn-primary" 
                style={{ width: 'auto', padding: '0 24px', height: '40px' }}
              >
                Saqlash
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </>
  )
}

export default TableSelectorModal
