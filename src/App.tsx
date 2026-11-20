
import React, { useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from 'react-router-dom';

import { useAuthStore } from './store/useAuthStore';
import CattleTracePage from './modules/cattle/CattleTracePage';

import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { ToastContainer } from './components/layout/ToastContainer';
import ChatbotWidget from './components/ChatbotWidget';

// Modules
import LoginPage from './modules/auth/LoginPage';
import { ForgotPasswordPage } from './modules/auth/ForgotPasswordPage';
import { DashboardOverview } from './modules/dashboard/DashboardOverview';
import { ProfilePage } from './modules/auth/ProfilePage';
import { UserManagementPage } from './modules/auth/UserManagementPage';
import { SystemSettingsPage } from './modules/auth/SystemSettingsPage';

import { CattleListPage } from './modules/cattle/CattleListPage';
import { CattleDetailPage } from './modules/cattle/CattleDetailPage';

import { BarnListPage } from './modules/barns/BarnListPage';
import { BarnTransferPage } from './modules/barns/BarnTransferPage';

import { FeedInventoryPage } from './modules/feeds/FeedInventoryPage';
import FeedingSchedulePage from './modules/feeds/FeedingSchedulePage';
import FeedingDiaryPage from './modules/feeds/FeedingDiaryPage';

import { HealthRecordsPage } from './modules/health/HealthRecordsPage';
import { CareCalendarPage } from './modules/health/CareCalendarPage';

import { FarmingDiaryPage } from './modules/diary/FarmingDiaryPage';
import { RfidScaleSimulationPage } from './modules/simulation/RfidScaleSimulationPage';

import { SalesEligibilityPage } from './modules/sales/SalesEligibilityPage';
import { SalesOrderPage } from './modules/sales/SalesOrderPage';

import { AnalyticsReportsPage } from './modules/reports/AnalyticsReportsPage';
import { BlockchainAuditPage } from './modules/blockchain/BlockchainAuditPage';

// Layout
const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72 flex flex-col flex-1 min-w-0 pb-16 lg:pb-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav
        onOpenMenu={() => setSidebarOpen(true)}
      />

      <ToastContainer />

      <ChatbotWidget />
    </div>
  );
};

// Kiểm tra đăng nhập
const ProtectedLayout: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  return <AppLayout />;
};

// Kiểm tra quyền ADMIN
const AdminRoute: React.FC = () => {
  const { currentUser } = useAuthStore();

  if (currentUser?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

// App
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Trang truy xuất nguồn gốc công khai bằng QR */}
        <Route
          path="/trace/:id"
          element={<CattleTracePage />}
        />

        {/* Trang đăng nhập */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        {/* Trang quên mật khẩu */}
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />

        {/* Các trang cần đăng nhập */}
        <Route element={<ProtectedLayout />}>
          <Route
            path="/"
            element={<DashboardOverview />}
          />

          <Route
            path="/profile"
            element={<ProfilePage />}
          />

          <Route
            path="/users"
            element={<UserManagementPage />}
          />
          <Route element={<AdminRoute />}>
            <Route
              path="/settings"
              element={<SystemSettingsPage />}
            />
          </Route>

          <Route
            path="/cattle"
            element={<CattleListPage />}
          />

          <Route
            path="/cattle/:id"
            element={<CattleDetailPage />}
          />

          <Route
            path="/barns"
            element={<BarnListPage />}
          />

          <Route
            path="/barns/transfer"
            element={<BarnTransferPage />}
          />

          <Route
            path="/feeds"
            element={<FeedInventoryPage />}
          />

          <Route
            path="/feeds/schedule"
            element={<FeedingSchedulePage />}
          />

          <Route
            path="/feeds/diary"
            element={<FeedingDiaryPage />}
          />

          <Route
            path="/health/records"
            element={<HealthRecordsPage />}
          />

          <Route
            path="/health/calendar"
            element={<CareCalendarPage />}
          />

          <Route
            path="/diary"
            element={<FarmingDiaryPage />}
          />

          <Route
            path="/simulation"
            element={<RfidScaleSimulationPage />}
          />

          <Route
            path="/sales/eligibility"
            element={<SalesEligibilityPage />}
          />

          <Route
            path="/sales/orders"
            element={<SalesOrderPage />}
          />

          <Route
            path="/reports"
            element={<AnalyticsReportsPage />}
          />

          <Route
            path="/blockchain"
            element={<BlockchainAuditPage />}
          />

          <Route
            path="/audit-logs"
            element={<BlockchainAuditPage />}
          />
        </Route>

        {/* Đường dẫn không tồn tại */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}
