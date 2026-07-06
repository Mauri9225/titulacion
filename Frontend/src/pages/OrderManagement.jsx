import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import useApiResource from '../hooks/useApiResource'
import { api } from '../services/api'

function OrderManagement() {
  const [selectedOrderId, setSelectedOrderId] = useState(null)
  const [orderForm, setOrderForm] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [statusError, setStatusError] = useState('')

  const { data: workOrders, error, loading, reload } = useApiResource(
    () => api.workOrders.list('', ''),
    [],
  )

  const filteredOrders = useMemo(
    () => workOrders.filter((order) => order.status !== 'Entregado'),
    [workOrders],
  )
  const selectedOrder = useMemo(
    () => filteredOrders.find((order) => order.id === selectedOrderId) || filteredOrders[0],
    [filteredOrders, selectedOrderId],
  )

  useEffect(() => {
    if (!selectedOrderId && filteredOrders.length > 0) {
      setSelectedOrderId(filteredOrders[0].id)
    }
  }, [filteredOrders, selectedOrderId])

  useEffect(() => {
    if (selectedOrder) {
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
        title="Gestión de ordenes"
        description="Equipos en proceso de reparación; al entregarse pasan al historial."
      />

      <div className="action-row" style={{ gap: '8px', flexWrap: 'wrap' }}>
        <Link className="secondary-button" to="/ordenes/historial">
          Ver historial de entregados
        </Link>
      </div>

      {error ? <p className="alert-message">{error}</p> : null}
      {loading ? <p className="muted-message">Cargando ordenes...</p> : null}

      <section className="panel">
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
                  <span>Cedula/RUC:</span>
                  <strong>{selectedOrder.document}</strong>
                </div>
                <div>
                  <span>Telefono:</span>
                  <strong>{selectedOrder.phone}</strong>
                </div>
                <div>
                  <span>Fecha de ingreso:</span>
                  <strong>{selectedOrder.date}</strong>
                </div>
                <div>
                  <span>Descripcion:</span>
                  <strong>{selectedOrder.fault}</strong>
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
                  <span>Estado:</span>
                  <strong>{selectedOrder.status}</strong>
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
                    <option value="En reparacion">En reparacion</option>
                    <option value="Listo">Listo</option>
                    <option value="Entregado">Entregado</option>
                  </select>
                </label>

                {orderForm.status === 'En reparacion' ? (
                  <label>
                    Descripcion de reparacion
                    <textarea
                      value={orderForm.repairDescription}
                      onChange={(event) =>
                        setOrderForm((current) => ({ ...current, repairDescription: event.target.value }))
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
              <th>Descripcion</th>
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

export default OrderManagement
