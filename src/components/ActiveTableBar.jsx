import React from 'react'
import { Armchair, ArrowRightLeft, Receipt, X, Eye, ChevronLeft } from 'lucide-react'
import { useSettings } from '../context/SettingsContext'

const ActiveTableBar = ({
  selectedTable,
  onOpenTableSelector,
  onClearSelectedTable,
  onOpenTableDetail,
  onPrintPreBill
}) => {
  const { formatPrice } = useSettings()

  /* ── Empty state: no table selected ── */
  if (!selectedTable) {
    return (
      <div className="atb-wrap atb-empty">
        <div className="atb-left">
          <div className="atb-icon-box empty">
            <Armchair size={18} />
          </div>
          <div className="atb-info">
            <span className="atb-label">Stol tanlanmagan</span>
            <span className="atb-sub">Buyurtmani stolga biriktirish uchun stol tanlang</span>
          </div>
        </div>
        <button
          type="button"
          className="atb-btn-primary"
          onClick={onOpenTableSelector}
        >
          <Armchair size={14} />
          Stol tanlash
        </button>
      </div>
    )
  }

  const isOccupied = selectedTable.status === 'OCCUPIED'
  const isBill     = selectedTable.status === 'BILL_PRINTED'
  const stateKey   = isOccupied ? 'occupied' : isBill ? 'bill' : 'free'

  const rawOrderNum = String(selectedTable.currentOrderNumber || '').replace(/^#+/, '')
  const orderLabel  = rawOrderNum ? `#${rawOrderNum}` : null

  return (
    <div className="atb-wrap">
      {/* ── Left: identity ── */}
      <div className="atb-left">
        <div className={`atb-icon-box ${stateKey}`}>
          #{selectedTable.tableNumber}
        </div>

        <div className="atb-info">
          <div className="atb-title-row">
            <span className="atb-label">
              Stol #{selectedTable.tableNumber}
            </span>
            {selectedTable.zone && (
              <span className="atb-zone-tag">{selectedTable.zone}</span>
            )}
            <span className={`atb-state-pill ${stateKey}`}>
              <span className={`atb-dot ${stateKey}`} />
              {isOccupied
                ? (orderLabel || 'Faol')
                : isBill
                  ? 'Hisob'
                  : "Bo'sh"}
            </span>
          </div>

          <div className="atb-sub-row">
            {isOccupied && selectedTable.currentTotal > 0 && (
              <span className="atb-total">
                {formatPrice(selectedTable.currentTotal)}
              </span>
            )}
            {selectedTable.capacity && (
              <span className="atb-meta">{selectedTable.capacity} kishi</span>
            )}
            {selectedTable.openedAt && (
              <span className="atb-meta">
                {new Date(selectedTable.openedAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: actions ── */}
      <div className="atb-actions">
        {isOccupied && onOpenTableDetail && (
          <button
            type="button"
            className="atb-btn-ghost"
            onClick={() => onOpenTableDetail(selectedTable)}
            title="Batafsil ko'rish"
          >
            <Eye size={15} />
            <span>Hisob</span>
          </button>
        )}

        {isOccupied && onPrintPreBill && (
          <button
            type="button"
            className="atb-btn-ghost"
            onClick={() => onPrintPreBill(selectedTable)}
            title="Pre-chek"
          >
            <Receipt size={14} />
            <span>Pre-chek</span>
          </button>
        )}

        <button
          type="button"
          className="atb-btn-ghost"
          onClick={onOpenTableSelector}
          title="Stol almashtirish"
        >
          <ArrowRightLeft size={14} />
          <span>Stol</span>
        </button>

        <button
          type="button"
          className="atb-btn-ghost icon-only"
          onClick={onClearSelectedTable}
          title="Yopish"
        >
          <ChevronLeft size={16} />
        </button>
      </div>
    </div>
  )
}

export default ActiveTableBar
