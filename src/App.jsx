import { useState, useMemo, useEffect } from 'react'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'
axios.defaults.baseURL = 'https://jalolkfc.onrender.com'

// Modular Components
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import CategoryPills from './components/CategoryPills'
import Cart from './components/Cart'
import ProductModal from './components/ProductModal'
import SplashScreen from './components/SplashScreen'
import LoginView from './components/LoginView'
import ConfirmModal from './components/ConfirmModal'
import BottomNav from './components/BottomNav'
import { Routes, Route, useLocation } from 'react-router-dom'
import PosPage from './pages/PosPage'
import AdminPage from './pages/AdminPage'
import StatsPage from './pages/StatsPage'
import KitchenPage from './pages/KitchenPage'
import Receipt from './components/Receipt'

import { useLanguage } from './context/LanguageContext'

function App() {
  const location = useLocation()
  const { t } = useLanguage()

  const searchParams = new URLSearchParams(location.search)
  const tableParam = searchParams.get('table')
  const isCustomerView = !!tableParam

  const INITIAL_CATEGORIES = [
    { id: 'all', name: t('all'), icon: 'all' },
    { id: 'burgers', name: t('burgers'), icon: 'burger' },
    { id: 'buckets', name: t('buckets'), icon: 'bucket' },
    { id: 'pizza', name: t('pizza'), icon: 'pizza' },
    { id: 'drinks', name: t('drinks'), icon: 'drink' },
    { id: 'sides', name: t('sides'), icon: 'side' },
  ]

  const currentView = location.pathname === '/admin' ? 'admin' : location.pathname === '/stats' ? 'stats' : location.pathname === '/kitchen' ? 'kitchen' : 'pos'
  const [activeCategory, setActiveCategory] = useState('all')
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [orderType, setOrderType] = useState('in_hall')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ overall: { total: 0, count: 0 }, daily: { total: 0, count: 0 }, topProducts: [], recentOrders: [] })
  const [statsLoading, setStatsLoading] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [statsDate, setStatsDate] = useState(new Date().toISOString().split('T')[0])

  // Auth & Splash State
  const [showSplash, setShowSplash] = useState(true)
  const [isSplashExiting, setIsSplashExiting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)

  const handleLogin = async (pin) => {
    try {
      const res = await axios.post('/api/auth/login', { pin })
      if (res.data.success) {
        setIsAuthenticated(true)
        setUser(res.data.user)
        localStorage.setItem('jalol_user', JSON.stringify(res.data.user))
        toast.success(`${t('update_success')}, ${res.data.user.name}!`, {
          position: "top-right",
          autoClose: 2000,
          theme: "colored",
        })
        return true
      }
    } catch (err) {
      // LoginView handles the error state internally
    }
    return false
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem('jalol_user')
    toast.info(t('logout'))
  }

  useEffect(() => {
    const savedUser = localStorage.getItem('jalol_user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
      setIsAuthenticated(true)
    }
    // Initial Splash Sequence
    const timer = setTimeout(() => {
      setIsSplashExiting(true)
      setTimeout(() => setShowSplash(false), 800) // Match CSS transition
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Pending Orders Polling
  const [pendingOrders, setPendingOrders] = useState([])
  const [lastNotificationId, setLastNotificationId] = useState(null)

  useEffect(() => {
    if (!isAuthenticated || isCustomerView) return

    const fetchPending = async () => {
      try {
        const res = await axios.get('/api/orders/pending')
        setPendingOrders(res.data)
        if (res.data.length > 0) {
          const newest = res.data[0]
          if (newest._id !== lastNotificationId) {
            toast.info(`🔔 Stoldan yangi buyurtma keldi! (Stol #${newest.tableNumber || '?'})`, {
              icon: '🍽️',
              theme: 'dark'
            })
            setLastNotificationId(newest._id)
          }
        }
      } catch (err) {
        console.error('Pending orders check error:', err)
      }
    }

    fetchPending()
    const interval = setInterval(fetchPending, 10000)
    return () => clearInterval(interval)
  }, [isAuthenticated, isCustomerView, lastNotificationId])

  // CRUD & Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '', price: '', category: 'burgers', desc: '', tag: 'Non Veg', discount: ''
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)

  useEffect(() => {
    fetchProducts()
    if (currentView === 'stats') {
      fetchStats()
    }
  }, [currentView, statsDate])

  const fetchStats = async () => {
    setStatsLoading(true)
    try {
      const res = await axios.get('/api/stats', { params: { date: statsDate } })
      setStats(res.data)
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/products')
      setProducts(res.data)
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  // Cart Logic
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item._id === product._id)
      if (existing) {
        return prev.map((item) =>
          item._id === product._id ? { ...item, qty: item.qty + 1 } : item
        )
      }
      return [...prev, { ...product, qty: 1 }]
    })
  }

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item
      ).filter(item => item.qty > 0)
    )
  }

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart])
  const tax = subtotal * 0.05
  const total = subtotal + tax
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart])
  
  // Smart Recommendations Logic
  const recommendedProducts = useMemo(() => {
    if (cart.length === 0) return []
    const cartCategories = new Set(cart.map(item => item.category))
    const needsDrinks = !cartCategories.has('drinks')
    const needsSides = !cartCategories.has('sides')
    
    return products.filter(p => {
      if (cart.find(item => item._id === p._id)) return false
      if (needsDrinks && p.category === 'drinks') return true
      if (needsSides && p.category === 'sides') return true
      return false
    }).slice(0, 4)
  }, [cart, products])

  // Filtering
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = activeCategory === 'all' || p.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [products, activeCategory, searchQuery])

  // CRUD Handlers
  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({ ...product })
    } else {
      setEditingProduct(null)
      setFormData({ name: '', price: '', category: 'burgers', desc: '', tag: 'Non Veg', discount: '' })
    }
    setSelectedFile(null)
    setIsModalOpen(true)
  }

  const handleSaveProduct = async (e) => {
    e.preventDefault()
    const data = new FormData()
    Object.keys(formData).forEach(key => {
      if (key !== '_id' && key !== '__v' && key !== 'image') {
        data.append(key, formData[key])
      }
    })
    if (selectedFile) {
      data.append('image', selectedFile)
    }

    try {
      if (editingProduct) {
        await axios.put(`/api/products/${editingProduct._id}`, data)
        toast.success(t('update_success'))
      } else {
        await axios.post('/api/products', data)
        toast.success(t('added'))
      }
      fetchProducts()
      setIsModalOpen(false)
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
  }

  const executeDelete = async () => {
    if (!productToDelete) return
    try {
      await axios.delete(`/api/products/${productToDelete}`)
      fetchProducts()
      toast.success(t('update_success'))
      setShowConfirmModal(false)
      setProductToDelete(null)
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
  }

  const handleDeleteProduct = (id) => {
    setProductToDelete(id)
    setShowConfirmModal(true)
  }

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return

    const orderData = {
      items: cart.map(item => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        image: item.image
      })),
      subtotal,
      tax,
      total,
      orderType: isCustomerView ? 'Zalda' : (orderType === 'in_hall' ? 'Zalda' : orderType === 'takeaway' ? 'Olib ketish' : 'Yetkazib'),
      paymentMethod: paymentMethod === 'cash' ? 'Naqd' : paymentMethod === 'card' ? 'Karta' : 'QR',
      source: isCustomerView ? 'Customer' : 'POS',
      tableNumber: tableParam || null,
      status: isCustomerView ? 'Pending' : 'Preparing'
    }

    try {
      const res = await axios.post('/api/orders', orderData)
      const savedOrder = res.data

      toast.success(t('order_success'), {
        icon: '🚀',
        style: { borderRadius: '12px', background: '#333', color: '#fff' }
      })

      if (isCustomerView) {
        setTimeout(() => setCart([]), 500)
      } else {
        setTimeout(() => {
          window.print()
          setCart([])
        }, 500)
      }

      if (currentView === 'stats') fetchStats()
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
  }

  const handleCompletePending = async (orderId) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`, { status: 'Completed' })
      toast.success(t('order_success') + ' (Bajarildi)')
      setPendingOrders(prev => prev.filter(o => o._id !== orderId))
      if (currentView === 'stats') fetchStats()
    } catch (err) {
      toast.error('Error: ' + err.message)
    }
  }

  return (
    <div className="pos-container">
      {(!isAuthenticated && !isCustomerView) ? (
        <LoginView onLogin={handleLogin} />
      ) : (
        <>
          {!isCustomerView && <Sidebar user={user} />}

          <div className="pos-layout-main">
            <Header
              user={user}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              currentView={currentView}
              showMobileCart={showMobileCart}
              setShowMobileCart={setShowMobileCart}
              cartCount={cartCount}
              onLogout={handleLogout}
              isCustomerView={isCustomerView}
              tableParam={tableParam}
              pendingOrders={pendingOrders}
              onCompleteOrder={handleCompletePending}
            />

            <main className="pos-viewport">
              <Routes>
                <Route
                  path="/"
                  element={
                    <PosPage
                      activeCategory={activeCategory}
                      setActiveCategory={setActiveCategory}
                      INITIAL_CATEGORIES={INITIAL_CATEGORIES}
                      products={products}
                      loading={loading}
                      filteredProducts={products.filter(p =>
                        (activeCategory === 'all' || p.category === activeCategory) &&
                        (p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      )}
                      addToCart={addToCart}
                      updateQty={updateQty}
                      cart={cart}
                    />
                  }
                />
                {user?.role === 'admin' && (
                  <>
                    <Route
                      path="/admin"
                      element={
                        <AdminPage
                          products={products}
                          searchQuery={searchQuery}
                          handleOpenModal={handleOpenModal}
                          handleDeleteProduct={handleDeleteProduct}
                          INITIAL_CATEGORIES={INITIAL_CATEGORIES}
                        />
                      }
                    />
                    <Route
                      path="/stats"
                      element={
                        <StatsPage
                          stats={stats}
                          loading={statsLoading}
                          statsDate={statsDate}
                          setStatsDate={setStatsDate}
                        />
                      }
                    />
                    <Route path="/kitchen" element={<KitchenPage />} />
                  </>
                )}
                <Route path="*" element={<PosPage
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  INITIAL_CATEGORIES={INITIAL_CATEGORIES}
                  products={products}
                  loading={loading}
                  filteredProducts={products.filter(p =>
                    (activeCategory === 'all' || p.category === activeCategory) &&
                    (p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  )}
                  addToCart={addToCart}
                  updateQty={updateQty}
                  cart={cart}
                />} />
              </Routes>
            </main>
          </div>

          {currentView === 'pos' && (
            <div className={`mobile-cart-overlay ${showMobileCart ? 'show-mobile-cart' : ''}`}>
              <Cart
                cart={cart}
                updateQty={updateQty}
                subtotal={subtotal}
                tax={tax}
                total={total}
                orderType={orderType}
                setOrderType={setOrderType}
                paymentMethod={paymentMethod}
                setPaymentMethod={setPaymentMethod}
                handlePlaceOrder={handlePlaceOrder}
                setShowMobileCart={setShowMobileCart}
                isCustomerView={isCustomerView}
                recommendedProducts={recommendedProducts}
                addToCart={addToCart}
              />
            </div>
          )}

          {!isCustomerView && <BottomNav />}
        </>
      )}

      {/* Hidden Receipt for Printing */}
      <div className="print-only">
        <Receipt
          cart={cart}
          total={total}
          subtotal={subtotal}
          tax={tax}
          orderType={orderType}
          paymentMethod={paymentMethod}
          user={user}
        />
      </div>

      <ProductModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        editingProduct={editingProduct}
        formData={formData}
        setFormData={setFormData}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        handleSaveProduct={handleSaveProduct}
        INITIAL_CATEGORIES={INITIAL_CATEGORIES}
      />

      <ConfirmModal
        isOpen={showConfirmModal}
        message={t('delete_confirm_msg')}
        onConfirm={executeDelete}
        onCancel={() => {
          setShowConfirmModal(false)
          setProductToDelete(null)
        }}
      />

      {showSplash && <SplashScreen isExiting={isSplashExiting} />}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </div>
  )
}

export default App
