import React from 'react'
import { Icon } from './Icons'

const CategoryPills = ({ activeCategory, setActiveCategory, categories, products }) => {
  const getCount = (id) => {
    if (id === 'all') return products.length
    return products.filter(p => p.category === id).length
  }

  return (
    <section className="category-strip">
      {categories.map(cat => (
        <div 
          key={cat.id} 
          className={`category-pill ${activeCategory === cat.id ? 'active' : ''}`}
          onClick={() => setActiveCategory(cat.id)}
        >
          <div className="pill-icon">
            <Icon name={cat.icon} size={18} />
          </div>
          <span className="category-pill-name" style={{ fontSize: '0.85rem', fontWeight: 700 }}>
            {cat.name}
          </span>
          <span className="pill-count">
            {getCount(cat.id)}
          </span>
        </div>
      ))}
    </section>
  )
}

export default CategoryPills
