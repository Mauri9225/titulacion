import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/auth/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import CashClose from './pages/CashClose'
import Dashboard from './pages/Dashboard'
import Inventory from './pages/Inventory'
import Login from './pages/Login'
import DeliveredEquipmentHistory from './pages/DeliveredEquipmentHistory'
import OrderManagement from './pages/OrderManagement'
import SalesPOS from './pages/SalesPOS'
import Users from './pages/Users'
import WorkOrders from './pages/WorkOrders'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route element={<ProtectedRoute roles={['admin']} />}>
            <Route index element={<Dashboard />} />
            <Route path="usuarios" element={<Users />} />
          </Route>
        <Route path="ventas" element={<SalesPOS />} />
        <Route path="ordenes/nueva" element={<WorkOrders />} />
        <Route path="ordenes/gestion" element={<OrderManagement />} />
        <Route path="ordenes/historial" element={<DeliveredEquipmentHistory />} />
        <Route path="ordenes/entregados" element={<DeliveredEquipmentHistory />} />
        <Route path="inventario" element={<Inventory />} />
        <Route path="caja" element={<CashClose />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
