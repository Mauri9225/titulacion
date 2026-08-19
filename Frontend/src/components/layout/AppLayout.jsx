import { NavLink, Outlet } from 'react-router-dom'
import {
  Archive,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  ShoppingCart,
  Wallet,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import logo from '../../assets/android.png'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
  { to: '/ventas', label: 'Ventas', icon: ShoppingCart },
  { to: '/ordenes/nueva', label: 'Orden de Trabajo', icon: ClipboardList },
  { to: '/ordenes/gestion', label: 'Gestión de ordenes', icon: History },
  { to: '/ordenes/historial', label: 'Equipos Entregados', icon: Archive },
  { to: '/inventario', label: 'Inventario Productos', icon: Archive },
  { to: '/caja', label: 'Cierre de Caja', icon: Wallet },
  { to: '/usuarios', label: 'Usuarios', icon: Users, roles: ['admin'] },
]

function AppLayout() {
  const { logout, user } = useAuth()
  const visibleNavItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(user?.role),
  )

  return (
    <main className="system-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-icon">
            <img src={logo} alt="Electri-Incom" className="brand-logo" />
          </span>
          <div>
            <strong>Electri-Incom</strong>
            <span>System</span>
          </div>
        </div>

        <nav className="side-nav" aria-label="Menu principal">
          {visibleNavItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink key={item.to} to={item.to}>
                <Icon size={18} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>

        <NavLink className="logout-link" to="/login" onClick={logout}>
          <LogOut size={18} />
          Cerrar sesion
        </NavLink>
      </aside>

      <section className="main-area">
        <header className="app-topbar">
          <button className="icon-button mobile-menu" type="button" aria-label="Abrir menu">
            <Menu size={20} />
          </button>
          <div>
            <p>Bienvenido, {user?.name || 'Usuario'}</p>
            <strong>{user?.role === 'admin' ? 'Panel administrador' : 'Panel operativo'}</strong>
          </div>
        </header>
        <Outlet />
      </section>
    </main>
  )
}

export default AppLayout
