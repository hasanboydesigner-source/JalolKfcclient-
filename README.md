# Modern Restaurant POS, KDS & Self-Service Platform (White-Label)

A fast, resilient, production-grade food-service operations platform featuring a Point of Sale (POS) cashier terminal, Kitchen Display System (KDS), Customer Order Status Screen, Self-Service Kiosk, and Admin Analytics.

---

## 🚀 Quick Start (Local Setup in Under 10 Minutes)

### Prerequisites
- **Node.js**: v18+ or v20+
- **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017/restaurant_pos`) or MongoDB Atlas URI

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd JalolKfc
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your database URI and secrets:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/restaurant_pos
JWT_SECRET=super_secure_random_key_min_32_characters_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### 3. Run Development Server
```bash
npm run dev
```
- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000`

Default initial PINs:
- **Administrator**: `2024`
- **Cashier**: `1111`

### 4. Run Tests & Lint
```bash
npm test       # Run Vitest test suite
npm run lint   # Run ESLint validation
npm run build  # Production build verification
```

---

## 🎨 How to Rebrand for a New Restaurant in Under 5 Minutes (Zero Code Changes)

The platform is 100% white-label. Any restaurant owner or manager can customize the entire system from the **Admin Settings UI**:

1. Log in with the Administrator PIN (`2024`).
2. Click **Sozlamalar (Settings)** in the sidebar or header.
3. Customize any section:
   - **Biznes Profili**: Enter your restaurant's name, phone, address, and upload your custom logo.
   - **Brend va Ko‘rinish**: Choose your Primary and Accent brand colors using the live color picker. The entire interface, buttons, and KDS tickets re-theme instantly.
   - **Til va Valyuta**: Choose your default language (Uzbek, Russian, or English) and currency symbol (`so'm`, `$`, `₽`, `€`).
   - **Narxlar va Soliq**: Set your tax rate (QQS %) or disable taxes with one toggle.
   - **Chek va Printer**: Select your thermal paper width (`80mm` or `58mm`), add custom footer greetings, and click **Test chekini chiqarish**.
   - **Telegram va Xabarlar**: Enter your Telegram Bot Token and Chat ID to receive instant order alerts with meal photos. Click **Telegramga test xabarini yuborish** to verify.
   - **Tizim va Zaxira**: Click **Sozlamalarni eksport qilish** to back up your setup as a portable JSON file.
4. Click **Saqlash**.
5. **Live Apply**: All open terminals (cashiers, kiosks, kitchen screens, order status displays) immediately update their theme, title, currency, and branding **in real-time without reloading**.

---

## 📱 Application Screens & Routes

- `/` — **POS Cashier Terminal**: Fast product catalog, smart cart, dynamic tax calculation, and thermal receipt printing.
- `/kiosk` — **Customer Self-Service Kiosk**: Touch-friendly ordering with dining choice ("Shu yerda" vs "Olib ketish"), upsell recommendations, and auto-idle reset.
- `/kitchen` — **Kitchen Display System (KDS)**: Real-time ticket management with sound chimes, Uzbek voice announcements, and preparation timers.
- `/status` — **Order Status Display**: Big-screen customer pickup display ("Tayyorlanmoqda" and "Marhamat, tayyor!").
- `/admin` — **Product Management**: Menu creation with Cloudinary image upload and background-removal.
- `/stats` — **Analytics Dashboard**: Timezone-accurate daily/weekly revenue charts, peak hours distribution, and bestsellers.

---

## 🔒 Security & Reliability Architecture

- **Passcode Hashing**: Stored with `bcryptjs` (salt rounds: 10), legacy auto-upgrade on login.
- **Backend Authorization**: Protected with JWT middleware (`requireAuth`, `requireRole(['admin'])`).
- **NoSQL Injection Defense**: Strict schema parsing with Zod on authentication and order inputs.
- **Server Price Calculation**: Totals are strictly computed on the backend from verified database prices; client price tampering is impossible.
- **Idempotent Offline Sync**: Offline orders receive a UUID `idempotencyKey` to prevent duplicate orders upon network reconnect.
- **Atomic Daily Order Numbering**: Sequential order numbering (`#001`, `#002`, ...) reset daily at midnight in the business's timezone.
