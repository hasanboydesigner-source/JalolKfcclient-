import CategoryPills from '../components/CategoryPills'
import SkeletonCard from '../components/SkeletonCard'
import FoodCard from '../components/FoodCard'
import { useLanguage } from '../context/LanguageContext'

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
}) => {
  const { t } = useLanguage()

  return (
    <>
      <CategoryPills
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        categories={INITIAL_CATEGORIES}
        products={products}
      />

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
