import { Eye, EyeOff, Lock, User } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/android.png'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'admin',
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    try {
      setError('')
      setIsSubmitting(true)
      const session = await login(form)
      navigate(session.user.role === 'admin' ? '/' : '/ventas', { replace: true })
    } catch (currentError) {
      setError(currentError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <img src={logo} alt="Electri-Incom" className="login-logo" />
          <div>
            <strong>Electri-Incom</strong>
            <span>System</span>
          </div>
        </div>

        <div className="login-copy">
          <h1>Inicia sesión para continuar</h1>
          <p>Accede a tu cuenta</p>
        </div>

        {error ? <p className="alert-message">{error}</p> : null}

        <form className="stack-form" onSubmit={handleSubmit}>
          <label className="input-control">
            <User size={18} />
            <input
              type="email"
              placeholder="Correo"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              required
            />
          </label>
          <label className="input-control">
            <Lock size={18} />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Contrasena"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                display: 'grid',
                placeItems: 'center',
                color: '#69788e',
              }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </label>
          <label className="input-control">
            <User size={18} />
            <select
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({ ...current, role: event.target.value }))
              }
            >
              <option value="admin">Administrador</option>
              <option value="staff">Tecnico/Vendedor</option>
            </select>
          </label>
          <button className="primary-button full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default Login
