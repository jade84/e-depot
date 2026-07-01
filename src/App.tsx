import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './lib/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { MobileLayout } from './mobile/MobileLayout'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { HomePage } from './pages/HomePage'
import { ProfilePage } from './pages/ProfilePage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { VehiclesPage } from './pages/vehicles/VehiclesPage'
import { VehicleAddPage } from './pages/vehicles/VehicleAddPage'
import { AssignDriverPage } from './pages/vehicles/AssignDriverPage'
import { DriversPage } from './pages/drivers/DriversPage'
import { DriverAddPage } from './pages/drivers/DriverAddPage'
import { LayContPage } from './pages/orders/LayContPage'
import { TraContPage } from './pages/orders/TraContPage'
import { OrdersPage } from './pages/orders/OrdersPage'

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
              <Route path="/tin-tuc" element={<PlaceholderPage title="Tin tức" />} />
              <Route path="/thong-bao" element={<PlaceholderPage title="Thông báo" />} />
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
              <Route path="/phuong-tien" element={<VehiclesPage />} />
              <Route path="/phuong-tien/them" element={<VehicleAddPage />} />
              <Route path="/phuong-tien/:id/gan-tai-xe" element={<AssignDriverPage />} />
              <Route path="/nhan-su" element={<DriversPage />} />
              <Route path="/nhan-su/them" element={<DriverAddPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
