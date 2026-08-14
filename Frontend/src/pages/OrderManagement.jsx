import { useEffect, useMemo, useState } from 'react'
import { Printer } from 'lucide-react'
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

  function printReceipt(order) {
    if (!order) return

    const escapeHtml = (value) =>
      String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    const formatCurrency = (value) => `$ ${(Number(value || 0)).toFixed(2)}`
    const notes = order.notes || order.fault || ''

    const printWindow = window.open('', '_blank', 'width=900,height=1000')
    if (!printWindow) return

    printWindow.document.write(`<!doctype html>
      <html><head><meta charset="utf-8" /><title>Recibo Orden ${escapeHtml(order.id)}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
        h1 { margin: 0 0 6px; font-size: 22px; } p { margin: 4px 0; line-height: 1.4; }
        .header { display: flex; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
        .company-info { text-align: center; flex: 1; } .company-details, .footer, .signature-label { font-size: 12px; color: #4b5563; }
        .header-meta { text-align: right; min-width: 140px; } .section { margin-bottom: 18px; }
        .section h2 { margin: 0 0 8px; font-size: 14px; text-transform: uppercase; letter-spacing: .05em; color: #4b5563; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; } td { padding: 8px 6px; border: 1px solid #d1d5db; vertical-align: top; }
        .notes { white-space: pre-wrap; } .footer { margin-top: 20px; } .footer ul { margin: 8px 0 0 18px; padding: 0; } .footer li { margin-bottom: 4px; }
        .signature-section { display: flex; justify-content: space-between; gap: 24px; margin-top: 28px; } .signature-block { flex: 1; text-align: center; }
        .signature-line { border-top: 1px solid #111; margin: 48px auto 6px; width: 80%; }
      </style></head><body>
        <div class="header"><div class="company-info"><h1>ELECTRI-INCOM</h1><p><strong>ORDEN DE TRABAJO ${escapeHtml(order.id)}</strong></p>
          <p class="company-details">Instalación, mantenimiento y reparación de sistemas de comunicación.</p>
          <p class="company-details">Venta al por menor de aparatos de comunicación.</p>
          <p class="company-details">Dirección: Av. Pedro Vicente Maldonado y Joaquín Gutiérrez esquina.</p>
          <p class="company-details">Teléfono: 0997657790 · Quito - Ecuador</p></div>
          <div class="header-meta"><p><strong>Fecha:</strong> ${escapeHtml(order.date)}</p><p><strong>Estado:</strong> ${escapeHtml(order.status || 'Recibido')}</p></div></div>
        <div class="section"><h2>Cliente</h2><table><tr><td><strong>Nombre</strong></td><td>${escapeHtml(order.client)}</td></tr><tr><td><strong>Cédula/RUC</strong></td><td>${escapeHtml(order.document)}</td></tr><tr><td><strong>Teléfono</strong></td><td>${escapeHtml(order.phone)}</td></tr></table></div>
        <div class="section"><h2>Equipo</h2><table><tr><td><strong>Dispositivo</strong></td><td>${escapeHtml(order.device)}</td></tr><tr><td><strong>Marca</strong></td><td>${escapeHtml(order.brand || 'N/A')}</td></tr><tr><td><strong>Modelo</strong></td><td>${escapeHtml(order.model || 'N/A')}</td></tr><tr><td><strong>Falla reportada</strong></td><td class="notes">${escapeHtml(order.fault)}</td></tr>${notes ? `<tr><td><strong>Observaciones</strong></td><td class="notes">${escapeHtml(notes)}</td></tr>` : ''}</table></div>
        <div class="section"><h2>Pago</h2><table><tr><td><strong>Costo servicio</strong></td><td>${formatCurrency(order.serviceCost)}</td></tr><tr><td><strong>Abono</strong></td><td>${formatCurrency(order.downpayment)}</td></tr><tr><td><strong>Saldo</strong></td><td>${formatCurrency(order.balance)}</td></tr></table></div>
        <div class="section footer"><p>Presente este recibo para retirar el equipo.</p><ul><li>El establecimiento no se responsabiliza por chips olvidados en los equipos.</li><li>Pasados los 30 días desde la fecha de emisión, los equipos serán rematados sin opción a reclamo.</li><li>El establecimiento no se responsabiliza por la procedencia de los equipos que se entregan a servicio técnico.</li><li>Salidos los equipos no se admiten cambios ni reclamos.</li><li>Por favor revise sus equipos antes de retirarlos.</li></ul><div class="signature-section"><div class="signature-block"><div class="signature-line"></div><p class="signature-label">Firma autorizada</p></div><div class="signature-block"><div class="signature-line"></div><p class="signature-label">Firma del cliente</p></div></div></div>
      </body></html>`)
    printWindow.document.close()
    printWindow.focus()
    window.setTimeout(() => printWindow.print(), 250)
  }

  return (
    <section className="page-view">
      <PageHeader
        title="Gestión de ordenes"
        description="Equipos en proceso de reparación."
      />

      {/*<div className="action-row" style={{ gap: '8px', flexWrap: 'wrap' }}>
        <Link className="secondary-button" to="/ordenes/historial">
          Ver historial de entregados
        </Link>
      </div>*/}

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
                  <span>Descripción:</span>
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

              <div className="action-row" style={{ marginBottom: '16px' }}>
                <button className="secondary-button" type="button" onClick={() => printReceipt(selectedOrder)}>
                  <Printer size={17} />
                  Reimprimir recibo
                </button>
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
