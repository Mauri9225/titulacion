import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import useApiResource from '../hooks/useApiResource'
import { api } from '../services/api'

const PRODUCTS_PER_PAGE = 10

function Inventory() {
  const { data: products, error, loading, reload } = useApiResource(
    api.products.list,
    [],
  )
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingProductId, setEditingProductId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    stock: 0,
    minStock: 0,
    price: 0,
  })
  const isProductModalOpen = isAddModalOpen || Boolean(editingProductId)
  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE))
  const visiblePage = Math.min(currentPage, totalPages)
  const firstProductIndex = (visiblePage - 1) * PRODUCTS_PER_PAGE
  const visibleProducts = products.slice(firstProductIndex, firstProductIndex + PRODUCTS_PER_PAGE)

  function resetProductForm() {
    setProductForm({
      name: '',
      category: '',
      stock: 0,
      minStock: 0,
      price: 0,
    })
  }

  function closeProductModal() {
    setIsAddModalOpen(false)
    setEditingProductId(null)
    resetProductForm()
  }

  function openEditProduct(product) {
    setProductForm({
      name: product.name,
      category: product.category,
      stock: product.stock,
      minStock: product.minStock,
      price: product.price,
    })
    setEditingProductId(product.id)
  }

  async function handleSaveProduct(event) {
    event.preventDefault()
    const payload = {
      name: productForm.name,
      category: productForm.category,
      stock: Number(productForm.stock) || 0,
      minStock: Number(productForm.minStock) || 0,
      price: Number(productForm.price) || 0,
    }

    if (editingProductId) {
      await api.products.update(editingProductId, payload)
    } else {
      await api.products.create(payload)
    }

    closeProductModal()
    reload()
  }

  async function handleDeleteProduct(id) {
    await api.products.remove(id)
    reload()
  }

  return (
    <section className="page-view">
      <PageHeader
        title="Inventario"
        description="Registra productos, actualiza precios y controla existencias."
        action={
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              resetProductForm()
              setIsAddModalOpen(true)
            }}
          >
            <Plus size={17} />
            Agregar producto
          </button>
        }
      />

      {error ? <p className="alert-message">{error}</p> : null}
      {loading ? <p className="muted-message">Cargando productos...</p> : null}

      {isProductModalOpen ? (
        <div className="modal-overlay" onClick={(event) => event.target === event.currentTarget && closeProductModal()}>
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2>{editingProductId ? 'Editar producto' : 'Agregar producto'}</h2>
                <span>{editingProductId ? editingProductId : 'Llena los datos del nuevo producto.'}</span>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={closeProductModal}
              >
                Cerrar
              </button>
            </div>
            <form className="panel" onSubmit={handleSaveProduct}>
              <label>
                Nombre del producto
                <input
                  type="text"
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Categoría
                <input
                  type="text"
                  value={productForm.category}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, category: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Stock
                <input
                  type="number"
                  min="0"
                  value={productForm.stock}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, stock: event.target.value }))
                  }
                />
              </label>
              <label>
                Stock mínimo
                <input
                  type="number"
                  min="0"
                  value={productForm.minStock}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, minStock: event.target.value }))
                  }
                />
              </label>
              <label>
                Precio
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.price}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, price: event.target.value }))
                  }
                />
              </label>
              <div className="action-row end">
                <button className="secondary-button" type="button" onClick={closeProductModal}>
                  Cancelar
                </button>
                <button className="primary-button" type="submit">
                  {editingProductId ? 'Guardar cambios' : 'Guardar producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <section className="panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Stock</th>
              <th>Precio (USD)</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((product) => (
              <tr key={product.id}>
                <td>{product.id}</td>
                <td>{product.name}</td>
                <td>{product.category}</td>
                <td>{product.stock}</td>
                <td>$ {product.price.toFixed(2)}</td>
                <td>
                  <span className={`status ${product.status.toLowerCase().replace(' ', '-')}`}>
                    {product.status}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      aria-label="Editar producto"
                      onClick={() => openEditProduct(product)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Eliminar producto"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length > PRODUCTS_PER_PAGE ? (
          <div className="pagination" aria-label="Paginacion de productos">
            <span>
              Mostrando {firstProductIndex + 1}-{Math.min(firstProductIndex + PRODUCTS_PER_PAGE, products.length)} de {products.length}
            </span>
            <div className="pagination-controls">
              <button
                className="secondary-button"
                type="button"
                aria-label="Pagina anterior"
                title="Pagina anterior"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={visiblePage === 1}
              >
                <ChevronLeft size={17} />
              </button>
              <span>
                Pagina {visiblePage} de {totalPages}
              </span>
              <button
                className="secondary-button"
                type="button"
                aria-label="Pagina siguiente"
                title="Pagina siguiente"
                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                disabled={visiblePage === totalPages}
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </section>
  )
}

export default Inventory
