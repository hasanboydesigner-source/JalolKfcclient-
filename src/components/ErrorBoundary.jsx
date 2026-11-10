import React from 'react';
import { AlertTriangle, RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('🛡️ React ErrorBoundary caught an unhandled error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetStorage = () => {
    try {
      localStorage.removeItem('jalol_products_cache');
      localStorage.removeItem('restaurant_settings_cache');
      localStorage.removeItem('offline_orders');
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      const isHtmlError = this.state.error?.message?.includes('HTML instead of JSON') || 
                          this.state.error?.message?.includes('forEach is not a function');

      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          color: '#0f172a'
        }}>
          <div style={{
            maxWidth: '520px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 1px rgba(15, 23, 42, 0.1)',
            padding: '36px 32px',
            textAlign: 'center'
          }}>
            {/* Visual Icon Badge */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: '#fef2f2',
              color: '#ef4444',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
              boxShadow: 'inset 0 0 0 1px rgba(239, 68, 68, 0.15)'
            }}>
              <AlertTriangle size={32} />
            </div>

            {/* Title & Description */}
            <h1 style={{
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 10px 0',
              color: '#0f172a'
            }}>
              Interfeysda vaqtinchalik xatolik
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#64748b',
              lineHeight: 1.6,
              margin: '0 0 24px 0'
            }}>
              {isHtmlError
                ? "Server bilan aloqada uzilish yoki ma'lumotlar formatida nomuvofiqlik aniqlandi. Tizim xavfsiz holatda saqlandi."
                : "Sahifani yuklash jarayonida kutilmagan holat yuz berdi. Iltimos, sahifani yangilang yoki keshni tozalang."}
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                onClick={this.handleReload}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '13px 20px',
                  borderRadius: '12px',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)'
                }}
              >
                <RefreshCw size={16} />
                <span>Sahifani yangilash</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetStorage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '12px 20px',
                  borderRadius: '12px',
                  background: '#f8fafc',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                <Trash2 size={15} />
                <span>Keshni tozalash va qayta boshlash</span>
              </button>
            </div>

            {/* Diagnostic Details Accordion */}
            <div style={{ marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={this.toggleDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <span>Texnik ma'lumot (Diagnostika)</span>
                {this.state.showDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {this.state.showDetails && (
                <div style={{
                  marginTop: '12px',
                  textAlign: 'left',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  color: '#dc2626',
                  maxHeight: '140px',
                  overflowY: 'auto',
                  wordBreak: 'break-all'
                }}>
                  <div><strong>Xatolik:</strong> {String(this.state.error?.message || this.state.error)}</div>
                  {this.state.errorInfo?.componentStack && (
                    <div style={{ marginTop: '6px', color: '#64748b' }}>
                      {this.state.errorInfo.componentStack}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
