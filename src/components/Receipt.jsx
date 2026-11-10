import React from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useSettings } from '../context/SettingsContext'

const Receipt = ({ 
  order, 
  cart: fallbackCart = [], 
  total: fallbackTotal = 0, 
  subtotal: fallbackSubtotal = 0, 
  tax: fallbackTax = 0, 
  orderType: fallbackOrderType = 'in_hall', 
  paymentMethod: fallbackPaymentMethod = 'cash', 
  user, 
  orderNumber: fallbackOrderNumber 
}) => {
  const { t, language } = useLanguage()
  const { settings, formatPrice } = useSettings()

  // Prioritize placed order data snapshot if available
  const hasOrder = !!order && Array.isArray(order.items) && order.items.length > 0
  const isAddonReceipt = hasOrder && !!order.isAddon
  const isTestReceipt = !hasOrder && (!fallbackCart || fallbackCart.length === 0)

  // Items to print
  const items = (isAddonReceipt && order.addonItems && order.addonItems.length > 0)
    ? order.addonItems
    : hasOrder 
      ? order.items 
      : (fallbackCart && fallbackCart.length > 0) 
        ? fallbackCart 
        : [
            { name: "Macho Lavash Kombo", qty: 1, price: 94000, tag: "Solo" },
            { name: "Pepsi", qty: 1, price: 11000, tag: "1.0L" }
          ]

  const total = hasOrder 
    ? order.total 
    : (fallbackCart && fallbackCart.length > 0) 
      ? fallbackTotal 
      : 105000

  const subtotal = hasOrder 
    ? (order.subtotal !== undefined ? order.subtotal : order.total) 
    : (fallbackCart && fallbackCart.length > 0) 
      ? fallbackSubtotal 
      : 105000

  const tax = hasOrder 
    ? (order.tax || 0) 
    : (fallbackCart && fallbackCart.length > 0) 
      ? fallbackTax 
      : 0

  const orderNumber = hasOrder 
    ? order.orderNumber 
    : fallbackOrderNumber || (isTestReceipt ? '#TEST-001' : '')

  const rawOrderType = hasOrder ? order.orderType : fallbackOrderType
  const orderType = rawOrderType === 'in_hall' ? 'Zalda' : rawOrderType === 'takeaway' ? 'Olib ketish' : rawOrderType === 'delivery' ? 'Yetkazib' : (rawOrderType || 'Zalda')

  const rawPaymentMethod = hasOrder ? order.paymentMethod : fallbackPaymentMethod
  const paymentMethod = rawPaymentMethod === 'cash' ? 'Naqd' : rawPaymentMethod === 'card' ? 'Karta' : rawPaymentMethod === 'qr' ? 'QR' : (rawPaymentMethod || 'Naqd')

  const date = new Intl.DateTimeFormat(
    language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uz-UZ',
    {
      timeZone: settings.localization?.timezone || 'Asia/Tashkent',
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }
  ).format(order?.createdAt ? new Date(order.createdAt) : new Date())

  const paperWidth = settings.receipt?.paperWidth || '80mm'
  const taxRate = settings.pricing?.taxEnabled ? (settings.pricing?.taxRate || 0) : 0
  const taxLabel = settings.pricing?.taxLabel || t('tax') || 'QQS'

  return (
    <div className="receipt-container" style={{
      width: paperWidth,
      padding: '4mm',
      background: 'white',
      color: 'black',
      fontFamily: 'monospace',
      fontSize: paperWidth === '58mm' ? '10px' : '12px',
      lineHeight: '1.3'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: '0', fontSize: paperWidth === '58mm' ? '15px' : '18px', fontWeight: 'bold' }}>
          {settings.business?.name || 'RESTORAN'}
        </h2>
        {settings.business?.tagline && (
          <p style={{ margin: '1px 0', fontSize: '9px', opacity: 0.8 }}>{settings.business.tagline}</p>
        )}
        {settings.business?.address && (
          <p style={{ margin: '2px 0', fontSize: '9px' }}>{settings.business.address}</p>
        )}
        {settings.business?.phone && (
          <p style={{ margin: '1px 0 6px', fontSize: '9px' }}>Tel: {settings.business.phone}</p>
        )}
        {isTestReceipt && (
          <p style={{ margin: '2px 0', fontSize: '10px', fontWeight: 'bold', color: '#666' }}>[ TEST CHEKI ]</p>
        )}
        {isAddonReceipt && (
          <div style={{ margin: '4px 0', fontSize: '11px', fontWeight: 'bold', border: '1px dashed black', padding: '3px' }}>
            [ + QO‘SHIMCHA TAOM CHEKI ]
          </div>
        )}
        <div style={{ borderBottom: '1px dashed black', margin: '6px 0' }}></div>
      </div>

      <div style={{ marginBottom: '8px', fontSize: '10px' }}>
        {orderNumber && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>
            <span>BUYURTMA:</span>
            <span>{orderNumber}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('time') || 'Vaqt'}:</span>
          <span>{date}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('cashier') || 'Sotuvchi'}:</span>
          <span>{user?.name || settings.orders?.defaultCashierName || 'Administrator'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('order_type') || 'Buyurtma turi'}:</span>
          <span>{orderType}</span>
        </div>
        {order?.tableNumber && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Stol:</span>
            <span>#{order.tableNumber}</span>
          </div>
        )}
      </div>

      <div style={{ borderBottom: '1px dashed black', margin: '6px 0' }}></div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: paperWidth === '58mm' ? '9px' : '11px' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px dashed black' }}>
            <th style={{ paddingBottom: '4px' }}>{t('product_name') || 'Nomi'}</th>
            <th style={{ paddingBottom: '4px', textAlign: 'center' }}>{t('qty') || 'Soni'}</th>
            <th style={{ paddingBottom: '4px', textAlign: 'right' }}>{t('price') || 'Narxi'}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={idx}>
              <td style={{ padding: '3px 0' }}>
                {item.name}
                {item.tag && item.tag !== 'Standart' && item.tag !== 'Non Veg' ? ` [${item.tag}]` : ''}
              </td>
              <td style={{ textAlign: 'center' }}>
                {item.qty || 1} {item.unit && item.unit !== 'dona' ? (item.unit === 'porsiya' ? 'pors' : item.unit) : ''}
              </td>
              <td style={{ textAlign: 'right' }}>{formatPrice((Number(item.price) || 0) * (Number(item.qty) || 1))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderBottom: '1px dashed black', margin: '6px 0' }}></div>

      <div style={{ fontSize: paperWidth === '58mm' ? '10px' : '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('subtotal') || 'Oraliq jami'}:</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {(tax > 0 || settings.pricing?.taxEnabled) && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{taxLabel} ({taxRate}%):</span>
            <span>{formatPrice(tax)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: paperWidth === '58mm' ? '12px' : '14px', marginTop: '4px' }}>
          <span>{isAddonReceipt ? 'YANGI UMUMIY HISOB:' : (t('total') || 'JAMI').toUpperCase()}:</span>
          <span>{formatPrice(total)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <span>{t('payment_method') || "To'lov turi"}:</span>
          <span>{paymentMethod}</span>
        </div>
      </div>

      <div style={{ borderBottom: '1px dashed black', margin: '6px 0' }}></div>

      <div style={{ textAlign: 'center', marginTop: '8px', fontSize: '9px' }}>
        <p style={{ margin: '0', fontWeight: 'bold' }}>
          {settings.receipt?.footerNote || t('thanks') || 'XARIDINGIZ UCHUN RAHMAT!'}
        </p>
        <p style={{ margin: '3px 0 0' }}>{t('welcome_back') || 'Yana kutib qolamiz.'}</p>
      </div>
    </div>
  )
}

export default Receipt
