import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Guards & Layouts
import { ProtectedRoute, AdminRoute } from './components/routes/ProtectedRoute';
import AppLayout from './layouts/AppLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import OTPVerifyPage from './pages/public/OTPVerifyPage';

// User Pages
import UserDashboardPage from './pages/user/UserDashboardPage';
import ProfilePage from './pages/user/ProfilePage';
import CredentialsPage from './pages/user/CredentialsPage';
import IdentityVerificationPage from './pages/user/IdentityVerificationPage';
import SecuritySettingsPage from './pages/user/SecuritySettingsPage';
import LoginHistoryPage from './pages/user/LoginHistoryPage';
import ActiveSessionsPage from './pages/user/ActiveSessionsPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import RoleManagementPage from './pages/admin/RoleManagementPage';
import VerificationReviewPage from './pages/admin/VerificationReviewPage';
import SecurityLogsPage from './pages/admin/SecurityLogsPage';
import SuspiciousEventsPage from './pages/admin/SuspiciousEventsPage';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/otp-verify" element={<OTPVerifyPage />} />

            {/* Authenticated User Routes */}
            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<UserDashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/credentials" element={<CredentialsPage />} />
              <Route path="/verification" element={<IdentityVerificationPage />} />
              <Route path="/security" element={<SecuritySettingsPage />} />
              <Route path="/login-history" element={<LoginHistoryPage />} />
              <Route path="/sessions" element={<ActiveSessionsPage />} />
            </Route>

            {/* Protected Admin Routes */}
            <Route
              element={
                <AdminRoute>
                  <AppLayout />
                </AdminRoute>
              }
            >
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/admin/users" element={<UserManagementPage />} />
              <Route path="/admin/roles" element={<RoleManagementPage />} />
              <Route path="/admin/verifications" element={<VerificationReviewPage />} />
              <Route path="/admin/security-logs" element={<SecurityLogsPage />} />
              <Route path="/admin/suspicious-events" element={<SuspiciousEventsPage />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
