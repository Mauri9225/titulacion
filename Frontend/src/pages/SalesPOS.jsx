import { useMemo, useState } from 'react'
import { Search, ShoppingCart, X } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader'
import useApiResource from '../hooks/useApiResource'
import { api } from '../services/api'

function SalesPOS() {
  const { data: products, error, loading, reload } = useApiResource(
    api.products.list,
    [],
  )
  const [ticketItems, setTicketItems] = useState([])
  const [search, setSearch] = useState('')
  const [rechargeAmount, setRechargeAmount] = useState(35)

  const subtotal = ticketItems.reduce((sum, item) => {
    if (item.type === 'recharge') {
      return sum + Number(item.amount || 0)
    }

    return sum + item.price * item.quantity
  }, 0)
  const discount = 0
  const total = subtotal - discount
  const availableProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.stock > 0 &&
          `${product.name} ${product.category} ${product.id}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [products, search],
  )

  function addToTicket(product) {
    setTicketItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id)

      if (existingItem) {
        if (existingItem.quantity >= product.stock) {
          return currentItems
        }

        return currentItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        )
      }

      return [
        ...currentItems,
        {
          id: product.id,
          name: product.name,
          quantity: 1,
          price: product.price,
          stock: product.stock,
        },
      ]
    })
  }

  function updateTicketQuantity(id, quantity) {
    setTicketItems((currentItems) =>
      currentItems
        .map((item) => {
          if (item.id !== id) return item
          const newQuantity = Number(quantity)
          if (Number.isNaN(newQuantity) || newQuantity <= 0) {
            return null
          }
          return {
            ...item,
            quantity: Math.min(newQuantity, item.stock),
          }
        })
        .filter(Boolean),
    )
  }

  function updateRechargeAmount(id, amount) {
    setTicketItems((currentItems) =>
      currentItems.map((item) => {
        if (item.id !== id || item.type !== 'recharge') {
          return item
        }

        const nextAmount = Number(amount)
        return {
          ...item,
          amount: Number.isFinite(nextAmount) ? nextAmount : 0,
          price: Number.isFinite(nextAmount) ? nextAmount : 0,
        }
      }),
    )
  }

  function addRechargeToTicket() {
    const amount = Number(rechargeAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return
    }

    setTicketItems((currentItems) => {
      const existingRecharge = currentItems.find((item) => item.type === 'recharge')

      if (existingRecharge) {
        return currentItems.map((item) =>
          item.type === 'recharge' ? { ...item, amount, price: amount } : item,
        )
      }

      return [
        ...currentItems,
        {
          id: 'recharge',
          type: 'recharge',
          name: 'Recarga',
          quantity: 1,
          amount,
          price: amount,
          stock: Number.POSITIVE_INFINITY,
        },
      ]
    })
  }

  async function processSale() {
    if (!ticketItems.length) {
      return
    }

    await api.sales.create({ items: ticketItems, discount })
    setTicketItems([])
    reload()
  }

  return (
    <section className="page-view">
      <PageHeader
        title="Punto de venta"
        description="Procesa ventas de accesorios y cobros de servicios finalizados."
      />

      {error ? <p className="alert-message">{error}</p> : null}
      {loading ? <p className="muted-message">Cargando productos...</p> : null}

      <div className="pos-grid">
        <section className="panel">
          <div className="panel-title">
            <h2>Productos</h2>
            <label className="input-control slim">
              <Search size={18} />
              <input
                type="search"
                placeholder="Buscar producto..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>

          <div className="product-list">
            {availableProducts.map((product) => (
              <button key={product.id} type="button" onClick={() => addToTicket(product)}>
                <span>
                  {product.name} <small>({product.stock} disponibles)</small>
                </span>
                <strong>$ {product.price.toFixed(2)}</strong>
              </button>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-title">
            <h2>Ticket de venta</h2>
            <span>Detalle actual</span>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant</th>
                <th>Precio</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {ticketItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>
                    {item.type === 'recharge' ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.amount ?? 0}
                        onChange={(event) => updateRechargeAmount(item.id, event.target.value)}
                      />
                    ) : (
                      <input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(event) => updateTicketQuantity(item.id, event.target.value)}
                      />
                    )}
                  </td>
                  <td>$ {item.price.toFixed(2)}</td>
                  <td>$ {(item.type === 'recharge' ? item.amount : item.price * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="ticket-summary" style={{ marginTop: '16px' }}>
            <div className="panel-title" style={{ marginBottom: '10px' }}>
              <h3>Recargas</h3>
              <span>Valor fijo para caja</span>
            </div>
            <label className="input-control slim" style={{ marginBottom: '10px' }}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={rechargeAmount}
                onChange={(event) => setRechargeAmount(event.target.value)}
              />
            </label>
            <button className="secondary-button" type="button" onClick={addRechargeToTicket}>
              Agregar recarga
            </button>
            <p style={{ marginTop: '12px' }}>
              Subtotal: <strong>$ {subtotal.toFixed(2)}</strong>
            </p>
            <p>
              Descuento: <strong>$ {discount.toFixed(2)}</strong>
            </p>
            <p className="total">
              Total: <strong>$ {total.toFixed(2)}</strong>
            </p>
          </div>

          <div className="action-row">
            <button className="secondary-button" type="button" onClick={() => setTicketItems([])}>
              <X size={17} />
              Cancelar
            </button>
            <button className="success-button" type="button" onClick={processSale}>
              <ShoppingCart size={17} />
              Procesar pago
            </button>
          </div>
        </section>
      </div>
    </section>
  )
}

export default SalesPOS
