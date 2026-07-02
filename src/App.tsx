import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './lib/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { MobileLayout } from './mobile/MobileLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { InfoPage } from './pages/InfoPage'
import { ServiceDetailPage } from './pages/ServiceDetailPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { VehiclesPage } from './pages/vehicles/VehiclesPage'
import { VehicleAddPage } from './pages/vehicles/VehicleAddPage'
import { AssignDriverPage } from './pages/vehicles/AssignDriverPage'
import { DriversPage } from './pages/drivers/DriversPage'
import { DriverAddPage } from './pages/drivers/DriverAddPage'
import { LayContPage } from './pages/orders/LayContPage'
import { TraContPage } from './pages/orders/TraContPage'
import { OrdersPage } from './pages/orders/OrdersPage'
import { OrderDetailPage } from './pages/orders/OrderDetailPage'
import { PaymentPage } from './pages/orders/PaymentPage'
import { PricingPage } from './pages/admin/PricingPage'
import { CatalogPage } from './pages/admin/CatalogPage'
import { BankSettingsPage } from './pages/admin/BankSettingsPage'
import { ServicesPage } from './pages/admin/ServicesPage'
import { ContactSettingsPage } from './pages/admin/ContactSettingsPage'
import { VehicleApprovalPage } from './pages/admin/VehicleApprovalPage'
import { DriverApprovalPage } from './pages/admin/DriverApprovalPage'
import { OrderApprovalPage } from './pages/admin/OrderApprovalPage'
import { PermissionsPage } from './pages/admin/PermissionsPage'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      refetchOnMount: 'always',      // vào lại trang là tải mới
      refetchOnWindowFocus: true,    // quay lại tab/app là tải mới
      refetchOnReconnect: true,
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Khu vực cần đăng nhập — dùng layout mobile (nav dưới) */}
            <Route
              element={
                <ProtectedRoute>
                  <MobileLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<HomePage />} />
              <Route path="/thong-tin" element={<InfoPage />} />
              <Route path="/thong-bao" element={<NotificationsPage />} />
              <Route path="/tai-khoan" element={<ProfilePage />} />
            </Route>

            {/* Nghiệp vụ — full screen (không có nav dưới) */}
            <Route
              element={
                <ProtectedRoute>
                  <div className="h-full mx-auto max-w-[480px] bg-ink-100 shadow-xl">
                    <Outlet />
                  </div>
                </ProtectedRoute>
              }
            >
              <Route path="/lay-cont" element={<LayContPage />} />
              <Route path="/tra-cont" element={<TraContPage />} />
              <Route path="/don-hang" element={<OrdersPage />} />
              <Route path="/don-hang/:id" element={<OrderDetailPage />} />
              <Route path="/don-hang/:id/thanh-toan" element={<PaymentPage />} />
              <Route path="/phuong-tien" element={<VehiclesPage />} />
              <Route path="/phuong-tien/them" element={<VehicleAddPage />} />
              <Route path="/phuong-tien/:id/gan-tai-xe" element={<AssignDriverPage />} />
              <Route path="/nhan-su" element={<DriversPage />} />
              <Route path="/nhan-su/them" element={<DriverAddPage />} />
              <Route path="/admin/bang-gia" element={<PricingPage />} />
              <Route path="/admin/danh-muc" element={<CatalogPage />} />
              <Route path="/admin/ngan-hang" element={<BankSettingsPage />} />
              <Route path="/admin/dich-vu" element={<ServicesPage />} />
              <Route path="/admin/lien-he" element={<ContactSettingsPage />} />
              <Route path="/admin/duyet-xe" element={<VehicleApprovalPage />} />
              <Route path="/admin/duyet-tai-xe" element={<DriverApprovalPage />} />
              <Route path="/admin/duyet-don" element={<OrderApprovalPage />} />
              <Route path="/admin/phan-quyen" element={<PermissionsPage />} />
              <Route path="/thong-tin/dich-vu/:id" element={<ServiceDetailPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
