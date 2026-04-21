import { useLanguage } from '../context/LanguageContext'

const Receipt = ({ cart, total, subtotal, tax, orderType, paymentMethod, user }) => {
  const { t, language } = useLanguage()
  const date = new Date().toLocaleString(language === 'en' ? 'en-US' : language === 'ru' ? 'ru-RU' : 'uz-UZ', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  return (
    <div className="receipt-container" style={{
      width: '80mm',
      padding: '5mm',
      background: 'white',
      color: 'black',
      fontFamily: 'monospace',
      fontSize: '12px',
      lineHeight: '1.4'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '10px' }}>
        <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>JALOL KFC</h2>
        <p style={{ margin: '2px 0', fontSize: '10px' }}>Namangan viloyati, Chust Shahri</p>
        <p style={{ margin: '2px 0 10px', fontSize: '10px' }}>Tel: +998 (99) 000-00-00</p>
        <div style={{ borderBottom: '1px dashed black', margin: '10px 0' }}></div>
      </div>

      <div style={{ marginBottom: '10px', fontSize: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('time')}:</span>
          <span>{date}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('cashier')}:</span>
          <span>{user?.name || 'Sotuvchi #042'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('order_type')}:</span>
          <span>{t(orderType)}</span>
        </div>
      </div>

      <div style={{ borderBottom: '1px dashed black', margin: '10px 0' }}></div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr style={{ textAlign: 'left' }}>
            <th style={{ paddingBottom: '5px' }}>{t('product_name')}</th>
            <th style={{ paddingBottom: '5px', textAlign: 'center' }}>{t('qty') || 'Soni'}</th>
            <th style={{ paddingBottom: '5px', textAlign: 'right' }}>{t('price')}</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, idx) => (
            <tr key={idx}>
              <td style={{ padding: '4px 0' }}>{item.name}</td>
              <td style={{ textAlign: 'center' }}>{item.qty}</td>
              <td style={{ textAlign: 'right' }}>{(item.price * item.qty).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderBottom: '1px dashed black', margin: '10px 0' }}></div>

      <div style={{ fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('subtotal')}:</span>
          <span>{subtotal.toLocaleString()} {t('sum')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{t('tax')} (5%):</span>
          <span>{tax.toLocaleString()} {t('sum')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px', marginTop: '5px' }}>
          <span>{t('total').toUpperCase()}:</span>
          <span>{total.toLocaleString()} {t('sum')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
          <span>{t('payment_method')}:</span>
          <span>{t(paymentMethod)}</span>
        </div>
      </div>

      <div style={{ borderBottom: '1px dashed black', margin: '10px 0' }}></div>

      <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '10px' }}>
        <p style={{ margin: '0', fontWeight: 'bold' }}>{t('thanks')}</p>
        <p style={{ margin: '5px 0 0' }}>{t('welcome_back')}</p>
      </div>
    </div>
  )
}

export default Receipt
