import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import useApiResource from '../hooks/useApiResource'
import { api } from '../services/api'

function DeliveredEquipmentHistory() {
  const [search, setSearch] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: workOrders, error, loading, reload } = useApiResource(
    () => api.workOrders.list(search, 'Entregado'),
    [],
  )

  const filteredOrders = useMemo(() => workOrders, [workOrders])
  const selectedOrder = useMemo(
    () => filteredOrders.find((order) => order.id === selectedOrderId) || filteredOrders[0],
    [filteredOrders, selectedOrderId],
  )

  return (
    <section className="page-view">
      <PageHeader
        title="Historial de equipos entregados"
        description="Equipos ya entregados con todos los detalles de servicio y pago."
      />

      <div className="action-row" style={{ gap: '8px', flexWrap: 'wrap' }}>
        <Link className="secondary-button" to="/ordenes/gestion">
          Ver gestión de ordenes
        </Link>
      </div>

      {error ? <p className="alert-message">{error}</p> : null}
      {loading ? <p className="muted-message">Cargando historial...</p> : null}

      <section className="panel">
        <div className="filter-bar">
          <label className="input-control slim">
            <Search size={18} />
            <input
              placeholder="Buscar por cedula, cliente u orden"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <button className="primary-button" type="button" onClick={reload}>
            Buscar
          </button>
        </div>

        {isModalOpen && selectedOrder ? (
          <div
            className="modal-overlay"
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                setIsModalOpen(false)
              }
            }}
          >
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h2>Detalle del equipo entregado</h2>
                  <span>Informacion completa del servicio</span>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cerrar
                </button>
              </div>

              <div className="order-detail modal-order-detail">
                <div>
                  <span>Orden:</span>
                  <strong>{selectedOrder.id}</strong>
                </div>
                <div>
                  <span>Cliente:</span>
                  <strong>{selectedOrder.client}</strong>
                </div>
                <div>
                  <span>Cedula/RUC:</span>
                  <strong>{selectedOrder.document}</strong>
                </div>
                <div>
                  <span>Fecha de ingreso:</span>
                  <strong>{selectedOrder.date}</strong>
                </div>
                <div>
                  <span>Fecha de entrega:</span>
                  <strong>{selectedOrder.deliveryDate || 'Pendiente'}</strong>
                </div>
                <div>
                  <span>Dispositivo:</span>
                  <strong>{selectedOrder.device}</strong>
                </div>
                <div>
                  <span>Marca:</span>
                  <strong>{selectedOrder.brand}</strong>
                </div>
                <div>
                  <span>Modelo:</span>
                  <strong>{selectedOrder.model}</strong>
                </div>
                <div>
                  <span>Descripcion:</span>
                  <strong>{selectedOrder.fault}</strong>
                </div>
                {selectedOrder.repairDescription ? (
                  <div>
                    <span>Descripcion de reparacion:</span>
                    <strong>{selectedOrder.repairDescription}</strong>
                  </div>
                ) : null}
                <div>
                  <span>Estado:</span>
                  <strong>{selectedOrder.status}</strong>
                </div>
                <div>
                  <span>Costo servicio:</span>
                  <strong>$ {Number(selectedOrder.serviceCost).toFixed(2)}</strong>
                </div>
                <div>
                  <span>Abono:</span>
                  <strong>$ {Number(selectedOrder.downpayment).toFixed(2)}</strong>
                </div>
                <div>
                  <span>Saldo:</span>
                  <strong>$ {Number(selectedOrder.balance).toFixed(2)}</strong>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <table className="data-table">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Fecha ingreso</th>
              <th>Cliente</th>
              <th>Telefono</th>
              <th>Fecha entrega</th>
              <th>Equipo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr
                key={order.id}
                onClick={() => {
                  setSelectedOrderId(order.id)
                  setIsModalOpen(true)
                }}
                className={order.id === selectedOrderId ? 'selected-row' : ''}
              >
                <td>{order.id}</td>
                <td>{order.date}</td>
                <td>{order.client}</td>
                <td>{order.phone}</td>
                <td>{order.deliveryDate || 'Pendiente'}</td>
                <td>{order.device}</td>
                <td>
                  <span className={`status ${order.status.toLowerCase().replace(/ /g, '-')}`}>
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  )
}

export default DeliveredEquipmentHistory
