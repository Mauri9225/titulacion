import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import useApiResource from '../hooks/useApiResource'
import { api } from '../services/api'

function OrderHistory() {
  const [search, setSearch] = useState('')
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [orderForm, setOrderForm] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusError, setStatusError] = useState('')
  const location = useLocation()
  const isDeliveredView = location.pathname.endsWith('/entregados')
  const viewMode = isDeliveredView ? 'delivered' : 'management'
  const { data: workOrders, error, loading, reload } = useApiResource(
    () => api.workOrders.list(search),
    [],
  )
  const filteredOrders = useMemo(() => {
    if (viewMode === 'delivered') {
      return workOrders.filter((order) => order.status === 'Entregado')
    }

    return workOrders.filter((order) => order.status !== 'Entregado')
  }, [workOrders, viewMode])
  const selectedOrder = useMemo(
    () => filteredOrders.find((order) => order.id === selectedOrderId) || filteredOrders[0],
    [filteredOrders, selectedOrderId],
  )

  useEffect(() => {
    if (!selectedOrderId && filteredOrders.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedOrderId(filteredOrders[0].id)
    }
  }, [filteredOrders, selectedOrderId])

  useEffect(() => {
    if (selectedOrder) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrderForm({
        status: selectedOrder.status,
        serviceCost: selectedOrder.serviceCost || 0,
        downpayment: selectedOrder.downpayment || 0,
        balance: selectedOrder.balance || 0,
        deliveryDate: selectedOrder.deliveryDate || '',
        repairDescription: selectedOrder.repairDescription || '',
      })
    }
  }, [selectedOrder])

  return (
    <section className="page-view">
      <PageHeader
        title={
          viewMode === 'delivered'
            ? 'Historial de equipos entregados'
            : 'Gestión de ordenes'
        }
        description={
          viewMode === 'delivered'
            ? 'Equipos ya entregados con todos los detalles de servicio.'
            : 'Equipos recibidos listos para avanzar en el flujo de reparación.'
        }
      />

      {/*<div className="action-row" style={{ gap: '8px', flexWrap: 'wrap' }}>
        <Link className="secondary-button" to="/ordenes/historial">
          Ver gestión de ordenes
        </Link>
        <Link className="secondary-button" to="/ordenes/entregados">
          Ver equipos entregados
        </Link>
      </div>*/}

      {error ? <p className="alert-message">{error}</p> : null}
      {loading ? <p className="muted-message">Cargando ordenes...</p> : null}

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
          <select defaultValue="Cedula cliente">
            <option>Cédula cliente</option>
            <option>Número de orden</option>
            <option>Nombre cliente</option>
          </select>
          <button className="primary-button" type="button" onClick={reload}>
            Buscar
          </button>
        </div>

        <div className="panel" style={{ marginBottom: '16px' }}>
          <p>Haz clic en una orden para ver los detalles y actualizar su estado.</p>
        </div>

        {isModalOpen && orderForm && selectedOrder ? (
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
                  <h2>Actualizar orden</h2>
                  <span>Modifica estado y datos de entrega</span>
                </div>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cerrar
                </button>
              </div>

              {statusMessage ? <p className="success-message">{statusMessage}</p> : null}
              {statusError ? <p className="alert-message">{statusError}</p> : null}

              <div className="order-detail modal-order-detail">
                <div>
                  <span>Orden:</span>
                  <strong>{selectedOrder.id}</strong>
                </div>
                <div>
                  <span>Nombre cliente:</span>
                  <strong>{selectedOrder.client}</strong>
                </div>
                <div>
                  <span>Cédula/RUC:</span>
                  <strong>{selectedOrder.document}</strong>
                </div>
                <div>
                  <span>Teléfono:</span>
                  <strong>{selectedOrder.phone}</strong>
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
                  <span>Marca:</span>
                  <strong>{selectedOrder.brand}</strong>
                </div>
                <div>
                  <span>Modelo:</span>
                  <strong>{selectedOrder.model}</strong>
                </div>
                <div>
                  <span>Dispositivo:</span>
                  <strong>{selectedOrder.device}</strong>
                </div>
                <div>
                  <span>Descripción:</span>
                  <strong>{selectedOrder.fault}</strong>
                </div>
                {selectedOrder.accessories ? (
                  <div>
                    <span>Accesorios:</span>
                    <strong>{selectedOrder.accessories}</strong>
                  </div>
                ) : null}
                {selectedOrder.notes ? (
                  <div>
                    <span>Notas extra:</span>
                    <strong>{selectedOrder.notes}</strong>
                  </div>
                ) : null}
                {selectedOrder.technician ? (
                  <div>
                    <span>Técnico:</span>
                    <strong>{selectedOrder.technician}</strong>
                  </div>
                ) : null}
                {selectedOrder.repairDescription ? (
                  <div>
                    <span>Descripción de reparación:</span>
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

              <form
                className="panel"
                onSubmit={async (event) => {
                  event.preventDefault()
                  try {
                    setStatusError('')
                    setStatusMessage('')
                    await api.workOrders.updateStatus(selectedOrder.id, {
                      status: orderForm.status,
                      serviceCost: Number(orderForm.serviceCost) || 0,
                      downpayment: Number(orderForm.downpayment) || 0,
                      balance: Number(orderForm.balance) || 0,
                      deliveryDate: orderForm.deliveryDate || '',
                      repairDescription: orderForm.repairDescription || '',
                    })
                    setStatusMessage('Orden actualizada correctamente.')
                    setIsModalOpen(false)
                    reload()
                  } catch (updateError) {
                    setStatusError(updateError.message)
                  }
                }}
              >
                <label>
                  Estado
                  <select
                    value={orderForm.status}
                    onChange={(event) =>
                      setOrderForm((current) => ({ ...current, status: event.target.value }))
                    }
                  >
                    <option value="Recibido">Recibido</option>
                    <option value="En reparacion">En reparación</option>
                    <option value="Listo">Listo</option>
                    <option value="Entregado">Entregado</option>
                  </select>
                </label>

                {orderForm.status === 'En reparacion' ? (
                  <label>
                    Descripción de reparación
                    <textarea
                      value={orderForm.repairDescription}
                      onChange={(event) =>
                        setOrderForm((current) => ({
                          ...current,
                          repairDescription: event.target.value,
                        }))
                      }
                      rows={4}
                    />
                  </label>
                ) : null}

                {orderForm.status === 'Entregado' ? (
                  <>
                    <label>
                      Fecha de entrega
                      <input
                        type="date"
                        value={orderForm.deliveryDate}
                        onChange={(event) =>
                          setOrderForm((current) => ({ ...current, deliveryDate: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Costo del servicio
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={orderForm.serviceCost}
                        onChange={(event) =>
                          setOrderForm((current) => ({ ...current, serviceCost: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Abono
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={orderForm.downpayment}
                        onChange={(event) =>
                          setOrderForm((current) => ({ ...current, downpayment: event.target.value }))
                        }
                      />
                    </label>
                    <label>
                      Saldo
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={orderForm.balance}
                        onChange={(event) =>
                          setOrderForm((current) => ({ ...current, balance: event.target.value }))
                        }
                      />
                    </label>
                    {(Number(orderForm.downpayment) > 0 || Number(orderForm.balance) > 0) && (
                      <div className="panel" style={{ marginTop: '14px', padding: '14px' }}>
                        <h3>Resumen de pago</h3>
                        <p>Abono: $ {Number(orderForm.downpayment).toFixed(2)}</p>
                        <p>Saldo: $ {Number(orderForm.balance).toFixed(2)}</p>
                      </div>
                    )}
                  </>
                ) : null}

                <div className="action-row end">
                  <button className="primary-button" type="submit">
                    Guardar cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}

        <table className="data-table">
          <thead>
            <tr>
              <th>Orden</th>
              <th>Fecha de ingreso</th>
              <th>Cliente</th>
              <th>Celular</th>
              <th>Fecha de entrega</th>
              <th>Descripción</th>
              <th>Modelo</th>
              <th>Marca</th>
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
                <td>{order.fault}</td>
                <td>{order.model}</td>
                <td>{order.brand}</td>
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

export default OrderHistory
