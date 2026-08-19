import { Archive, ClipboardList, DollarSign, ShoppingBag } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import useApiResource from '../hooks/useApiResource'
import { api } from '../services/api'

const statIcons = [ShoppingBag, ClipboardList, Archive, DollarSign]

function Dashboard() {
  const { data, error, loading } = useApiResource(api.dashboard.get, {
    chartPoints: [],
    recentWorkOrders: [],
    stats: [],
  })
  const chartPoints = data.chartPoints.length ? data.chartPoints : [{ label: 'Sin datos', total: 0 }]
  const maxPoint = Math.max(...chartPoints.map((point) => Number(point.total) || 0), 1)
  const maxBarHeight = 160

  const navigate = useNavigate()

  return (
    <section className="page-view">
      <PageHeader
        title="Dashboard principal"
        description="Vista rápida del estado de órdenes, inventario y ventas del local."
      />

      {error ? <p className="alert-message">{error}</p> : null}
      {loading ? <p className="muted-message">Cargando dashboard...</p> : null}

      <div className="stats-grid">
        {data.stats.map((stat, index) => {
          const normalized = stat.label.toLowerCase().trim()
          const actions = {
            'trabajos activos': () => navigate('/ordenes/gestion'),
            'equipos entregados': () => navigate('/ordenes/historial'),
            'productos en stock bajo': () => navigate('/inventario'),
            'ingresos del día': () => navigate('/ventas'),
          }
          const action = actions[normalized]

          return (
            <StatCard
              key={stat.label}
              icon={statIcons[index]}
              {...stat}
              onClick={action}
            />
          )
        })}
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-title">
            <h2>Ingresos de los últimos 6 días</h2>
            <span>Ventas y servicios</span>
          </div>
          <div className="line-chart" aria-label="Grafico de ingresos">
            {chartPoints.map((point, index) => {
              const total = Number(point.total) || 0
              const height = Math.max(24, Math.round((total / maxPoint) * maxBarHeight))
              return (
                <span key={`${point.label}-${index}`}>
                  <strong style={{ height: `${height}px` }} />
                  <small>{point.label}</small>
                </span>
              )
            })}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>Últimas órdenes</h2>
            <span>Trabajo técnico</span>
          </div>
          <div className="compact-table">
            {data.recentWorkOrders.map((order) => (
              <article
                key={order.id}
                className="clickable"
                role="button"
                tabIndex={0}
                onClick={() => navigate(order.status === 'Entregado' ? '/ordenes/historial' : '/ordenes/gestion')}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    navigate(order.status === 'Entregado' ? '/ordenes/historial' : '/ordenes/gestion')
                  }
                }}
              >
                <strong>{order.id}</strong>
                <span>{order.client}</span>
                <span>{order.device}</span>
                <b className={`status ${order.status.toLowerCase().replace(' ', '-')}`}>
                  {order.status}
                </b>
              </article>
            ))}
          </div>
        </section>
      </div>
    </section>
  )
}

export default Dashboard
