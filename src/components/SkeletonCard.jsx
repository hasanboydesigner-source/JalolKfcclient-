import React from 'react'

const SkeletonCard = () => {
  return (
    <div className="product-card skeleton-card">
      <div className="product-visual skeleton" style={{ background: 'none' }}>
        <div className="skeleton-img skeleton" style={{ width: '80%', height: '80%', borderRadius: '12px' }}></div>
      </div>
      
      <div className="product-content">
        <div className="product-info-minimal">
          <div className="skeleton" style={{ height: '1.2rem', width: '90%', marginBottom: '8px' }}></div>
          <div className="skeleton" style={{ height: '1.1rem', width: '60%' }}></div>
        </div>

        <div className="card-action-area">
          <div className="skeleton" style={{ height: '44px', width: '100%', borderRadius: '12px' }}></div>
        </div>
      </div>
    </div>
  )
}

export default SkeletonCard
