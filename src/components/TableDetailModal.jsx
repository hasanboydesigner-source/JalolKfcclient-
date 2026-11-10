import React, { useState, useEffect } from 'react'
import { 
  X, 
  Armchair, 
  Users, 
  Clock, 
  Receipt, 
  PlusCircle, 
  ArrowRightLeft, 
  CheckCircle2, 
  Trash2,
  AlertCircle,
  Banknote,
  CreditCard
} from 'lucide-react'
import { useSettings } from '../context/SettingsContext'
import { getBgRemovedUrl } from '../utils/imageUtils'

const TableDetailModal = ({
  table,
  isOpen,
  onClose,
  allTables = [],
  onAppendItemsToTable,
  onPrintPreBill,
  onTransferTable,
  onCloseAndSettleTable,
  onForceClearTable
}) => {
  const { formatPrice } = useSettings()
  const [showTransferPicker, setShowTransferPicker] = useState(false)
  const [showPaymentPicker, setShowPaymentPicker] = useState(false)
  const [targetTableId, setTargetTableId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [now] = useState(() => Date.now())

  // Ensure modal ALWAYS opens in Receipt & Order Details view first
  useEffect(() => {
    if (isOpen) {
      setShowPaymentPicker(false)
      setShowTransferPicker(false)
    }
  }, [isOpen, table?._id])

  const handleModalClose = () => {
    setShowPaymentPicker(false)
    setShowTransferPicker(false)
    onClose()
  }

  if (!isOpen || !table) return null

  const order = table.currentOrder
  const freeTables = allTables.filter(t => t.status === 'FREE' && String(t._id) !== String(table._id))

  const handleExecuteTransfer = async () => {
    if (!targetTableId) return
    setIsSubmitting(true)
    try {
      await onTransferTable(table._id, targetTableId)
      handleModalClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const elapsedMinutes = table.openedAt 
    ? Math.max(1, Math.round((now - new Date(table.openedAt).getTime()) / 60000))
    : null

  const isOccupied = table.status === 'OCCUPIED'

  return (
    <div className="pos-modal-backdrop" onClick={handleModalClose}>
      <div className="pos-modal-card" onClick={e => e.stopPropagation()}>
        {/* Modal Head */}
        <div className="pos-modal-head">
          <div className="pos-modal-title-group">
            <div className={`pos-modal-badge-icon ${isOccupied ? 'occupied' : ''}`}>
              <Armchair size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 className="pos-modal-title">Stol #{table.tableNumber}</h3>
                <span className="pos-table-pill pos-modal-zone-pill">
                  {table.zone || 'Asosiy zal'}
                </span>
                <span className={`pos-table-pill ${isOccupied ? 'state-occupied' : 'state-bill'}`}>
                  <span className={`pos-table-dot ${isOccupied ? 'state-occupied' : 'state-bill'}`} />
                  {isOccupied ? 'Band' : 'Pre-chek'}
                </span>
              </div>
              <div className="pos-modal-submeta">
                <span><Users size={12} /> {table.guestCount || 1} mehmon</span>
                {elapsedMinutes !== null && <span>• <Clock size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> {elapsedMinutes}m avval</span>}
                {table.occupiedBy && <span>• {table.occupiedBy}</span>}
              </div>
            </div>
          </div>

          <button 
            type="button" 
            className="pos-action-btn-secondary" 
            style={{ width: '36px', height: '36px', padding: 0, borderRadius: '8px' }} 
            onClick={handleModalClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="pos-modal-content">
          {showPaymentPicker ? (
            <div className="payment-picker-box">
              <div className="payment-picker-icon-circle">
                <Receipt size={22} />
              </div>
              <h4 className="payment-picker-title">
                Stol #{table.tableNumber} Hisobini Yopish
              </h4>
              <p className="payment-picker-sub">
                To‘lov usulini tanlang. Stol darhol bo‘shatiladi va chek chiqariladi.
              </p>

              <div className="payment-total-card">
                <span className="payment-total-label">
                  Jami to‘lov summasi
                </span>
                <span className="payment-total-val">
                  {formatPrice(table.currentTotal || order?.total || 0)}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <button
                  type="button"
                  className="pos-payment-btn-cash"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setIsSubmitting(true)
                    try {
                      await onCloseAndSettleTable(table, 'Naqd')
                      handleModalClose()
                    } finally {
                      setIsSubmitting(false)
                    }
                  }}
                >
                  <Banknote size={18} />
                  <span>Naqd pul</span>
                </button>

                <button
                  type="button"
                  className="pos-payment-btn-card"
                  disabled={isSubmitting}
                  onClick={async () => {
                    setIsSubmitting(true)
                    try {
                      await onCloseAndSettleTable(table, 'Karta')
                      handleModalClose()
                    } finally {
                      setIsSubmitting(false)
                    }
                  }}
                >
                  <CreditCard size={18} />
                  <span>Bank kartasi</span>
                </button>
              </div>

              <button
                type="button"
                className="pos-action-btn-secondary"
                style={{ width: '100%', height: '38px', borderRadius: '8px', fontSize: '0.82rem' }}
                onClick={() => setShowPaymentPicker(false)}
              >
                Ortga qaytish
              </button>
            </div>
          ) : showTransferPicker ? (
            <div className="payment-picker-box" style={{ textAlign: 'left' }}>
              <h4 className="payment-picker-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ArrowRightLeft size={18} color="#6366f1" />
                <span>Buyurtmani boshqa bo‘sh stolga ko‘chirish</span>
              </h4>
              <p className="payment-picker-sub" style={{ lineHeight: 1.5 }}>
                Mijozlar boshqa stolga ko‘chib o‘tgan bo‘lsa, ushbu buyurtmadagi barcha taomlar yangi stolga biriktiriladi.
              </p>

              {freeTables.length === 0 ? (
                <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', color: '#ef4444', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertCircle size={18} />
                  <span>Hozirda boshqa bo‘sh stol mavjud emas.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label className="pos-modal-label">
                      Yangi bo‘sh stolni tanlang:
                    </label>
                    <select 
                      value={targetTableId} 
                      onChange={e => setTargetTableId(e.target.value)}
                      className="pos-modal-input"
                      style={{ height: '44px' }}
                    >
                      <option value="">-- Bo‘sh stolni tanlang --</option>
                      {freeTables.map(t => (
                        <option key={t._id} value={t._id}>
                          Stol #{t.tableNumber} • {t.zone} ({t.capacity || 4} kishilik)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                    <button 
                      type="button" 
                      className="pos-action-btn-secondary" 
                      onClick={() => setShowTransferPicker(false)}
                    >
                      Bekor qilish
                    </button>
                    <button 
                      type="button" 
                      className="pos-action-btn-primary" 
                      style={{ width: 'auto', padding: '0 20px', height: '44px' }}
                      disabled={!targetTableId || isSubmitting}
                      onClick={handleExecuteTransfer}
                    >
                      {isSubmitting ? 'Ko‘chirilmoqda...' : 'Ko‘chirishni tasdiqlash'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Receipt Ticket Card */}
              <div className="ticket-receipt-card">
                <div className="ticket-receipt-head">
                  <span>CHEK: <b>{(() => {
                    const raw = String(order?.orderNumber || table.currentOrderNumber || '').replace(/^#+/, '')
                    return raw ? `#${raw}` : '#---'
                  })()}</b></span>
                  <span>Jami taomlar: <b>{table.itemCount || (order?.items?.length || 0)} dona</b></span>
                </div>

                <div className="ticket-dishes-list">
                  {order && order.items && order.items.length > 0 ? (
                    order.items.map((it, idx) => (
                      <div key={idx} className="ticket-dish-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {it.image && (
                            <img 
                              src={getBgRemovedUrl(it.image)} 
                              alt={it.name} 
                              style={{ width: '36px', height: '36px', objectFit: 'contain' }} 
                            />
                          )}
                          <div>
                            <div className="ticket-dish-title">{it.name}</div>
                            <div className="ticket-dish-meta">{it.qty} dona x {formatPrice(it.price)}</div>
                          </div>
                        </div>
                        <div className="ticket-dish-price">
                          {formatPrice(it.price * it.qty)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
                      Taomlar ro‘yxati yuklanmoqda...
                    </div>
                  )}
                </div>

                {/* Totals */}
                <div className="ticket-totals-box">
                  <div className="ticket-row-line">
                    <span>Oraliq summa:</span>
                    <span>{formatPrice(order?.subtotal || table.currentTotal || 0)}</span>
                  </div>
                  {order?.tax > 0 && (
                    <div className="ticket-row-line">
                      <span>QQS:</span>
                      <span>{formatPrice(order.tax)}</span>
                    </div>
                  )}
                  <div className="ticket-row-final">
                    <span>Jami to‘lov:</span>
                    <span>{formatPrice(table.currentTotal || order?.total || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="modal-actions-container">
                {/* 1. Primary Action: Settle & Pay */}
                <button
                  type="button"
                  className="pos-action-btn-primary"
                  onClick={() => setShowPaymentPicker(true)}
                >
                  <Receipt size={17} />
                  <span>Hisobni yopish (To‘lov)</span>
                </button>

                {/* 2. Secondary Command Grid */}
                <div className="pos-action-grid">
                  <button
                    type="button"
                    className="pos-action-btn-secondary"
                    onClick={() => {
                      onAppendItemsToTable(table)
                      onClose()
                    }}
                  >
                    <PlusCircle size={15} />
                    <span>Taom qo‘shish</span>
                  </button>

                  <button
                    type="button"
                    className="pos-action-btn-secondary"
                    onClick={() => onPrintPreBill(table)}
                  >
                    <Receipt size={15} />
                    <span>Pre-chek</span>
                  </button>

                  <button
                    type="button"
                    className="pos-action-btn-secondary"
                    onClick={() => setShowTransferPicker(true)}
                  >
                    <ArrowRightLeft size={15} />
                    <span>Ko‘chirish</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Foot */}
        <div className="pos-modal-foot">
          <button
            type="button"
            className="pos-void-link"
            onClick={() => {
              if (window.confirm(`${table.tableNumber}-stol buyurtmasini bekor qilib stolni bo‘shatishni tasdiqlaysizmi?`)) {
                onForceClearTable(table._id)
                handleModalClose()
              }
            }}
          >
            <Trash2 size={13} />
            <span>Stolni majburiy bo‘shatish</span>
          </button>

          <button 
            type="button" 
            className="pos-action-btn-secondary" 
            style={{ height: '36px', padding: '0 16px' }}
            onClick={handleModalClose}
          >
            Yopish
          </button>
        </div>
      </div>
    </div>
  )
}

export default TableDetailModal
