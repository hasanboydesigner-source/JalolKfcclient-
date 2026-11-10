import { useState, useMemo, useEffect, useCallback, lazy, Suspense, useRef } from 'react'
import { flushSync } from 'react-dom'
import axios from 'axios'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './App.css'

// Configure Axios with dynamic URL and Authorization header
if (import.meta.env.VITE_API_URL) {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL;
}

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => {
    // Detect if an API call was rewritten to index.html (e.g. Vercel SPA rewrite fallback when backend is unreachable)
    const isHtmlResponse = typeof response.data === 'string' &&
      (response.data.trim().startsWith('<!DOCTYPE') ||
       response.data.trim().startsWith('<html') ||
       response.headers?.['content-type']?.includes('text/html'));

    if (isHtmlResponse && response.config?.url?.includes('/api/')) {
      const err = new Error(`API endpoint ${response.config.url} HTML qaytardi (backend serverga ulanib bo'lmadi).`);
      err.isHtmlFallback = true;
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && error.config && !error.config.url?.includes('/api/auth/login')) {
      localStorage.removeItem('pos_token');
      localStorage.removeItem('jalol_user');
      toast.warning('Xavfsizlik tokeni yangilandi. Iltimos, PIN-kod (2024) bilan qaytadan kiring.');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
    return Promise.reject(error);
  }
);

// Modular Components
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import Cart from './components/Cart'
import ProductModal from './components/ProductModal'
import SettingsModal from './components/SettingsModal'
import SplashScreen from './components/SplashScreen'
import LoginView from './components/LoginView'
import ConfirmModal from './components/ConfirmModal'
import BottomNav from './components/BottomNav'
import { Routes, Route, useLocation } from 'react-router-dom'
const PosPage = lazy(() => import('./pages/PosPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const KitchenPage = lazy(() => import('./pages/KitchenPage'))
const StatusPage = lazy(() => import('./pages/StatusPage'))
const KioskPage = lazy(() => import('./pages/KioskPage'))
const TablesPage = lazy(() => import('./pages/TablesPage'))
import TableSelectorModal from './components/TableSelectorModal'
import TableDetailModal from './components/TableDetailModal'
import Receipt from './components/Receipt'
import { useSocket } from './hooks/useSocket'
import { useLanguage } from './context/LanguageContext'
import { useSettings } from './context/SettingsContext'
import { INDUSTRY_TEMPLATES } from '../shared/settingsDefaults'

function App() {
  const location = useLocation()
  const { t } = useLanguage()
  const { settings } = useSettings()

  const searchParams = new URLSearchParams(location.search)
  const tableParam = searchParams.get('table')
  const isCustomerView = !!tableParam
  const isKiosk = location.pathname === '/kiosk'
  const isKitchen = location.pathname === '/kitchen'
  const isStatusScreen = location.pathname === '/status'

  const readySound = settings.statusScreen?.chimeSoundUrl || 'https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3';

  // Real-time Status Notifications for Customers
  const handleNewOrder = useCallback(() => {}, []);
  const handleStatusUpdate = useCallback((updatedOrder) => {
    if (isCustomerView && updatedOrder.tableNumber === tableParam) {
      if (updatedOrder.status === 'Ready') {
        const audio = new Audio(readySound);
        audio.play().catch(e => console.log('Audio blocked:', e));
        toast.success(
          <div style={{ padding: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Buyurtmangiz tayyor! 🍔</h3>
            <p style={{ margin: '5px 0 0', opacity: 0.8 }}>Marhamat, uni qabul qilib oling.</p>
          </div>,
          { 
            position: "top-center",
            autoClose: false,
            closeOnClick: true,
            theme: "dark",
            icon: "🚀"
          }
        );
      }
    }
  }, [isCustomerView, tableParam, readySound]);

  // Tables State & Real-Time Sync (Guaranteed Initial Tables)
  const INITIAL_FALLBACK_TABLES = useMemo(() => Array.from({ length: 20 }, (_, i) => {
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
  }), [])

  const [tables, setTables] = useState(INITIAL_FALLBACK_TABLES)
  const [selectedTable, setSelectedTable] = useState(null)
  const [isTableSelectorOpen, setIsTableSelectorOpen] = useState(false)
  const [tableForDetail, setTableForDetail] = useState(null)

  const fetchTables = useCallback(async () => {
    try {
      const res = await axios.get('/api/tables')
      if (Array.isArray(res.data)) {
        setTables(res.data)
        setSelectedTable(prev => {
          if (!prev) return null
          const latest = res.data.find(t => String(t._id) === String(prev._id))
          return latest || prev
        })
      }
    } catch (err) {
      console.error('Error fetching tables:', err)
    }
  }, [])

  const handleTableUpdate = useCallback((updatedTable) => {
    if (updatedTable) {
      setTables(prev => Array.isArray(prev) ? prev.map(t => String(t._id) === String(updatedTable._id) ? { ...t, ...updatedTable } : t) : [])
      setSelectedTable(prev => prev && String(prev._id) === String(updatedTable._id) ? { ...prev, ...updatedTable } : prev)
    } else {
      fetchTables()
    }
  }, [fetchTables])

  useSocket(handleNewOrder, handleStatusUpdate, undefined, handleTableUpdate);

  const currentView = 
    location.pathname === '/admin' ? 'admin' : 
    location.pathname === '/stats' ? 'stats' : 
    location.pathname === '/kitchen' ? 'kitchen' : 
    location.pathname === '/tables' ? 'tables' : 'pos'
  const [activeCategory, setActiveCategory] = useState('all')
  const [products, setProducts] = useState([])

  const INITIAL_CATEGORIES = useMemo(() => {
    const list = [{ id: 'all', name: t('all') || 'Barchasi', icon: 'all' }];
    const bType = settings?.business?.businessType || 'restaurant';
    const templateCats = INDUSTRY_TEMPLATES[bType]?.categories || INDUSTRY_TEMPLATES.restaurant.categories;
    const configured = Array.isArray(settings?.categories) && settings.categories.length > 0 
      ? settings.categories 
      : (Array.isArray(templateCats) ? templateCats : []);

    if (Array.isArray(configured)) {
      configured.forEach(c => {
        if (c && c.id && !list.some(x => x.id === c.id)) {
          list.push({ ...c });
        }
      });
    }

    if (Array.isArray(products) && products.length > 0) {
      products.forEach(p => {
        if (p && p.category && !list.some(x => x.id === p.category)) {
          const cap = p.category.charAt(0).toUpperCase() + p.category.slice(1);
          list.push({ id: p.category, name: cap, icon: 'utensils' });
        }
      });
    }

    return list;
  }, [settings?.categories, settings?.business?.businessType, t, products]);
  const [cart, setCart] = useState([])
  const [orderType, setOrderType] = useState('in_hall')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ overall: { total: 0, count: 0 }, daily: { total: 0, count: 0 }, topProducts: [], recentOrders: [] })
  const [statsLoading, setStatsLoading] = useState(false)
  const [showMobileCart, setShowMobileCart] = useState(false)
  const [statsDate, setStatsDate] = useState(new Date().toISOString().split('T')[0])
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [lastPlacedOrder, setLastPlacedOrder] = useState(null)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const orderLockRef = useRef(false)
  const cartIdempotencyKeyRef = useRef(null)

  // Auth & Splash State
  const [showSplash, setShowSplash] = useState(true)
  const [isSplashExiting, setIsSplashExiting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  const handleLogin = async (pin) => {
    try {
      const res = await axios.post('/api/auth/login', { pin })
      if (res.data.success) {
        setIsAuthenticated(true)
        setUser(res.data.user)
        localStorage.setItem('jalol_user', JSON.stringify(res.data.user))
        if (res.data.token) {
          localStorage.setItem('pos_token', res.data.token)
        }
        fetchTables()
        toast.success(`${t('update_success') || 'Xush kelibsiz'}, ${res.data.user.name}!`, {
          position: "top-right",
          autoClose: 2000,
          theme: "colored",
        })
        // Senior Workflow: Directly prompt table selection on admin/cashier entry
        if (!isCustomerView && !isKiosk && !isKitchen && !isStatusScreen) {
          setTimeout(() => {
            setIsTableSelectorOpen(true)
          }, 350)
        }
        return true
      }
    } catch (_err) {
      // LoginView handles error
    }
    return false
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    setUser(null)
    localStorage.removeItem('jalol_user')
    localStorage.removeItem('pos_token')
    toast.info(t('logout'))
  }

  useEffect(() => {
    const savedUser = localStorage.getItem('jalol_user')
    const savedToken = localStorage.getItem('pos_token')

    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser))
        setIsAuthenticated(true)
      } catch (_e) {
        localStorage.removeItem('jalol_user')
        localStorage.removeItem('pos_token')
      }
    } else if (savedUser && !savedToken) {
      // Legacy session without JWT token: clear to prompt PIN login
      localStorage.removeItem('jalol_user')
      setUser(null)
      setIsAuthenticated(false)
    }

    const timer = setTimeout(() => {
      setIsSplashExiting(true)
      setTimeout(() => setShowSplash(false), 800)
    }, 1500)

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
        if (Array.isArray(res.data)) {
          setPendingOrders(res.data)
          if (res.data.length > 0) {
            const newest = res.data[0]
            if (newest && newest._id !== lastNotificationId) {
              toast.info(`🔔 Yangi buyurtma keldi! (${newest.orderNumber || 'Stol #' + (newest.tableNumber || '?')})`, {
                icon: '🍽️',
                theme: 'dark'
              })
              setLastNotificationId(newest._id)
            }
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

  const syncOfflineOrders = useCallback(async () => {
    const queue = JSON.parse(localStorage.getItem('offline_orders') || '[]')
    if (queue.length === 0) return

    toast.info(`${queue.length} ta oflayn buyurtma sinxronizatsiya qilinmoqda...`)
    const remainingQueue = []
    
    for (const order of queue) {
      try {
        await axios.post('/api/orders', order)
      } catch (err) {
        console.error('Sync failed for order', order, err)
        remainingQueue.push(order)
      }
    }
    
    if (remainingQueue.length === 0) {
      localStorage.removeItem('offline_orders')
      toast.success('Barcha oflayn buyurtmalar serverga yuborildi!')
    } else {
      localStorage.setItem('offline_orders', JSON.stringify(remainingQueue))
    }
  }, [])

  const fetchStats = useCallback(async () => {
    setStatsLoading(true)
    try {
      const res = await axios.get('/api/stats', { params: { date: statsDate } })
      if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) {
        setStats(res.data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setStatsLoading(false)
    }
  }, [statsDate])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.get('/api/products')
      if (Array.isArray(res.data)) {
        setProducts(res.data)
        localStorage.setItem('jalol_products_cache', JSON.stringify(res.data))
      } else {
        console.warn('Expected array for products but received:', typeof res.data)
        const cached = localStorage.getItem('jalol_products_cache')
        if (cached) {
          try {
            const parsed = JSON.parse(cached)
            if (Array.isArray(parsed)) setProducts(parsed)
            else setProducts([])
          } catch {
            setProducts([])
          }
        } else {
          setProducts([])
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      const cached = localStorage.getItem('jalol_products_cache')
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed)) {
            setProducts(parsed)
            toast.info('Oflayn rejim: Taomlar keshdan yuklandi')
          } else {
            setProducts([])
          }
        } catch {
          setProducts([])
        }
      } else {
        setProducts([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
    if (currentView === 'stats') {
      fetchStats()
    }

    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Internet tiklandi!')
      syncOfflineOrders()
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast.warning('Internet uzildi. Oflayn rejimda ishlayapsiz.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [currentView, fetchProducts, fetchStats, syncOfflineOrders])

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

  // Calculate Subtotal and Dynamic Tax from Settings
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.qty, 0), [cart])
  const taxRate = settings.pricing?.taxEnabled ? (settings.pricing.taxRate || 0) : 0
  const tax = Math.round(subtotal * (taxRate / 100))
  const total = subtotal + tax
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.qty, 0), [cart])
  
  // Smart Recommendations
  const recommendedProducts = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0 || !Array.isArray(cart) || cart.length === 0) return []
    const cartCategories = new Set(cart.map(item => item.category))
    const needsDrinks = !cartCategories.has('drinks')
    const needsSides = !cartCategories.has('sides')
    
    return products.filter(p => {
      if (!p) return false
      if (cart.find(item => item._id === p._id)) return false
      if (needsDrinks && p.category === 'drinks') return true
      if (needsSides && p.category === 'sides') return true
      return false
    }).slice(0, 4)
  }, [cart, products])

  // Resilient Filtered Products
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return []
    const q = (searchQuery || '').trim().toLowerCase()
    return products.filter(p =>
      p &&
      (activeCategory === 'all' || p.category === activeCategory) &&
      (!q || (p.name || '').toLowerCase().includes(q))
    )
  }, [products, activeCategory, searchQuery])

  // CRUD Handlers
  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        ...product,
        unit: product.unit || 'dona',
        tag: product.tag || 'Standart'
      })
    } else {
      setEditingProduct(null)
      const firstCat = INITIAL_CATEGORIES.find(c => c.id !== 'all')?.id || 'second_courses'
      setFormData({
        name: '',
        price: '',
        category: firstCat,
        unit: 'porsiya',
        desc: '',
        tag: 'Standart',
        discount: ''
      })
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
        toast.success(t('update_success') || 'Mahsulot yangilandi')
      } else {
        await axios.post('/api/products', data)
        toast.success(t('added') || 'Mahsulot qo‘shildi')
      }
      fetchProducts()
      setIsModalOpen(false)
    } catch (err) {
      toast.error('Xatolik: ' + err.message)
    }
  }

  const executeDelete = async () => {
    if (!productToDelete) return
    try {
      await axios.delete(`/api/products/${productToDelete}`)
      fetchProducts()
      toast.success(t('update_success') || 'O‘chirildi')
      setShowConfirmModal(false)
      setProductToDelete(null)
    } catch (err) {
      toast.error('Xatolik: ' + err.message)
    }
  }

  const handleDeleteProduct = (id) => {
    setProductToDelete(id)
    setShowConfirmModal(true)
  }

  // Table Actions
  const handleSelectTable = (table) => {
    setSelectedTable(table)
    setOrderType('in_hall')
    toast.info(`Stol #${table.tableNumber} tanlandi. Endi taomlarni belgilang.`, { icon: '🪑' })
  }

  const handleAddTable = async (newTableData) => {
    try {
      await axios.post('/api/tables', newTableData)
      toast.success('Yangi stol qo‘shildi!')
      fetchTables()
    } catch (err) {
      toast.error('Xatolik: ' + (err.response?.data?.message || err.message))
    }
  }

  const handlePrintPreBill = async (table) => {
    try {
      await axios.post(`/api/tables/${table._id}/bill`)
      if (table.currentOrder) {
        setLastPlacedOrder(table.currentOrder)
      } else {
        setLastPlacedOrder({
          orderNumber: table.currentOrderNumber || `#ST-${table.tableNumber}`,
          tableNumber: table.tableNumber,
          items: [],
          total: table.currentTotal || 0,
          subtotal: table.currentTotal || 0,
          tax: 0,
          orderType: 'Zalda (Pre-chek)',
          paymentMethod: 'Hisob kutilmoqda'
        })
      }
      setTimeout(() => {
        window.print()
      }, 150)
      toast.info(`Stol #${table.tableNumber} uchun pre-chek chiqarildi`, { icon: '🧾' })
      fetchTables()
    } catch (err) {
      toast.error('Pre-chek chiqarishda xatolik: ' + err.message)
    }
  }

  const handleTransferTable = async (sourceId, targetId) => {
    try {
      const res = await axios.post(`/api/tables/${sourceId}/transfer`, { targetTableId: targetId })
      toast.success(res.data.message || 'Stol muvaffaqiyatli ko‘chirildi!', { icon: '🔄' })
      fetchTables()
      if (selectedTable && String(selectedTable._id) === String(sourceId)) {
        setSelectedTable(res.data.targetTable)
      }
    } catch (err) {
      toast.error('Stol ko‘chirishda xatolik: ' + (err.response?.data?.message || err.message))
    }
  }

  const handleCloseAndSettleTable = async (table, paymentMethod = 'Naqd') => {
    try {
      if (table.currentOrderId) {
        await axios.put(`/api/orders/${table.currentOrderId}/status`, { 
          status: 'Completed',
          paymentMethod: paymentMethod 
        })
        setLastPlacedOrder(table.currentOrder ? {
          ...table.currentOrder,
          paymentMethod: paymentMethod
        } : {
          orderNumber: table.currentOrderNumber,
          tableNumber: table.tableNumber,
          total: table.currentTotal,
          subtotal: table.currentTotal,
          tax: 0,
          orderType: 'Zalda',
          paymentMethod: paymentMethod
        })
        setTimeout(() => {
          window.print()
        }, 150)
      } else {
        await axios.post(`/api/tables/${table._id}/clear`)
      }
      toast.success(`Stol #${table.tableNumber} hisobi to‘landi (${paymentMethod}) va stol bo‘shatildi!`, { icon: '✅' })
      if (selectedTable && String(selectedTable._id) === String(table._id)) {
        setSelectedTable(null)
      }
      setTableForDetail(null)
      fetchTables()
      if (currentView === 'stats') fetchStats()
    } catch (err) {
      toast.error('Hisobni yopishda xatolik: ' + err.message)
    }
  }

  const handleForceClearTable = async (tableId) => {
    try {
      await axios.post(`/api/tables/${tableId}/clear`)
      toast.info('Stol bo‘shatildi')
      if (selectedTable && String(selectedTable._id) === String(tableId)) {
        setSelectedTable(null)
      }
      fetchTables()
    } catch (err) {
      toast.error('Xatolik: ' + err.message)
    }
  }

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return false

    // Senior Anti-Double-Submit Guard: Immediate synchronous lock
    if (orderLockRef.current) {
      console.warn('[Order Lock] Blocked concurrent duplicate order placement')
      return false
    }

    // REQUIRE TABLE SELECTION FOR DINE-IN ORDERS
    if (!isCustomerView && !isKiosk && orderType === 'in_hall' && !selectedTable) {
      toast.warning('Iltimos, buyurtma biriktirish uchun avval stolni tanlang!', { icon: '🪑' })
      setIsTableSelectorOpen(true)
      return false
    }

    orderLockRef.current = true
    setIsPlacingOrder(true)

    // Append items workflow if table is already occupied
    if (!isCustomerView && !isKiosk && orderType === 'in_hall' && selectedTable?.status === 'OCCUPIED' && selectedTable.currentOrderId) {
      try {
        const res = await axios.post(`/api/tables/${selectedTable._id}/append-items`, {
          items: cart.map(item => ({
            productId: item._id,
            name: item.name,
            price: item.price,
            qty: item.qty,
            unit: item.unit || 'dona',
            tag: item.tag || '',
            image: item.image
          }))
        })

        const updatedOrder = res.data.order
        const addedItems = res.data.addedItems || cart
        flushSync(() => {
          setLastPlacedOrder({
            ...updatedOrder,
            isAddon: true,
            addonItems: addedItems,
            tableNumber: selectedTable.tableNumber
          })
        })

        toast.success(`Stol #${selectedTable.tableNumber} ga qo‘shimcha taomlar muvaffaqiyatli qo‘shildi!`, { icon: '🚀' })
        setCart([])
        setSelectedTable(null)
        fetchTables()

        // Dine-In: Chek faqat mijoz ketayotganda kassada hisob yopilganda chiqadi!
        return updatedOrder
      } catch (err) {
        toast.error('Xatolik: ' + (err.response?.data?.message || err.message))
        return false
      } finally {
        setTimeout(() => {
          orderLockRef.current = false
          setIsPlacingOrder(false)
        }, 700)
      }
    }

    orderLockRef.current = true
    setIsPlacingOrder(true)

    // Reuse session idempotency key for this cart checkout
    if (!cartIdempotencyKeyRef.current) {
      cartIdempotencyKeyRef.current = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `ord_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    }
    const idempotencyKey = cartIdempotencyKeyRef.current

    const effectiveTableNumber = isCustomerView 
      ? tableParam 
      : (orderType === 'in_hall' ? (selectedTable?.tableNumber || null) : null)

    const orderData = {
      idempotencyKey,
      items: cart.map(item => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        qty: item.qty,
        unit: item.unit || 'dona',
        tag: item.tag || '',
        image: item.image
      })),
      subtotal,
      tax,
      total,
      orderType: isCustomerView ? 'Zalda' : (orderType === 'in_hall' ? 'Zalda' : orderType === 'takeaway' ? 'Olib ketish' : 'Yetkazib'),
      paymentMethod: paymentMethod === 'cash' ? 'Naqd' : paymentMethod === 'card' ? 'Karta' : 'QR',
      source: isCustomerView ? 'Customer' : (isKiosk ? 'Kiosk' : 'POS'),
      tableNumber: effectiveTableNumber,
      status: isCustomerView ? 'Pending' : 'Preparing'
    }

    try {
      if (!isOnline) {
        const offlineOrder = {
          ...orderData,
          orderNumber: `#OFF-${Date.now().toString().slice(-4)}`,
          createdAt: new Date().toISOString()
        }
        const queue = JSON.parse(localStorage.getItem('offline_orders') || '[]')
        if (!queue.some(o => o.idempotencyKey === idempotencyKey)) {
          queue.push(offlineOrder)
          localStorage.setItem('offline_orders', JSON.stringify(queue))
        }
        toast.info('Internet yo\'q. Buyurtma oflayn saqlandi va internet tiklanganda yuboriladi.', { icon: '💾' })
        cartIdempotencyKeyRef.current = null

        flushSync(() => {
          setLastPlacedOrder(offlineOrder)
        })
        setCart([])

        if (!isCustomerView && !isKiosk && orderType !== 'in_hall') {
          setTimeout(() => {
            window.print()
          }, 150)
        }
        return true
      }

      const res = await axios.post('/api/orders', orderData)
      const savedOrder = res.data

      // Senior State Synchronization: Flush state synchronously so receipt DOM is fully populated before printing
      flushSync(() => {
        setLastPlacedOrder(savedOrder)
      })

      toast.success(
        effectiveTableNumber 
          ? `Stol #${effectiveTableNumber} ga buyurtma biriktirildi!` 
          : (t('order_success') || 'Buyurtma qabul qilindi!'), 
        {
          icon: '🚀',
          style: { borderRadius: '12px', background: '#333', color: '#fff' }
        }
      )

      // Order successfully submitted: reset key and cart
      cartIdempotencyKeyRef.current = null
      setCart([])
      setSelectedTable(null)
      fetchTables()

      // Faqat tezkor kassada (Olib ketish / Yetkazib) darhol chek chiqadi.
      // Zaldagi stollar uchun chek FAQAT mijoz ketayotganda kassa hisobni yopgach chiqadi!
      if (!isCustomerView && !isKiosk && orderType !== 'in_hall') {
        setTimeout(() => {
          window.print()
        }, 150)
      }

      if (currentView === 'stats') fetchStats()
      return savedOrder || { _id: Date.now().toString().slice(-4) }
    } catch (err) {
      toast.error('Xatolik: ' + (err.response?.data?.message || err.message))
      return false
    } finally {
      // Debounced unlock to prevent rapid double-taps on touchscreens
      setTimeout(() => {
        orderLockRef.current = false
        setIsPlacingOrder(false)
      }, 700)
    }
  }

  const handleCompletePending = async (orderId) => {
    try {
      await axios.put(`/api/orders/${orderId}/status`, { status: 'Completed' })
      toast.success((t('order_success') || 'Buyurtma') + ' (Bajarildi)')
      setPendingOrders(prev => prev.filter(o => o._id !== orderId))
      if (currentView === 'stats') fetchStats()
    } catch (err) {
      toast.error('Xatolik: ' + err.message)
    }
  }

  return (
    <div className="pos-container">
      {(!isAuthenticated && !isCustomerView && !isKiosk && !isStatusScreen && !isKitchen) ? (
        <LoginView onLogin={handleLogin} />
      ) : (
        <>
          {(!isCustomerView && !isKiosk && !isStatusScreen && !isKitchen && isAuthenticated) && (
            <Sidebar 
              user={user} 
              onOpenSettings={() => setIsSettingsOpen(true)} 
            />
          )}

          <div className={`pos-layout-main ${isKiosk ? 'kiosk-layout' : isKitchen ? 'kitchen-layout' : isStatusScreen ? 'status-layout' : currentView === 'stats' ? 'stats-layout' : ''}`}>
            {!isKiosk && !isKitchen && !isStatusScreen && (
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
                isOnline={isOnline}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            )}

            <main className="pos-viewport">
              <Suspense fallback={<div style={{ padding: '60px', textAlign: 'center', color: 'var(--pos-text-dim)', fontWeight: 600 }}>Yuklanmoqda...</div>}>
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
                      filteredProducts={filteredProducts}
                      addToCart={addToCart}
                      updateQty={updateQty}
                      cart={cart}
                      selectedTable={selectedTable}
                      orderType={orderType}
                      setOrderType={setOrderType}
                      onSelectTable={handleSelectTable}
                      onOpenTableSelector={() => setIsTableSelectorOpen(true)}
                      onClearSelectedTable={() => setSelectedTable(null)}
                      onOpenTableDetail={(t) => setTableForDetail(t)}
                      onPrintPreBill={handlePrintPreBill}
                      tables={tables}
                      onAddTable={handleAddTable}
                      onRefreshTables={fetchTables}
                      isAdmin={user?.role === 'admin'}
                    />
                  }
                />
                <Route
                  path="/tables"
                  element={
                    <TablesPage
                      tables={tables}
                      onSelectTableForOrder={handleSelectTable}
                      onOpenTableDetail={(t) => setTableForDetail(t)}
                      onAddTable={handleAddTable}
                      onRefreshTables={fetchTables}
                      isAdmin={user?.role === 'admin'}
                    />
                  }
                />
                <Route
                  path="/kiosk"
                  element={
                    <KioskPage
                      activeCategory={activeCategory}
                      setActiveCategory={setActiveCategory}
                      INITIAL_CATEGORIES={INITIAL_CATEGORIES}
                      products={products}
                      loading={loading}
                      filteredProducts={filteredProducts}
                      addToCart={addToCart}
                      updateQty={updateQty}
                      cart={cart}
                      subtotal={subtotal}
                      tax={tax}
                      total={total}
                      clearCart={() => setCart([])}
                      handlePlaceOrder={handlePlaceOrder}
                      isPlacingOrder={isPlacingOrder}
                      recommendedProducts={recommendedProducts}
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
                          onRefresh={fetchStats}
                        />
                      }
                    />
                  </>
                )}
                <Route path="/kitchen" element={<KitchenPage />} />
                <Route path="/status" element={<StatusPage />} />
                <Route path="*" element={<PosPage
                  activeCategory={activeCategory}
                  setActiveCategory={setActiveCategory}
                  INITIAL_CATEGORIES={INITIAL_CATEGORIES}
                  products={products}
                  loading={loading}
                  filteredProducts={filteredProducts}
                  addToCart={addToCart}
                  updateQty={updateQty}
                  cart={cart}
                  selectedTable={selectedTable}
                  orderType={orderType}
                  setOrderType={setOrderType}
                  onSelectTable={handleSelectTable}
                  onOpenTableSelector={() => setIsTableSelectorOpen(true)}
                  onClearSelectedTable={() => setSelectedTable(null)}
                  onOpenTableDetail={(t) => setTableForDetail(t)}
                  onPrintPreBill={handlePrintPreBill}
                  tables={tables}
                  onAddTable={handleAddTable}
                  onRefreshTables={fetchTables}
                  isAdmin={user?.role === 'admin'}
                />} />
                </Routes>
              </Suspense>
            </main>
          </div>

          {currentView === 'pos' && !isKiosk && (
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
                isPlacingOrder={isPlacingOrder}
                setShowMobileCart={setShowMobileCart}
                isCustomerView={isCustomerView}
                recommendedProducts={recommendedProducts}
                addToCart={addToCart}
                selectedTable={selectedTable}
                onOpenTableSelector={() => setIsTableSelectorOpen(true)}
                onClearSelectedTable={() => setSelectedTable(null)}
              />
            </div>
          )}

          {!isCustomerView && !isKiosk && <BottomNav />}
        </>
      )}

      {/* Hidden Receipt for Thermal Printing */}
      <div className="print-only">
        <Receipt
          order={lastPlacedOrder}
          cart={lastPlacedOrder?.items || cart}
          total={lastPlacedOrder ? lastPlacedOrder.total : total}
          subtotal={lastPlacedOrder ? lastPlacedOrder.subtotal : subtotal}
          tax={lastPlacedOrder ? lastPlacedOrder.tax : tax}
          orderType={lastPlacedOrder?.orderType || orderType}
          paymentMethod={lastPlacedOrder?.paymentMethod || paymentMethod}
          user={user}
          orderNumber={lastPlacedOrder?.orderNumber}
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

      {/* Admin White-Label Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Dine-In Table Floor Plan / Selection Modal */}
      <TableSelectorModal
        isOpen={isTableSelectorOpen}
        onClose={() => setIsTableSelectorOpen(false)}
        tables={tables}
        selectedTable={selectedTable}
        onSelectTable={handleSelectTable}
        onOpenTableDetail={(t) => {
          setIsTableSelectorOpen(false)
          setTableForDetail(t)
        }}
        onAddTable={handleAddTable}
        isAdmin={user?.role === 'admin'}
      />

      {/* Active Table Details, Move & Settle Modal */}
      <TableDetailModal
        table={tableForDetail}
        isOpen={!!tableForDetail}
        onClose={() => setTableForDetail(null)}
        allTables={tables}
        onAppendItemsToTable={(t) => {
          setSelectedTable(t)
          setOrderType('in_hall')
          setTableForDetail(null)
          toast.info(`Stol #${t.tableNumber} ga qo‘shimcha taomlar qo‘shish rejimi faollashdi`, { icon: '🍽️' })
        }}
        onPrintPreBill={handlePrintPreBill}
        onTransferTable={handleTransferTable}
        onCloseAndSettleTable={handleCloseAndSettleTable}
        onForceClearTable={handleForceClearTable}
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
        position="bottom-right"
        autoClose={2500}
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
