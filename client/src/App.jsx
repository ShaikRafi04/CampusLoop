import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AdminRoute } from './components/common/AdminRoute';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { MySkillsPage } from './pages/MySkillsPage';
import { SkillFormPage } from './pages/SkillFormPage';
import { SkillDetailPage } from './pages/SkillDetailPage';
import { BookingsPage } from './pages/BookingsPage';
import { DiscoverPage } from './pages/DiscoverPage';
import { AvailabilitySettingsPage } from './pages/AvailabilitySettingsPage';
import { WalletPage } from './pages/WalletPage';
import { GoalsPage } from './pages/GoalsPage';
import { ReviewFormPage } from './pages/ReviewFormPage';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
            <Navbar />
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/skills/:id" element={<SkillDetailPage />} />
                <Route path="/users/:id" element={<PublicProfilePage />} />

                {/* Authenticated Student Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/bookings"
                  element={
                    <ProtectedRoute>
                      <BookingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/availability"
                  element={
                    <ProtectedRoute>
                      <AvailabilitySettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings/profile"
                  element={
                    <ProtectedRoute>
                      <ProfileSettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-skills"
                  element={
                    <ProtectedRoute>
                      <MySkillsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-skills/new"
                  element={
                    <ProtectedRoute>
                      <SkillFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-skills/:id/edit"
                  element={
                    <ProtectedRoute>
                      <SkillFormPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/wallet"
                  element={
                    <ProtectedRoute>
                      <WalletPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/goals"
                  element={
                    <ProtectedRoute>
                      <GoalsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reviews/new"
                  element={
                    <ProtectedRoute>
                      <ReviewFormPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Management Routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminOverviewPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <AdminRoute>
                      <AdminUsersPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <AdminRoute>
                      <AdminReportsPage />
                    </AdminRoute>
                  }
                />


                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />

              </Routes>
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
