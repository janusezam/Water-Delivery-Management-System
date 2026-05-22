import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPass from './pages/Auth/ForgotPass';
import ResetPass from './pages/Auth/ResetPass';
import VerifyOTP from './pages/Auth/VerifyOTP';
import AdminLogin from './pages/Auth/AdminLogin';
import AdminDashboard from './pages/Dashboards/AdminDashboard';
import StaffDashboard from './pages/Dashboards/StaffDashboard';
import DriverDashboard from './pages/Dashboards/DriverDashboard';
import UserDashboard from './pages/Dashboards/UserDashboard';
import DeliveryHistory from './pages/Dashboards/DeliveryHistory';
import ProductsPage from './pages/Products/ProductsPage';
import CustomersPage from './pages/Customers/CustomersPage';
import WalkInPage from './pages/WalkIn/WalkInPage';
import DriversPage from './pages/Drivers/DriversPage';
import OrdersPage from './pages/Orders/OrdersPage';
import ExpensesPage from './pages/Expenses/ExpensesPage';
import ReportsPage from './pages/Reports/ReportsPage';
import UsersPage from './pages/Users/UsersPage';
import LiveMapPage from './pages/Map/LiveMapPage';
import DriverRoutePage from './pages/Drivers/DriverRoutePage';
import CartPage from './pages/Cart/CartPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPass />} />
        <Route path="/reset-password" element={<ResetPass />} />
        <Route path="/verify-activation" element={<VerifyOTP />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Dashboards */}
        <Route path="/dashboard/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/staff" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <StaffDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/driver" element={
          <ProtectedRoute allowedRoles={['admin', 'driver']}>
            <DriverDashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard/user" element={
          <ProtectedRoute allowedRoles={['user']}>
            <UserDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/products" element={
          <ProtectedRoute allowedRoles={['admin', 'staff', 'user']}>
            <ProductsPage />
          </ProtectedRoute>
        } />
        <Route path="/customers" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <CustomersPage />
          </ProtectedRoute>
        } />
        <Route path="/walkin" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <WalkInPage />
          </ProtectedRoute>
        } />
        <Route path="/drivers" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DriversPage />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute allowedRoles={['admin', 'staff', 'driver', 'user']}>
            <OrdersPage />
          </ProtectedRoute>
        } />

        <Route path="/expenses" element={
          <ProtectedRoute allowedRoles={['admin', 'driver']}>
            <ExpensesPage />
          </ProtectedRoute>
        } />
        <Route path="/reports" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ReportsPage />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UsersPage />
          </ProtectedRoute>
        } />
        <Route path="/route" element={
          <ProtectedRoute allowedRoles={['admin', 'driver']}>
            <DriverRoutePage />
          </ProtectedRoute>
        } />

        <Route path="/cart" element={
          <ProtectedRoute allowedRoles={['user']}>
            <CartPage />
          </ProtectedRoute>
        } />

        <Route path="/live-map" element={
          <ProtectedRoute allowedRoles={['admin', 'staff']}>
            <LiveMapPage />
          </ProtectedRoute>
        } />
        
        <Route path="/delivery-history" element={
          <ProtectedRoute allowedRoles={['admin', 'driver']}>
            <DeliveryHistory />
          </ProtectedRoute>
        } />





        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;

