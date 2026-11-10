import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Search, 
  Plus, 
  Clock, 
  Check, 
  Receipt, 
  RefreshCw,
  X,
  Armchair
} from 'lucide-react'
import { useSettings } from '../context/SettingsContext'

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

const TablesPage = ({
  tables = [],
  onSelectTableForOrder,
  onOpenTableDetail,
  onAddTable,
  onRefreshTables,
  isAdmin = false
}) => {
  const navigate = useNavigate()
  const { formatPrice } = useSettings()
  const [activeZone, setActiveZone] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [now] = useState(() => Date.now())
  const [newTable, setNewTable] = useState({
    tableNumber: '',
    name: '',
    zone: 'Asosiy zal',
    capacity: 4
  })

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

  const handleTableClick = (table) => {
    if (table.status === 'OCCUPIED' || table.status === 'BILL_PRINTED') {
      if (onOpenTableDetail) {
        onOpenTableDetail(table)
      }
    } else {
      // Free table: select table and jump to POS to take order
      if (onSelectTableForOrder) {
        onSelectTableForOrder(table)
      }
      navigate('/')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!newTable.tableNumber) return
    if (onAddTable) {
      await onAddTable(newTable)
      setShowAddModal(false)
      setNewTable({ tableNumber: '', name: '', zone: 'Asosiy zal', capacity: 4 })
    }
  }

  return (
    <div className="floor-plan-container" style={{ padding: '0 0 24px 0', maxWidth: '1440px', margin: '0 auto' }}>
      {/* Page Header */}
      <div className="floor-plan-header">
        <div>
          <h1 className="floor-plan-main-title">Zal va Stollar</h1>
          <p className="floor-plan-sub-title">Real-vaqtda stollar holatini boshqarish va buyurtma olish</p>
        </div>

        <div className="floor-plan-actions">
          {onRefreshTables && (
            <button
              type="button"
              className="fp-action-btn"
              onClick={onRefreshTables}
              title="Stollar holatini yangilash"
            >
              <RefreshCw size={14} />
              <span>Yangilash</span>
            </button>
          )}

          {isAdmin && onAddTable && (
            <button
              type="button"
              className="fp-action-btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={15} />
              <span>Yangi stol qo‘shish</span>
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="table-status-metrics-strip">
        <div className="metric-stat-card all">
          <span className="metric-stat-dot all" />
          <div className="metric-stat-content">
            <span className="metric-stat-label">Jami stollar</span>
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
            <span className="metric-stat-label">Band buyurtmalar</span>
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

      {/* Controls: Segmented Zones & Search */}
      <div className="floor-plan-controls">
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

        <div className="floor-plan-search-box">
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
            placeholder="Stol raqami bo‘yicha qidiruv..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Tables Grid */}
      <div className="floor-tables-grid">
        {filteredTables.map(table => {
          const isOccupied = table.status === 'OCCUPIED'
          const isBill     = table.status === 'BILL_PRINTED'
          const isFree     = table.status === 'FREE'
          const statusClass = isOccupied ? 'state-occupied' : isBill ? 'state-bill' : 'state-free'
          const elapsedMins = table.openedAt
            ? Math.max(1, Math.round((now - new Date(table.openedAt).getTime()) / 60000))
            : null

          // Normalize order number — always exactly one #
          const rawOrderNum = String(table.currentOrderNumber || '').replace(/^#+/, '')
          const orderLabel  = rawOrderNum ? `#${rawOrderNum}` : null

          return (
            <div
              key={table._id || table.tableNumber}
              className={`ptc ${statusClass}`}
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
                  <span className="ptc-empty-label">Bo'sh</span>
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
                  <div className="ptc-free-btn">Buyurtma olish</div>
                ) : (
                  <div className="ptc-btn-row">
                    <button
                      type="button"
                      className="ptc-add-btn"
                      title="Taom qo'shish"
                      onClick={e => {
                        e.stopPropagation()
                        if (onSelectTableForOrder) onSelectTableForOrder(table)
                        navigate('/')
                      }}
                    >
                      <Plus size={13} />
                    </button>
                    <button
                      type="button"
                      className="ptc-settle-btn"
                      title="Hisob va to'lov"
                      onClick={e => {
                        e.stopPropagation()
                        if (onOpenTableDetail) onOpenTableDetail(table)
                      }}
                    >
                      <Receipt size={13} />
                      <span>Hisob</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
      {/* Add Modal */}
      {showAddModal && (
        <div className="pos-modal-backdrop" onClick={() => setShowAddModal(false)}>
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
            <form onSubmit={handleCreate}>
              <div className="pos-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="pos-modal-label">
                    Stol raqami *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: 21, VIP-2"
                    value={newTable.tableNumber}
                    onChange={e => setNewTable({ ...newTable, tableNumber: e.target.value })}
                    className="pos-modal-input"
                  />
                </div>
                <div>
                  <label className="pos-modal-label">
                    Nomi (ixtiyoriy)
                  </label>
                  <input
                    type="text"
                    placeholder="Masalan: Oyna oldi stoli"
                    value={newTable.name}
                    onChange={e => setNewTable({ ...newTable, name: e.target.value })}
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
                    value={newTable.zone}
                    onChange={e => setNewTable({ ...newTable, zone: e.target.value })}
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
                    value={newTable.capacity}
                    onChange={e => setNewTable({ ...newTable, capacity: Number(e.target.value) })}
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
                  style={{ width: 'auto', padding: '0 24px', height: '40px', background: '#0f172a' }}
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TablesPage
