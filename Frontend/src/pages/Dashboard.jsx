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
        description="Vista rapida del estado de ordenes, inventario y ventas del local."
      />

      {error ? <p className="alert-message">{error}</p> : null}
      {loading ? <p className="muted-message">Cargando dashboard...</p> : null}

      <div className="stats-grid">
        {data.stats.map((stat, index) => {
          const normalized = stat.label.toLowerCase().trim()
          const actions = {
            'trabajos activos': () => navigate('/ordenes/gestion'),
            'ordenes abiertas': () => navigate('/ordenes/gestion'),
            'productos en stock bajo': () => navigate('/inventario'),
            'ingresos del dia': () => navigate('/ventas'),
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
            <h2>Ingresos de ultimos 6 dias</h2>
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
            <h2>Ultimas ordenes</h2>
            <span>Trabajo tecnico</span>
          </div>
          <div className="compact-table">
            {data.recentWorkOrders.map((order) => (
              <article key={order.id}>
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
