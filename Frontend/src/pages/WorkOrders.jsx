import { useState } from 'react'
import { Save, Search, Trash2 } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import { api } from '../services/api'

const initialForm = {
  brand: '',
  client: '',
  device: '',
  document: '',
  fault: '',
  model: '',
  notes: '',
  phone: '',
  serviceCost: '',
  downpayment: '',
  balance: '',
  deliveryDate: '',
}

function WorkOrders() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [receiptOrder, setReceiptOrder] = useState(null)
  const [isSearchingClient, setIsSearchingClient] = useState(false)

  function updateField(field, value) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }))
    setError('')
    setMessage('')
  }

  function clearForm() {
    setForm(initialForm)
    setError('')
    setMessage('')
    setReceiptOrder(null)
  }

  function printReceipt(order) {
    const receipt = order || receiptOrder
    if (!receipt) return

    const html = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Recibo Orden ${receipt.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111; }
            h1 { margin-bottom: 0; font-size: 22px; }
            p { margin: 4px 0; }
            .header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 18px; }
            .section { margin-bottom: 18px; }
            .section h2 { margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: .05em; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; }
            td { padding: 8px 6px; border: 1px solid #d1d5db; vertical-align: top; }
            .notes { white-space: pre-wrap; }
            .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .footer { margin-top: 20px; font-size: 12px; color: #4b5563; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Recibo de Orden</h1>
              <p><strong>${receipt.id}</strong></p>
            </div>
            <div>
              <p><strong>Fecha:</strong> ${receipt.date}</p>
              <p><strong>Estado:</strong> ${receipt.status}</p>
            </div>
          </div>

          <div class="section">
            <h2>Cliente</h2>
            <table>
              <tr><td><strong>Nombre</strong></td><td>${receipt.client}</td></tr>
              <tr><td><strong>Cedula/RUC</strong></td><td>${receipt.document}</td></tr>
              <tr><td><strong>Teléfono</strong></td><td>${receipt.phone}</td></tr>
            </table>
          </div>

          <div class="section">
            <h2>Equipo</h2>
            <table>
              <tr><td><strong>Dispositivo</strong></td><td>${receipt.device}</td></tr>
              <tr><td><strong>Marca</strong></td><td>${receipt.brand || 'N/A'}</td></tr>
              <tr><td><strong>Modelo</strong></td><td>${receipt.model || 'N/A'}</td></tr>
              <tr><td><strong>Falla reportada</strong></td><td class="notes">${receipt.fault}</td></tr>
            </table>
          </div>

          <div class="section">
            <h2>Pago</h2>
            <table>
              <tr><td><strong>Costo servicio</strong></td><td>$ ${receipt.serviceCost.toFixed(2)}</td></tr>
              <tr><td><strong>Abono</strong></td><td>$ ${receipt.downpayment.toFixed(2)}</td></tr>
              <tr><td><strong>Saldo</strong></td><td>$ ${receipt.balance.toFixed(2)}</td></tr>
            </table>
          </div>

          <div class="section footer">
            <p>Presente este recibo al entregar el equipo.</p>
          </div>
        </body>
      </html>`

    const printWindow = window.open('', '_blank', 'width=800,height=900')
    if (!printWindow) return

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  async function saveOrder(event) {
    event.preventDefault()

    if (!form.document || !form.client || !form.phone || !form.device || !form.fault) {
      setError('Completa cedula/RUC, nombre, telefono, equipo y falla reportada.')
      return
    }

    try {
      setIsSaving(true)
      const payload = {
        ...form,
        serviceCost: Number(form.serviceCost) || 0,
        downpayment: Number(form.downpayment) || 0,
        balance: Number(form.balance) || 0,
      }
      const order = await api.workOrders.create(payload)
      setReceiptOrder(order)
      setMessage(`Orden guardada correctamente: ${order.id}`)
      setForm(initialForm)
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function searchClient() {
    if (!form.document) {
      setError('Ingresa una cedula/RUC para buscar.')
      return
    }

    try {
      setIsSearchingClient(true)
      setError('')
      setMessage('')
      const orders = await api.workOrders.list(form.document)
      const lastOrder = orders.find((order) => order.document === form.document) || orders[0]

      if (!lastOrder) {
        setMessage('No se encontraron registros previos para ese cliente.')
        return
      }

      setForm((current) => ({
        ...current,
        client: lastOrder.client,
        phone: lastOrder.phone,
      }))
      setMessage('Cliente encontrado. Datos cargados en el formulario.')
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setIsSearchingClient(false)
    }
  }

  return (
    <section className="page-view">
      <PageHeader
        title="Nueva orden de trabajo"
        description="Registra equipos recibidos para reparacion y seguimiento tecnico."
      />

      {message ? <p className="success-message">{message}</p> : null}
      {error ? <p className="alert-message">{error}</p> : null}
      {receiptOrder ? (
        <div className="action-row" style={{ marginBottom: '16px' }}>
          <button className="primary-button" type="button" onClick={() => printReceipt()}>
            <Save size={17} />
            Imprimir recibo
          </button>
        </div>
      ) : null}

      <form className="panel work-order-panel" onSubmit={saveOrder}>
        <div className="form-grid">
          <fieldset>
            <legend>Datos del cliente</legend>
            <label>
              Cedula/RUC
              <div className="inline-input">
                <input
                  placeholder="Ej. 1726000001"
                  value={form.document}
                  onChange={(event) => updateField('document', event.target.value)}
                />
                <button
                  className="primary-button"
                  type="button"
                  onClick={searchClient}
                  disabled={isSearchingClient}
                >
                  <Search size={17} />
                  {isSearchingClient ? 'Buscando...' : 'Buscar cliente'}
                </button>
              </div>
            </label>
            <label>
              Nombre
              <input
                placeholder="Nombre del cliente"
                value={form.client}
                onChange={(event) => updateField('client', event.target.value)}
              />
            </label>
            <label>
              Telefono
              <input
                placeholder="Ej. 0998765432"
                type="tel"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Detalles del dispositivo</legend>
            <label>
              Equipo
              <input
                placeholder="Ej. Celular, laptop, tablet"
                value={form.device}
                onChange={(event) => updateField('device', event.target.value)}
              />
            </label>
            <div className="two-column-fields">
              <label>
                Marca
                <input
                  placeholder="Ej. Samsung"
                  value={form.brand}
                  onChange={(event) => updateField('brand', event.target.value)}
                />
              </label>
              <label>
                Modelo
                <input
                  placeholder="Ej. Galaxy A54"
                  value={form.model}
                  onChange={(event) => updateField('model', event.target.value)}
                />
              </label>
            </div>
            <label>
              Falla reportada
              <textarea
                placeholder="Describe la falla reportada por el cliente"
                value={form.fault}
                onChange={(event) => updateField('fault', event.target.value)}
              />
            </label>
            <label>
              Observaciones
              <textarea
                placeholder="Condicion del equipo, golpes, humedad u otros detalles"
                value={form.notes}
                onChange={(event) => updateField('notes', event.target.value)}
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>Pago</legend>
            <label>
              Costo del servicio
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej. 35.00"
                value={form.serviceCost}
                onChange={(event) => updateField('serviceCost', event.target.value)}
              />
            </label>
            <label>
              Abono
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej. 10.00"
                value={form.downpayment}
                onChange={(event) => updateField('downpayment', event.target.value)}
              />
            </label>
            <label>
              Saldo
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Ej. 25.00"
                value={form.balance}
                onChange={(event) => updateField('balance', event.target.value)}
              />
            </label>
          </fieldset>
        </div>

        <div className="action-row end">
          <button
            className="secondary-button"
            type="button"
            onClick={clearForm}
          >
            <Trash2 size={17} />
            Limpiar
          </button>
          <button className="primary-button" type="submit" disabled={isSaving}>
            <Save size={17} />
            {isSaving ? 'Guardando...' : 'Guardar orden'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default WorkOrders
