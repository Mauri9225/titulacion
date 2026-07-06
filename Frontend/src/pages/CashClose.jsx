import { Lock, Eye, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import useApiResource from '../hooks/useApiResource'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'

function formatDateTime(value) {
  if (!value) return 'Sin registrar'
  return new Date(value).toLocaleString('es-EC', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
}

function money(value) {
  return `$ ${value.toFixed(2)}`
}

function CashClose() {
  const { user } = useAuth()
  const [countedCash, setCountedCash] = useState(0)
  const [openingCash, setOpeningCash] = useState(55)
  const {
    data: cashSummary,
    error,
    loading,
    reload,
    setData,
  } = useApiResource(api.cashClose.getToday, {
    countedCash: 0,
    date: '',
    salesTotal: 0,
    serviceTotal: 0,
    user: '',
    openingCash: 55,
    openedAt: null,
    closedAt: null,
  })
  
  const total = cashSummary.salesTotal + cashSummary.serviceTotal
  const difference = countedCash - openingCash - total
  const [reports, setReports] = useState([])
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const isAdmin = user?.role === 'admin'
  const isClosed = Boolean(cashSummary.closedAt)
  const displayUser = user?.name || cashSummary.user || 'Tecnico'
  const visibleReports = reports.slice(0, 5)
  const hasMoreReports = reports.length > 5

  useEffect(() => {
    setCountedCash(cashSummary.countedCash ?? 0)
    setOpeningCash(cashSummary.openingCash ?? 55)
    // If the app just started a fresh session on login, show zeroed totals immediately
    try {
      const fresh = localStorage.getItem('electriIncomFreshSession')
      if (fresh) {
        setData((prev) => ({
          ...prev,
          salesTotal: 0,
          serviceTotal: 0,
          countedCash: 0,
          openingCash: 55,
          openedAt: new Date().toISOString(),
        }))
        localStorage.removeItem('electriIncomFreshSession')
      }
    } catch (e) {
      // ignore
    }
  }, [cashSummary.countedCash, cashSummary.openingCash])

  async function loadReports() {
    try {
      const nextReports = await api.cashClose.getReports()
      setReports(nextReports)
    } catch {
      setReports([])
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  async function closeCash() {
    if (isClosed) return

    await api.cashClose.close({
      openingCash,
      countedCash,
      openedAt: cashSummary.openedAt || new Date().toISOString(),
      closedAt: new Date().toISOString(),
      user: user?.name || cashSummary.user,
    })
    await loadReports()
    reload()
  }

  function openReportDetail(report) {
    setSelectedReport(report)
  }

  function closeReportDetail() {
    setSelectedReport(null)
  }

  return (
    <section className="page-view">
      <PageHeader
        title="Cierre de caja"
        description="Consolida los ingresos generados durante la jornada laboral."
      />

      {error ? <p className="alert-message">{error}</p> : null}
      {loading ? <p className="muted-message">Cargando cierre de caja...</p> : null}

      <section className="panel cash-panel">
        <div className="cash-meta">
          <span>
            Fecha: <strong>{cashSummary.date}</strong>
          </span>
          <span>
            Usuario: <strong>{displayUser}</strong>
          </span>
          <span>
            Inicio jornada: <strong>{formatDateTime(cashSummary.openedAt)}</strong>
          </span>
          <span>
            Fin jornada: <strong>{formatDateTime(cashSummary.closedAt)}</strong>
          </span>
        </div>

        <div className="cash-summary">
          <h2>Resumen del dia</h2>
          <p>
            Total ventas (POS): <strong>{money(cashSummary.salesTotal)}</strong>
          </p>
          <p>
            Total servicios (reparaciones): <strong>{money(cashSummary.serviceTotal)}</strong>
          </p>
          <p>
            Total ingresos: <strong>{money(total)}</strong>
          </p>
          <p>
            Dinero base de apertura:
            <input
              type="number"
              min="0"
              step="0.01"
              value={openingCash}
              onChange={(event) => setOpeningCash(Number(event.target.value) || 55)}
            />
          </p>
          <p>
            Efectivo en caja contado:
            <input
              type="number"
              min="0"
              step="0.01"
              value={countedCash}
              onChange={(event) => setCountedCash(Number(event.target.value) || 0)}
            />
          </p>
          <p className="difference">
            Diferencia: <strong>{money(difference)}</strong>
          </p>
        </div>

        <button className="success-button full" type="button" onClick={closeCash} disabled={isClosed}>
          <Lock size={17} />
          {isClosed ? 'Jornada cerrada' : 'Cerrar caja'}
        </button>
      </section>

      {isAdmin ? (
        <section className="panel">
          <div className="panel-title">
            <h2>Reporte diario de jornada</h2>
            <span>Inicio y fin de actividad por dia</span>
          </div>

          <div className="compact-table">
            {visibleReports.map((report) => (
              <article
                key={report.id}
                onClick={() => openReportDetail(report)}
                style={{ cursor: 'pointer' }}
              >
                <strong>{report.date}</strong>
                <span>Usuario: {report.user}</span>
                <span>Inicio: {formatDateTime(report.openedAt)}</span>
                <span>Fin: {formatDateTime(report.closedAt)}</span>
                <span>Base: {money(report.openingCash || 0)}</span>
                <span>Contado: {money(report.countedCash || 0)}</span>
                <span>Diferencia: {money(report.difference || 0)}</span>
              </article>
            ))}
          </div>

          {hasMoreReports ? (
            <div className="action-row" style={{ marginTop: '12px' }}>
              <button
                className="secondary-button"
                type="button"
                onClick={() => setIsHistoryModalOpen(true)}
              >
                <Eye size={16} />
                Ver más
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      {isHistoryModalOpen ? (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setIsHistoryModalOpen(false)
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2>Historial completo de jornadas</h2>
                <span>Listado detallado de reportes de cierre de caja</span>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setIsHistoryModalOpen(false)}
              >
                <X size={16} />
                Cerrar
              </button>
            </div>

            <div className="compact-table" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {reports.map((report) => (
                <article
                  key={report.id}
                  onClick={() => openReportDetail(report)}
                  style={{ cursor: 'pointer' }}
                >
                  <strong>{report.date}</strong>
                  <span>Usuario: {report.user}</span>
                  <span>Inicio: {formatDateTime(report.openedAt)}</span>
                  <span>Fin: {formatDateTime(report.closedAt)}</span>
                  <span>Base: {money(report.openingCash || 0)}</span>
                  <span>Contado: {money(report.countedCash || 0)}</span>
                  <span>Diferencia: {money(report.difference || 0)}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {selectedReport ? (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeReportDetail()
            }
          }}
        >
          <div className="modal-content" style={{ maxWidth: '900px', width: '100%' }}>
            <div className="modal-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ minWidth: 0 }}>
                <h2>Reporte diario Electri-Incom</h2>
                <span>
                  {selectedReport.date} · {selectedReport.user}
                </span>
                
              </div>
              <button type="button" className="secondary-button" onClick={closeReportDetail}>
                <X size={16} />
                Cerrar
              </button>
            </div>

            <div style={{ padding: '20px 0', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '14px', background: '#f9fafb' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#6b7280' }}>Inicio jornada</span>
                  <strong style={{ display: 'block', marginTop: '8px' }}>{formatDateTime(selectedReport.openedAt)}</strong>
                </div>
                <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '14px', background: '#f9fafb' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#6b7280' }}>Fin jornada</span>
                  <strong style={{ display: 'block', marginTop: '8px' }}>{formatDateTime(selectedReport.closedAt)}</strong>
                </div>
                <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '14px', background: '#f9fafb' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#6b7280' }}>Apertura de caja</span>
                  <strong style={{ display: 'block', marginTop: '8px' }}>{money(selectedReport.openingCash || 0)}</strong>
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 0' }}>
              <h3 style={{ marginBottom: '16px' }}>Movimientos registrados</h3>
              {selectedReport.details?.sales?.length ? (
                <section style={{ marginBottom: '24px' }}>
                  <h4 style={{ marginBottom: '12px' }}>Ventas</h4>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {selectedReport.details.sales.map((sale) => (
                      <div key={sale.id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#ffffff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                          <strong>{sale.id}</strong>
                          <span style={{ color: '#6b7280' }}>{formatDateTime(sale.date)}</span>
                        </div>
                        <div style={{ marginTop: '8px', color: '#374151' }}>Método: {sale.paymentMethod}</div>
                        {sale.items?.length ? (
                          <div style={{ marginTop: '8px', color: '#374151' }}>
                            Productos: {sale.items.map((item) => `${item.name} x${item.quantity}`).join(', ')}
                          </div>
                        ) : null}
                        <div style={{ marginTop: '8px', fontWeight: 600 }}>Total: {money(sale.total)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {selectedReport.details?.services?.length ? (
                <section style={{ marginBottom: '24px' }}>
                  <h4 style={{ marginBottom: '12px' }}>Servicios</h4>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {selectedReport.details.services.map((service) => (
                      <div key={service.id} style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#ffffff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                          <strong>{service.device}</strong>
                          <span style={{ color: '#6b7280' }}>{service.status}</span>
                        </div>
                        <div style={{ marginTop: '8px', color: '#374151' }}>Cliente: {service.client}</div>
                        {service.repairDescription ? (
                          <div style={{ marginTop: '8px', color: '#374151' }}>Detalle: {service.repairDescription}</div>
                        ) : null}
                        <div style={{ marginTop: '8px', fontWeight: 600 }}>Costo: {money(service.serviceCost)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {!selectedReport.details?.sales?.length && !selectedReport.details?.services?.length ? (
                <p className="muted-message">No se registraron movimientos para esta jornada.</p>
              ) : null}
            </div>

            <div style={{ padding: '16px 0 0', borderTop: '1px solid #e5e7eb', marginTop: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '14px', background: '#f9fafb' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#6b7280' }}>Total Apertura</span>
                  <strong style={{ display: 'block', marginTop: '8px' }}>{money(selectedReport.openingCash || 0)}</strong>
                </div>
                <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '14px', background: '#f9fafb' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#6b7280' }}>Total Contado</span>
                  <strong style={{ display: 'block', marginTop: '8px' }}>{money(selectedReport.countedCash || 0)}</strong>
                </div>
                <div style={{ padding: '16px', border: '1px solid #e5e7eb', borderRadius: '14px', background: '#f9fafb' }}>
                  <span style={{ display: 'block', fontSize: '12px', color: '#6b7280' }}>Diferencia</span>
                  <strong style={{ display: 'block', marginTop: '8px' }}>{money(selectedReport.difference || 0)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default CashClose
