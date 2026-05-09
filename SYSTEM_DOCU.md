# WRS-DMS — Water Refilling Station Delivery Management System

> **Final Documentation v2.0** · Confidential — AI Copilot Implementation Reference

A single-station water refilling delivery management system built on the MERN stack with real-time GPS tracking via Socket.IO and an integrated Walk-In POS.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure — Backend](#3-folder-structure--backend)
4. [Folder Structure — Frontend](#4-folder-structure--frontend)
5. [Database Schema](#5-database-schema)
6. [API Routes Reference](#6-api-routes-reference)
7. [Role Permission Matrix](#7-role-permission-matrix)
8. [Key Middleware](#8-key-middleware)
9. [Walk-In POS Business Logic](#9-walk-in-pos-business-logic)
10. [Map & Real-Time GPS Tracking](#10-map--real-time-gps-tracking)
11. [Environment Variables](#11-environment-variables)
12. [Business Logic Notes](#12-business-logic-notes)
13. [Recommended Build Order](#13-recommended-build-order)
14. [UI Design Prompts (Lovable AI)](#14-ui-design-prompts--lovable-ai)

---

## 1. System Overview

### Quick Reference

| Property | Value |
|----------|-------|
| Version  | 2.0.0 — Final |
| Roles    | Admin (Owner) · Staff (Dispatcher) · Driver |
| New in v2 | Walk-in POS, Live map tracking, Socket.IO GPS broadcast, Role UI design prompts |
| Status   | Ready for AI Copilot implementation |

### 1.1 Purpose

- Inventory management for water jug products (slim, round, gallon)
- **Walk-in sales (POS)** — staff process customers at the physical store
- Delivery order scheduling and dispatching to drivers
- **Live GPS tracking** of drivers via Socket.IO — visible to admin and staff
- Route map for drivers showing today's delivery stops
- Driver trip and gas expense management
- Admin reports: revenue, expenses, jug accountability, delivery stats

### 1.2 User Roles

| Role   | Access      | Key Capabilities |
|--------|-------------|------------------|
| Admin  | Full        | All CRUD, reports, user management, live map (all drivers), walk-in revenue view |
| Staff  | Operational | Walk-in POS, dispatch orders, create trips, live map, inventory restock |
| Driver | Limited     | View own assigned orders, route map, mark delivered, upload proof photo, log gas expenses, broadcast GPS |

---

## 2. Tech Stack

| Layer        | Technology                      | Purpose |
|--------------|---------------------------------|---------|
| Frontend     | React.js + Vite                 | Admin dashboard, staff dispatcher view, driver PWA |
| UI Library   | Tailwind CSS + shadcn/ui        | Styling, components, dark mode |
| HTTP Client  | Axios                           | REST API calls with JWT auth header |
| Real-time    | Socket.IO (client)              | Receive live driver GPS on admin/staff map views |
| Maps         | React Leaflet + OpenStreetMap   | Free map tiles, driver pins, stop markers, route polylines |
| State        | React Context + React Query     | Auth state, server data caching |
| Backend      | Node.js + Express.js            | REST API, middleware, business logic |
| Real-time    | Socket.IO (server)              | Receive driver GPS, broadcast to admin/staff rooms |
| Database     | MongoDB + Mongoose              | All data persistence and schema validation |
| Auth         | JWT + bcrypt                    | Stateless auth, password hashing |
| File Storage | Cloudinary                      | Proof of delivery photos, gas receipt uploads |
| Geolocation  | Browser Geolocation API         | Driver PWA calls `watchPosition()` to stream GPS |
| Validation   | express-validator               | Server-side input validation on all routes |

---

## 3. Folder Structure — Backend

MVC pattern with a service layer. Socket.IO runs alongside Express on the same Node process.

```
server/
├── config/
│   ├── db.js                    # MongoDB connection
│   └── cloudinary.js            # Cloudinary SDK config
├── middleware/
│   ├── authMiddleware.js         # Verify JWT, attach req.user
│   ├── roleGuard.js             # allowRoles(...roles) guard
│   └── errorHandler.js          # Global error handler
├── models/
│   ├── User.js                  # Admin, Staff, Driver accounts
│   ├── Product.js               # Water jug types & stock
│   ├── Customer.js              # Customer profiles & jug balance
│   ├── Driver.js                # Driver profile & vehicle
│   ├── Order.js                 # Delivery orders (with lat/lng)
│   ├── Trip.js                  # Groups orders into a driver trip
│   ├── GasExpense.js            # Fuel expense per trip
│   ├── WalkInSale.js            # Walk-in / POS transactions
│   └── DriverLocation.js        # Live GPS position per driver
├── controllers/
│   ├── authController.js
│   ├── userController.js        # Admin only
│   ├── productController.js
│   ├── customerController.js
│   ├── orderController.js
│   ├── driverController.js
│   ├── tripController.js
│   ├── expenseController.js
│   ├── walkInController.js      # Walk-in POS logic
│   └── locationController.js    # GET latest driver locations
├── routes/
│   ├── authRoutes.js            # /api/auth
│   ├── userRoutes.js            # /api/users
│   ├── productRoutes.js         # /api/products
│   ├── customerRoutes.js        # /api/customers
│   ├── orderRoutes.js           # /api/orders
│   ├── driverRoutes.js          # /api/drivers
│   ├── tripRoutes.js            # /api/trips
│   ├── expenseRoutes.js         # /api/expenses
│   ├── walkInRoutes.js          # /api/walkin
│   └── locationRoutes.js        # /api/drivers/locations
├── services/
│   ├── orderService.js          # Jug balance, stock deduction
│   ├── walkInService.js         # POS stock deduction logic
│   ├── reportService.js         # Revenue, expense aggregates
│   └── uploadService.js         # Cloudinary helpers
├── socket/
│   └── socketHandler.js         # Socket.IO event handlers
├── utils/
│   ├── generateToken.js
│   ├── apiResponse.js
│   └── validators.js
├── .env
├── .env.example
├── package.json
└── server.js                    # Express + Socket.IO entry point
```

### 3.1 server.js — Entry Point

```js
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { socketHandler } from './socket/socketHandler.js';

dotenv.config(); connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL } });

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers',customerRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/drivers',  driverRoutes);
app.use('/api/trips',    tripRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/walkin',   walkInRoutes);

socketHandler(io);   // register all socket events
app.use(errorHandler);
httpServer.listen(process.env.PORT || 5000);
```

### 3.2 socket/socketHandler.js

```js
export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    socket.on('driver:join',  (driverId) => socket.join('driver-' + driverId));
    socket.on('admin:join',   ()          => socket.join('admin-room'));

    socket.on('driver:location', async ({ driverId, lat, lng }) => {
      await DriverLocation.findOneAndUpdate(
        { driver: driverId },
        { lat, lng, updatedAt: new Date() },
        { upsert: true }
      );
      io.to('admin-room').emit('location:update', { driverId, lat, lng });
    });
  });
};
```

---

## 4. Folder Structure — Frontend

```
client/src/
├── api/
│   ├── axios.js              # Base Axios instance with JWT header
│   ├── authApi.js
│   ├── productApi.js
│   ├── customerApi.js
│   ├── orderApi.js
│   ├── driverApi.js
│   ├── tripApi.js
│   ├── expenseApi.js
│   └── walkInApi.js
├── components/
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── Navbar.jsx
│   │   └── ProtectedRoute.jsx
│   ├── map/
│   │   ├── LiveMap.jsx          # Leaflet map (admin/staff)
│   │   ├── DriverRouteMap.jsx   # Driver's own route (PWA)
│   │   ├── DriverMarker.jsx     # Custom pin for driver
│   │   └── StopMarker.jsx       # Customer stop pin
│   ├── pos/
│   │   ├── POSCart.jsx          # Walk-in cart component
│   │   └── POSProductGrid.jsx   # Product quick-select buttons
│   └── ui/                      # Shared: Button, Modal, Table, Badge
├── context/
│   └── AuthContext.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useSocket.js             # Connect to Socket.IO, receive GPS events
│   ├── useDriverLocations.js    # Maintain live driver location state
│   ├── useOrders.js
│   ├── useProducts.js
│   ├── useCustomers.js
│   └── useDrivers.js
├── pages/
│   ├── auth/LoginPage.jsx
│   ├── dashboard/DashboardPage.jsx
│   ├── products/ProductsPage.jsx
│   ├── customers/CustomersPage.jsx
│   ├── customers/CustomerDetail.jsx
│   ├── orders/OrdersPage.jsx
│   ├── orders/OrderDetail.jsx
│   ├── orders/CreateOrderForm.jsx
│   ├── drivers/DriversPage.jsx
│   ├── trips/TripsPage.jsx
│   ├── expenses/ExpensesPage.jsx
│   ├── walkin/WalkInPage.jsx        # POS screen (staff daily driver)
│   ├── map/LiveMapPage.jsx          # Full map view (admin + staff)
│   ├── reports/ReportsPage.jsx
│   └── users/UserManagementPage.jsx
├── utils/
│   ├── formatCurrency.js
│   ├── formatDate.js
│   └── roleCheck.js
├── App.jsx
├── main.jsx
└── index.css
```

---

## 5. Database Schema

All models use `{ timestamps: true }`. **9 collections total.**

### 5.1 User
```
{ name, email, passwordHash, role: enum[admin|staff|driver], isActive }
```

### 5.2 Product
```
{ name, type: enum[slim|round|gallon], pricePerUnit, stockQty, containerDeposit, isActive }
```

### 5.3 Customer
```
{ name, phone, addresses:[{label,street,barangay,city}], jugBalance, totalOrders, notes }
```

### 5.4 Driver
```
{ userId->User, licenseNo, vehicleType, plateNo, status: enum[available|on-trip|off] }
```

### 5.5 Order (delivery)
```
{
  customer->Customer, driver->Driver,
  items:[{ product->Product, qty, price }],
  jugsOut, jugsReturned, totalAmount,
  paymentStatus: enum[paid|unpaid|partial],
  status: enum[pending|dispatched|delivered|cancelled],
  deliveryAddress, deliveryLat, deliveryLng,
  scheduledAt, deliveredAt, proofPhoto, notes
}
```

### 5.6 Trip
```
{ driver->Driver, orders:[->Order], startTime, endTime, kmTraveled, status: enum[ongoing|completed], notes }
```

### 5.7 GasExpense
```
{ driver->Driver, trip->Trip, date, liters, pricePerLiter, totalCost, receiptPhoto, notes }
```

### 5.8 WalkInSale *(NEW in v2)*

Handles over-the-counter purchases at the physical store. Processed by staff.

```js
const WalkInSaleSchema = new Schema({
  servedBy:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  customer:      { type: Schema.Types.ObjectId, ref: 'Customer' }, // optional
  customerName:  { type: String },  // for unregistered walk-ins
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    qty:     { type: Number, required: true },
    price:   { type: Number, required: true },
  }],
  jugsReturned:   { type: Number, default: 0 },
  totalAmount:    { type: Number, required: true },
  paymentMethod:  { type: String, enum: ['cash','gcash','maya'], default: 'cash' },
  amountTendered: { type: Number },
  change:         { type: Number },
  receiptNo:      { type: String },
}, { timestamps: true });
```

### 5.9 DriverLocation *(NEW in v2)*

Updated every 10 seconds via Socket.IO. One document per driver, upserted.

```js
const DriverLocationSchema = new Schema({
  driver:    { type: Schema.Types.ObjectId, ref: 'Driver', unique: true },
  lat:       { type: Number, required: true },
  lng:       { type: Number, required: true },
  heading:   { type: Number },  // compass bearing 0-360
  updatedAt: { type: Date, default: Date.now },
});
```

---

## 6. API Routes Reference

All routes prefixed with `/api`. Protected routes require: `Authorization: Bearer <token>`

### 6.1 Auth — `/api/auth`

| Method | Endpoint         | Access    | Description |
|--------|------------------|-----------|-------------|
| POST   | /api/auth/login  | Public    | Login, returns JWT token |
| GET    | /api/auth/me     | Protected | Get current user info |

### 6.2 Products — `/api/products`

| Method | Endpoint            | Access | Description |
|--------|---------------------|--------|-------------|
| GET    | /api/products       | Staff+ | List all products with stock |
| POST   | /api/products       | Admin  | Create product |
| PUT    | /api/products/:id   | Admin  | Update product or stock qty |
| DELETE | /api/products/:id   | Admin  | Soft delete (isActive=false) |

### 6.3 Customers — `/api/customers`

| Method | Endpoint              | Access | Description |
|--------|-----------------------|--------|-------------|
| GET    | /api/customers        | Staff+ | List all with jug balances |
| GET    | /api/customers/:id    | Staff+ | Customer detail + order history |
| POST   | /api/customers        | Staff+ | Register new customer |
| PUT    | /api/customers/:id    | Staff+ | Update customer info |
| DELETE | /api/customers/:id    | Admin  | Remove customer |

### 6.4 Orders — `/api/orders`

| Method | Endpoint                   | Access        | Description |
|--------|----------------------------|---------------|-------------|
| GET    | /api/orders                | Staff+        | List all orders (filter by status/date/driver) |
| GET    | /api/orders/my             | Driver        | Driver's own assigned orders |
| GET    | /api/orders/:id            | Staff+        | Single order detail |
| POST   | /api/orders                | Staff+        | Create delivery order |
| PUT    | /api/orders/:id/status     | Staff+/Driver | Update status |
| PUT    | /api/orders/:id/proof      | Driver        | Upload proof of delivery photo |
| DELETE | /api/orders/:id            | Admin         | Cancel/delete order |

### 6.5 Drivers — `/api/drivers`

| Method | Endpoint                    | Access | Description |
|--------|-----------------------------|--------|-------------|
| GET    | /api/drivers                | Staff+ | List all drivers with status |
| GET    | /api/drivers/:id/trips      | Staff+ | Trip history for driver |
| GET    | /api/drivers/locations      | Staff+ | Latest GPS of all active drivers (REST fallback) |
| POST   | /api/drivers                | Admin  | Create driver profile |
| PUT    | /api/drivers/:id            | Admin  | Update driver info |

### 6.6 Trips — `/api/trips`

| Method | Endpoint                  | Access        | Description |
|--------|---------------------------|---------------|-------------|
| GET    | /api/trips                | Staff+        | List trips (filterable by driver/date) |
| GET    | /api/trips/:id            | Staff+        | Trip detail with all orders |
| POST   | /api/trips                | Staff+        | Create trip, assign orders to driver |
| PUT    | /api/trips/:id/complete   | Driver/Staff  | Mark complete, log km |

### 6.7 Gas Expenses — `/api/expenses`

| Method | Endpoint              | Access        | Description |
|--------|-----------------------|---------------|-------------|
| GET    | /api/expenses         | Staff+        | List all expenses (filter by driver/date) |
| GET    | /api/expenses/report  | Admin         | Aggregate fuel cost report |
| POST   | /api/expenses         | Driver/Staff  | Log gas expense with optional photo |
| PUT    | /api/expenses/:id     | Admin         | Edit expense record |
| DELETE | /api/expenses/:id     | Admin         | Delete expense |

### 6.8 Walk-In Sales — `/api/walkin` *(NEW in v2)*

| Method | Endpoint           | Access | Description |
|--------|--------------------|--------|-------------|
| GET    | /api/walkin        | Staff+ | List walk-in transactions (filter by date/staff) |
| GET    | /api/walkin/today  | Staff+ | Today's walk-in sales summary + total revenue |
| POST   | /api/walkin        | Staff  | Process new walk-in sale. Deducts stock, records transaction. |
| GET    | /api/walkin/:id    | Staff+ | Single sale receipt detail |
| DELETE | /api/walkin/:id    | Admin  | Void/delete a sale (with reason) |

---

## 7. Role Permission Matrix

| Action                          | Admin  | Staff       | Driver    |
|---------------------------------|--------|-------------|-----------|
| Manage users & roles            | ✅ Yes | ❌ No       | ❌ No     |
| Process walk-in POS sale        | ✅ Yes | ✅ Yes      | ❌ No     |
| View walk-in sales history      | ✅ Yes | ✅ Yes      | ❌ No     |
| CRUD products / inventory       | ✅ Yes | Restock only| ❌ No     |
| Create / manage customers       | ✅ Yes | ✅ Yes      | ❌ No     |
| Create / assign delivery orders | ✅ Yes | ✅ Yes      | ❌ No     |
| View own assigned orders        | ✅ Yes | ✅ Yes      | Own only  |
| Update delivery status          | ✅ Yes | ✅ Yes      | Own only  |
| Upload proof of delivery        | ✅ Yes | ✅ Yes      | Own only  |
| View live map (all drivers)     | ✅ Yes | ✅ Yes      | ❌ No     |
| View own route map              | ✅ Yes | ✅ Yes      | ✅ Yes    |
| Broadcast GPS location          | ❌ No  | ❌ No       | ✅ Yes    |
| Log gas expenses                | ✅ Yes | View only   | Own only  |
| View expense reports            | ✅ Yes | ✅ Yes      | ❌ No     |
| Delete any record               | ✅ Yes | ❌ No       | ❌ No     |

---

## 8. Key Middleware

### 8.1 authMiddleware.js

```js
export const protect = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Not authorized' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-passwordHash');
    next();
  } catch { return res.status(401).json({ message: 'Token invalid or expired' }); }
};
```

### 8.2 roleGuard.js

```js
export const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'Access denied' });
  next();
};

// Usage:
router.delete('/:id', protect, allowRoles('admin'), handler);
```

---

## 9. Walk-In POS Business Logic

Walk-in sales are the **most frequent daily transaction** for staff. Target: product selection to receipt in under **30 seconds**.

### 9.1 POS Screen Flow

1. Staff opens Walk-In page → product grid auto-loads
2. Staff taps product button → qty selector, added to cart
3. Staff inputs jugs returned by customer (updates `customer.jugBalance`)
4. Staff selects registered customer from dropdown (optional)
5. Staff selects payment method (Cash / GCash / Maya) and amount tendered
6. System auto-calculates change. Staff confirms sale.
7. `POST /api/walkin` → server deducts stock, creates `WalkInSale` record, returns receipt
8. Receipt modal: items, total, change, receipt number. Can reprint.

### 9.2 Stock Rules for Walk-In

| Event | Action |
|-------|--------|
| Sale processed (`POST /api/walkin`) | Deduct `product.stockQty` immediately |
| Insufficient stock | Return `400: 'Insufficient stock for [product name]'` |
| Sale voided (`DELETE /api/walkin/:id`) | Restore stock qty |
| Customer returns jugs | Decrement `customer.jugBalance` by `jugsReturned` |

### 9.3 Receipt Number Format

```
WI-YYYYMMDD-XXXX
```
Where `XXXX` is a zero-padded daily sequence.  
**Example:** `WI-20240915-0042` = 42nd walk-in sale on Sept 15, 2024.

---

## 10. Map & Real-Time GPS Tracking

Live location tracking uses **Socket.IO** for real-time GPS broadcast. **React Leaflet** renders the map with OpenStreetMap tiles (free, no API key required).

### 10.1 How GPS Broadcast Works

```
Driver PWA
  └─ navigator.geolocation.watchPosition() (on trip start)
  └─ emit 'driver:location' { driverId, lat, lng }  every 10s
        ↓
socketHandler.js
  └─ upsert DriverLocation collection
  └─ emit 'location:update' → admin-room
        ↓
Admin/Staff Map
  └─ useSocket.js hook subscribes to admin-room
  └─ useDriverLocations.js maintains Map<driverId, {lat,lng}>
  └─ LiveMap.jsx re-renders driver markers on each event
        ↓
Trip complete
  └─ driver stops watchPosition(), emits 'driver:offline'
```

### 10.2 Map Features by Role

| Feature                   | Admin              | Staff              |
|---------------------------|--------------------|--------------------|
| Live driver pin           | ✅ All drivers     | ✅ All drivers     |
| Driver info on click      | Name, plate, trip  | Status only        |
| Customer stop pins        | All active orders  | Active trips only  |
| Route polyline            | All trips          | View only          |
| Historical replay         | ✅ Per trip        | ❌ No              |

### 10.3 Driver Route Map (PWA)

- Numbered stop markers (1, 2, 3...) for today's deliveries
- **Next undelivered stop** → blue, pulsing ring
- **Completed stops** → green checkmark
- Tap marker → bottom sheet: customer name + address + **Open in Google Maps** button
  - Link format: `https://maps.google.com/?q={lat},{lng}`
- Driver does **NOT** see other drivers on the map

### 10.4 Frontend Packages

```bash
npm install react-leaflet leaflet socket.io-client
```

```js
// index.css
import 'leaflet/dist/leaflet.css';

// App.jsx — fix Leaflet default icon path
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
});
```

---

## 11. Environment Variables

### 11.1 Backend (`server/.env`)

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/wrs-dms
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

NODE_ENV=development
```

### 11.2 Frontend (`client/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

---

## 12. Business Logic Notes

### 12.1 Jug Accountability

- **Delivery:** `jugsOut` = total containers sent. On delivery: `customer.jugBalance += (jugsOut - jugsReturned)`
- **Walk-in:** if customer returns empty jugs → decrement `customer.jugBalance` by `jugsReturned`
- `containerDeposit` is charged per jug if customer has no empty jugs to exchange

### 12.2 Stock Deduction

- **Delivery order:** deduct stock when order is *dispatched*, restore on *cancel*
- **Walk-in:** deduct stock immediately on `POST /api/walkin`, restore on void
- Alert admin when `stockQty` falls below `10` (configurable threshold)

### 12.3 Order Status Flow

```
pending → dispatched → delivered
                     ↘ cancelled  (at any point before delivery)
```

### 12.4 Gas Expense

> ⚠️ Always compute `totalCost` **server-side**: `totalCost = liters * pricePerLiter`  
> Never trust client-submitted `totalCost`.

### 12.5 Driver Status

- Set `on-trip` when a trip is created
- Set `available` when trip is marked complete
- A driver with status `on-trip` **must not** be assignable to another concurrent trip

---

## 13. Recommended Build Order

### Phase 1 — Auth & Foundation
- **Backend:** scaffold Express, Mongoose, JWT auth, `User` model, `authMiddleware`, `roleGuard`
- **Frontend:** Vite + React + Tailwind, `LoginPage`, `AuthContext`, `ProtectedRoute`, `App.jsx` routing

### Phase 2 — Core Operations
- `Product` model + CRUD routes + `ProductsPage`
- `Customer` model + CRUD routes + `CustomersPage` + `CustomerDetail`
- `WalkInSale` model + `/api/walkin` routes + `WalkInPage` (POS) — **build early, staff daily feature**

### Phase 3 — Delivery
- `Order` model + routes + `OrdersPage` + `CreateOrderForm`
- `Driver` model + routes + `DriversPage`
- `Trip` model + routes + `TripsPage`

### Phase 4 — Real-time Map
- Install `socket.io` on backend + `socketHandler.js`
- Install `react-leaflet` + `socket.io-client` on frontend
- `DriverLocation` model + `/api/drivers/locations` endpoint
- Add `deliveryLat`/`deliveryLng` to `Order` model and `CreateOrderForm`
- Build `LiveMap.jsx` (admin/staff), `DriverRouteMap.jsx` (driver PWA)
- `useSocket.js` + `useDriverLocations.js` hooks

### Phase 5 — Expenses & Reports
- `GasExpense` model + routes + `ExpensesPage`
- Cloudinary integration for photo uploads
- `ReportsPage`: revenue, gas, deliveries, jug accountability, walk-in sales tabs

### Phase 6 — Polish
- `UserManagementPage` (admin only)
- Dashboard stat cards + charts
- Low stock alerts, role-based UI guards, form validation
- End-to-end test all flows with Postman + browser

---

## 14. UI Design Prompts — Lovable AI

> Paste each prompt into [Lovable.dev](https://lovable.dev) to generate the interface for that role.  
> All prompts target: **React.js + Tailwind CSS + shadcn/ui**

### Design System (shared across all roles)

| Token      | Value |
|------------|-------|
| Primary    | `#1D4ED8` (blue) |
| Background | `#F9FAFB` (light gray) |
| Sidebar    | `#111827` (dark navy) |
| Border     | `1px`, neutral grays |
| Radius     | 8px default, 12px cards |
| Font       | Inter or DM Sans — 600 headings, 400 body |
| Currency   | PHP comma-separated, e.g. `PHP 1,250.00` |
| Sample data| Filipino names, Philippine addresses (barangay, city) |
| Icons      | Lucide React |
| Charts     | Recharts |
| Maps       | React Leaflet + OpenStreetMap |

---

### 14.1 Admin Interface

**Layout:** Fixed left sidebar (240px) + main content. Top navbar with breadcrumb, notifications bell, user avatar dropdown.

**Sidebar nav:** Dashboard · Walk-In Sales · Orders · Customers · Products · Drivers · Trips · Live Map · Gas Expenses · Reports · User Management

**Key pages:**
- **Dashboard** — 5 stat cards (Orders Today, Walk-In Revenue, Active Drivers, Pending Deliveries, Low Stock). Recent orders table + driver availability panel. Bar chart (deliveries/day) + line chart (daily revenue).
- **Walk-In Sales** — table with receipt no, date/time, customer, items, total, payment method, served by. Summary cards (today's revenue, # transactions, top product). Slide-over for receipt detail.
- **Orders** — full table with status pills (Pending=amber, Dispatched=blue, Delivered=green, Cancelled=red). Slide-over for detail + edit.
- **Live Map** — full-page Leaflet. Driver pins with avatar initials + status ring. Stop markers numbered per trip. Route polylines colored per driver. Collapsible right panel listing active drivers.
- **Reports** — tab switcher: Revenue | Walk-In Sales | Deliveries | Gas Expenses | Jug Accountability.

---

### 14.2 Staff (Dispatcher) Interface

**Layout:** Desktop-first (1024px+). Same design system as admin but action-dense.

**Sidebar nav:** Walk-In POS (default landing) · Dispatch Board · Orders · Trips · Customers · Inventory · Live Map

**Key pages:**
- **Walk-In POS (default)** — split layout: LEFT 60% product grid (large tap-friendly cards), RIGHT 40% cart + checkout. Customer selector (optional). Jugs returned stepper. Payment toggle (Cash / GCash / Maya). Change auto-calculated. PROCESS SALE button full-width blue. Receipt modal with reprint.
- **Dispatch Board** — LEFT: Pending Orders Queue (sorted by scheduled time). RIGHT: Driver Board (status, orders count). Create Order + Create Trip buttons.
- **Create Trip Modal** — driver dropdown (available only), order checklist, trip start time.

> Admin-only actions shown as **disabled** with tooltip "Admin access required" — never hidden.

---

### 14.3 Driver Mobile PWA

**Layout:** Mobile-first, 390px width (iPhone 14). No sidebar. Bottom tab bar (max 4 tabs). Minimum 48px tap targets.

**Bottom tabs:** Deliveries · My Route · Log Expense · Profile

**Key screens:**
- **Deliveries** — vertical stop cards with stop number circle, customer name, address, products, status badge. Full-width green "Mark Delivered" button. Confirmation bottom sheet before marking.
- **Delivery Detail** — customer name + phone (tappable → dialer). Address tappable → Google Maps. Payment status toggles. Jugs returned stepper. Proof photo upload. Large "Mark as Delivered" button.
- **My Route** — full-screen Leaflet map. Driver's GPS = blue pulsing dot. Numbered stop markers (next=blue, completed=green). Tap marker → bottom sheet with "Open in Google Maps".
- **Log Expense** — large inputs for liters + price/L. Total auto-calculated. Receipt photo upload. Save button full-width blue.

> GPS `watchPosition()` starts automatically when driver sets status to **On Trip**.

---

*End of Documentation · WRS-DMS v2.0 · MERN + Socket.IO + React Leaflet*
