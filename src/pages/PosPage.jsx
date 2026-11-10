import React, { useState, useMemo } from 'react'
import { 
  Users, 
  Clock, 
  Check, 
  Receipt, 
  RefreshCw, 
  ShoppingBag, 
  Plus, 
  Search, 
  Armchair, 
  X,
  Eye
} from 'lucide-react'
import CategoryPills from '../components/CategoryPills'
import SkeletonCard from '../components/SkeletonCard'
import FoodCard from '../components/FoodCard'
import ActiveTableBar from '../components/ActiveTableBar'
import { useLanguage } from '../context/LanguageContext'
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
    _id: `table-${num}`,
    tableNumber: String(num).padStart(2, '0'),
    name: `Stol ${num}`,
    zone,
    capacity,
    status: 'FREE',
    currentTotal: 0
  }
})

const PosPage = ({
  activeCategory,
  setActiveCategory,
  INITIAL_CATEGORIES,
  products,
  loading,
  filteredProducts,
  addToCart,
  updateQty,
  cart,
  selectedTable,
  orderType = 'in_hall',
  setOrderType,
  onSelectTable,
  onOpenTableSelector,
  onClearSelectedTable,
  onOpenTableDetail,
  onPrintPreBill,
  tables = [],
  onAddTable,
  onRefreshTables,
  isAdmin = false
}) => {
  const { t } = useLanguage()
  const { settings, formatPrice } = useSettings()

  const [activeZone, setActiveZone] = useState('all')
  const [searchTableQuery, setSearchTableQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [now] = useState(() => Date.now())
  const [newTable, setNewTable] = useState({
    tableNumber: '',
    name: '',
    zone: 'Asosiy zal',
    capacity: 4
  })

  // Check if dine-in first floor plan mode is active
  const isDineInFirst = (settings.orders?.serviceMode || 'dine_in_first') === 'dine_in_first'
  const isFloorPlanMode = orderType === 'in_hall' && !selectedTable && isDineInFirst

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

  // Filter tables
  const filteredTables = useMemo(() => {
    return effectiveTables.filter(t => {
      const matchesZone = activeZone === 'all' || t.zone === activeZone
      const matchesSearch = !searchTableQuery || 
        String(t.tableNumber).toLowerCase().includes(searchTableQuery.toLowerCase()) ||
        (t.name && t.name.toLowerCase().includes(searchTableQuery.toLowerCase()))
      return matchesZone && matchesSearch
    })
  }, [effectiveTables, activeZone, searchTableQuery])

  // Floor Plan Metrics
  const metrics = useMemo(() => {
    const total = effectiveTables.length
    const free = effectiveTables.filter(t => t.status === 'FREE').length
    const occupied = effectiveTables.filter(t => t.status === 'OCCUPIED').length
    const bill = effectiveTables.filter(t => t.status === 'BILL_PRINTED').length
    return { total, free, occupied, bill }
  }, [effectiveTables])

  const handleTableCardClick = (table) => {
    if (table.status === 'OCCUPIED' || table.status === 'BILL_PRINTED') {
      if (onOpenTableDetail) {
        onOpenTableDetail(table)
      }
    } else {
      if (onSelectTable) {
        onSelectTable(table)
      }
    }
  }

  const handleCreateNewTable = async (e) => {
    e.preventDefault()
    if (!newTable.tableNumber) return
    if (onAddTable) {
      await onAddTable(newTable)
      setShowAddModal(false)
      setNewTable({ tableNumber: '', name: '', zone: 'Asosiy zal', capacity: 4 })
    }
  }

  // -------------------------------------------------------------
  // VIEW 1: RESTAURANT FLOOR PLAN (START VIEW)
  // -------------------------------------------------------------
  if (isFloorPlanMode) {
    return (
      <div className="floor-plan-container" style={{ padding: '4px 0 24px' }}>
        {/* Top Header Strip */}
        <div className="floor-plan-header">
          <div>
            <h1 className="floor-plan-main-title">Zal va Stollar</h1>
            <p className="floor-plan-sub-title">Buyurtma berish uchun stolni tanlang yoki faol hisobni boshqaring</p>
          </div>

          <div className="floor-plan-actions">
            {setOrderType && (
              <button
                type="button"
                className="fp-action-btn"
                onClick={() => setOrderType('takeaway')}
                title="Stol biriktirmasdan bevosita tezkor savdo"
              >
                <ShoppingBag size={15} color="#2563eb" />
                <span>Olib ketish (Tezkor)</span>
              </button>
            )}

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
                <span>Stol qo‘shish</span>
              </button>
            )}
          </div>
        </div>

        {/* Real-time Status Metrics Strip */}
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

        {/* Filter Controls: Zones & Search */}
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
              value={searchTableQuery}
              onChange={e => setSearchTableQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Floor Plan Tables Grid */}
        <div className="floor-tables-grid">
          {filteredTables.map(table => {
            const isOccupied = table.status === 'OCCUPIED'
            const isBill     = table.status === 'BILL_PRINTED'
            const isFree     = table.status === 'FREE'
            const statusClass = isOccupied ? 'state-occupied' : isBill ? 'state-bill' : 'state-free'
            const elapsedMins = table.openedAt
              ? Math.max(1, Math.round((now - new Date(table.openedAt).getTime()) / 60000))
              : null

            const rawOrderNum = String(table.currentOrderNumber || '').replace(/^#+/, '')
            const orderLabel  = rawOrderNum ? `#${rawOrderNum}` : null

            return (
              <div
                key={table._id || table.tableNumber}
                className={`ptc ${statusClass}`}
                onClick={() => handleTableCardClick(table)}
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
                          if (onSelectTable) onSelectTable(table)
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
        {/* Quick Add Table Modal */}
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

              <form onSubmit={handleCreateNewTable} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="pos-modal-label">
                    Stol raqami *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: 21 yoki VIP-02"
                    value={newTable.tableNumber}
                    onChange={e => setNewTable({ ...newTable, tableNumber: e.target.value })}
                    className="pos-modal-input"
                  />
                </div>

                <div>
                  <label className="pos-modal-label">
                    Zal / Hudud
                  </label>
                  <input
                    type="text"
                    placeholder="Asosiy zal, Terrasa, VIP..."
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
                    onChange={e => setNewTable({ ...newTable, capacity: parseInt(e.target.value, 10) || 4 })}
                    className="pos-modal-input"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
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
      </div>
    )
  }

  // -------------------------------------------------------------
  // VIEW 2: PRODUCT MENU & ORDERING (TABLE OR TAKEAWAY ACTIVE)
  // -------------------------------------------------------------
  return (
    <>
      {/* Table Context Bar (Dine-In) */}
      {orderType === 'in_hall' && (
        <ActiveTableBar
          selectedTable={selectedTable}
          onOpenTableSelector={onOpenTableSelector}
          onClearSelectedTable={onClearSelectedTable}
          onOpenTableDetail={onOpenTableDetail}
          onPrintPreBill={onPrintPreBill}
        />
      )}

      {/* Takeaway / Delivery Header Ribbon */}
      {orderType !== 'in_hall' && (
        <div className="pos-table-context-ribbon">
          <div className="table-ribbon-left">
            <div className="table-ribbon-avatar takeaway">
              <ShoppingBag size={20} />
            </div>
            <div className="table-ribbon-meta">
              <div className="table-ribbon-title-row">
                <span className="table-ribbon-title">{orderType === 'takeaway' ? 'Olib ketish (Takeaway)' : 'Yetkazib berish (Delivery)'}</span>
                <span className="table-ribbon-tag">Tezkor savdo</span>
              </div>
              <span className="table-ribbon-sub">Stolsiz bevosita kassadan xarid qilish tartibi</span>
            </div>
          </div>
          <div className="table-ribbon-actions">
            {setOrderType && (
              <button
                type="button"
                className="pos-action-btn-secondary"
                style={{ height: '36px', padding: '0 14px', fontSize: '0.82rem', fontWeight: 700, gap: '6px' }}
                onClick={() => setOrderType('in_hall')}
              >
                <Armchair size={15} />
                <span>Zaldagi stollarga o‘tish</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category Pills */}
      <CategoryPills
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categories={INITIAL_CATEGORIES}
        products={products}
      />

      {/* Products Grid */}
      <section className="products-grid">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product, index) => (
            <div
              key={product._id}
              className="card-entrance"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <FoodCard
                product={product}
                addToCart={addToCart}
                updateQty={updateQty}
                cart={cart}
              />
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', gridColumn: '1/-1', padding: '100px', color: 'var(--pos-text-dim)', fontWeight: 600 }}>
            {t('no_products')}
          </div>
        )}
      </section>
    </>
  )
}

export default PosPage