import { Plus, UserPlus, UserX, UserCheck } from 'lucide-react'
import { useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import useApiResource from '../hooks/useApiResource'
import { api } from '../services/api'

const initialForm = {
  name: '',
  email: '',
  password: '',
  role: 'staff',
}

function Users() {
  const { data: users, error, loading, reload } = useApiResource(api.users.list, [])
  const [form, setForm] = useState(initialForm)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function closeModal() {
    setIsModalOpen(false)
    setForm(initialForm)
    setFormError('')
  }

  async function createUser(event) {
    event.preventDefault()

    try {
      setIsSaving(true)
      setFormError('')
      await api.users.create(form)
      setMessage('Usuario creado correctamente.')
      closeModal()
      reload()
    } catch (currentError) {
      setFormError(currentError.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleUserStatus(user) {
    try {
      await api.users.updateStatus(user.id, !user.active)
      setMessage(user.active ? 'Usuario desactivado correctamente.' : 'Usuario activado correctamente.')
      reload()
    } catch (currentError) {
      setFormError(currentError.message)
    }
  }

  return (
    <section className="page-view">
      <PageHeader
        title="Usuarios"
        description="Administra accesos para administradores, tecnicos y vendedores."
        action={
          <button className="primary-button" type="button" onClick={() => setIsModalOpen(true)}>
            <Plus size={17} />
            Nuevo usuario
          </button>
        }
      />

      {message ? <p className="success-message">{message}</p> : null}
      {error ? <p className="alert-message">{error}</p> : null}
      {loading ? <p className="muted-message">Cargando usuarios...</p> : null}

      {isModalOpen ? (
        <div
          className="modal-overlay"
          onClick={(event) => event.target === event.currentTarget && closeModal()}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2>Nuevo usuario</h2>
                <span>Crea accesos para nuevos tecnicos o vendedores.</span>
              </div>
              <button className="secondary-button" type="button" onClick={closeModal}>
                Cerrar
              </button>
            </div>

            {formError ? <p className="alert-message">{formError}</p> : null}

            <form className="panel" onSubmit={createUser}>
              <label>
                Nombre
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Correo
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Contrasena
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, password: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Rol
                <select
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, role: event.target.value }))
                  }
                >
                  <option value="staff">Tecnico/Vendedor</option>
                  <option value="admin">Administrador</option>
                </select>
              </label>
              <div className="action-row end">
                <button className="secondary-button" type="button" onClick={closeModal}>
                  Cancelar
                </button>
                <button className="primary-button" type="submit" disabled={isSaving}>
                  <UserPlus size={17} />
                  {isSaving ? 'Guardando...' : 'Crear usuario'}
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
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role === 'admin' ? 'Administrador' : 'Tecnico/Vendedor'}</td>
                <td>
                  <span className={`status ${user.active ? 'disponible' : 'recibido'}`}>
                    {user.active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <button
                    className={user.active ? 'secondary-button' : 'primary-button'}
                    type="button"
                    onClick={() => toggleUserStatus(user)}
                  >
                    {user.active ? <UserX size={16} /> : <UserCheck size={16} />}
                    {user.active ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </section>
  )
}

export default Users
