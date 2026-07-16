import { Lock, Eye, Unlock, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
  // Reporte diario admin desactivado temporalmente para futuras mejoras.
  const showAdminDailyReport = false
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
  const [salesDetailsOpen, setSalesDetailsOpen] = useState(false)
  const [servicesDetailsOpen, setServicesDetailsOpen] = useState(false)
  const [salesDetails, setSalesDetails] = useState([])
  const [servicesDetails, setServicesDetails] = useState([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [savingCash, setSavingCash] = useState(false)
  const isAdmin = user?.role === 'admin'
  const isClosed = Boolean(cashSummary.closedAt)
  const hasOpenCash = Boolean(cashSummary.openedAt && !isClosed)
  const displayUser = user?.name || cashSummary.user || 'Tecnico'
  const currentDate = useMemo(() => new Date().toLocaleDateString('es-EC'), [])
  const visibleReports = reports.slice(0, 5)
  const hasMoreReports = reports.length > 5
  const reportSalesByProduct = useMemo(() => {
    const productTotals = new Map()
    const sales = selectedReport?.details?.sales || []

    sales.forEach((sale) => {
      const items = sale.items || []
      if (!items.length) {
        const previous = productTotals.get('Venta sin detalle') || 0
        productTotals.set('Venta sin detalle', previous + Number(sale.total || 0))
        return
      }

      items.forEach((item) => {
        const name = item.name || 'Producto sin nombre'
        const amount = Number(item.price || 0) * Number(item.quantity || 1)
        const previous = productTotals.get(name) || 0
        productTotals.set(name, previous + amount)
      })
    })

    return Array.from(productTotals.entries()).map(([name, totalAmount]) => ({
      name,
      totalAmount,
    }))
  }, [selectedReport])

  const reportSalesTotal = useMemo(
    () => reportSalesByProduct.reduce((sum, product) => sum + product.totalAmount, 0),
    [reportSalesByProduct],
  )

  const reportServiceTransactions = useMemo(
    () =>
      (selectedReport?.details?.services || []).map((service) => ({
        label: `Orden ${service.id} ${String(service.paymentType || 'pago').toLowerCase()}`,
        amount: Number(service.serviceCost || 0),
      })),
    [selectedReport],
  )

  const reportServicesTotal = useMemo(
    () => reportServiceTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    [reportServiceTransactions],
  )

  useEffect(() => {
    // Solo se ejecuta cuando el usuario cambia (login/logout)
    // Limpiar datos de la sesión anterior
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSalesDetails([])
    setServicesDetails([])
    setSalesDetailsOpen(false)
    setServicesDetailsOpen(false)
    
  }, [user?.id, setData])

  useEffect(() => {
    // Actualizar solo los campos sin limpiar todo
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCountedCash(cashSummary.countedCash ?? 0)
    setOpeningCash(cashSummary.openingCash ?? 55)
  }, [cashSummary.countedCash, cashSummary.openingCash])

  const loadReports = useCallback(async () => {
    if (!showAdminDailyReport) {
      setReports([])
      return
    }

    try {
      const nextReports = await api.cashClose.getReports()
      setReports(nextReports)
    } catch {
      setReports([])
    }
  }, [showAdminDailyReport])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReports()
  }, [loadReports])

  useEffect(() => {
    // Cuando el usuario cambia (logout/login), recarga los datos desde el backend
    if (user?.id) {
      reload()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]) // Solo cuando el ID del usuario cambia

  async function closeCash() {
    if (isClosed || savingCash) return
    if (!hasOpenCash) return

    setSavingCash(true)
    try {
      await api.cashClose.close({
        openingCash,
        countedCash,
        openedAt: cashSummary.openedAt || new Date().toISOString(),
        closedAt: new Date().toISOString(),
        user: user?.name || cashSummary.user,
      })
      await loadReports()
      await reload()
    } finally {
      setSavingCash(false)
    }
  }

  async function openCash() {
    if (hasOpenCash || savingCash) return

    setSavingCash(true)
    try {
      await api.cashClose.open({
        ...(isClosed ? { reopen: true } : {
          startNewSession: true,
          openingCash,
          countedCash: 0,
          openedAt: new Date().toISOString(),
        }),
        user: user?.name || cashSummary.user,
      })
      await reload()
    } finally {
      setSavingCash(false)
    }
  }

  async function openCash() {
    if (hasOpenCash) return

    await api.cashClose.open({
      ...(isClosed ? { reopen: true } : {
        startNewSession: true,
        openingCash,
        countedCash: 0,
        openedAt: new Date().toISOString(),
      }),
      user: user?.name || cashSummary.user,
    })
    await reload()
  }

  function openReportDetail(report) {
    setSelectedReport(report)
  }

  function closeReportDetail() {
    setSelectedReport(null)
  }

  async function loadSalesDetails() {
    setLoadingDetails(true)
    try {
      const sales = await api.sales.list()
      
      // Validar que tenemos openedAt
      if (!cashSummary.openedAt) {
        setSalesDetails([])
        setData((prev) => ({
          ...prev,
          salesTotal: 0,
        }))
        setSalesDetailsOpen(true)
        return
      }
      
      // Filtrar ventas de la sesión activa actual (desde openedAt)
      const sessionStart = new Date(cashSummary.openedAt).getTime()
      const todaySales = (sales || []).filter((sale) => {
        const saleTime = new Date(sale.date || sale.createdAt).getTime()
        return saleTime >= sessionStart
      })
      setSalesDetails(todaySales)
      // Calcula el total correcto desde los items
      const correctTotal = todaySales.flatMap((sale) => sale.items || []).reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0)
      setData((prev) => ({
        ...prev,
        salesTotal: correctTotal,
      }))
      setSalesDetailsOpen(true)
    } catch (error) {
      console.error('Error cargando ventas:', error)
      setSalesDetails([])
      setSalesDetailsOpen(true)
    } finally {
      setLoadingDetails(false)
    }
  }

  async function loadServicesDetails() {
    setLoadingDetails(true)
    try {
      const services = await api.workOrders.list('', '')
      
      console.log('📋 Servicios obtenidos del API:', services)
      console.log('📋 cashSummary.openedAt:', cashSummary.openedAt)
      
      // Validar que tenemos openedAt
      if (!cashSummary.openedAt) {
        console.log('⚠️ No hay openedAt disponible')
        setServicesDetails([])
        setData((prev) => ({
          ...prev,
          serviceTotal: 0,
        }))
        setServicesDetailsOpen(true)
        return
      }
      
      // Filtrar servicios que fueron creados O entregados en esta sesión
      const sessionStart = new Date(cashSummary.openedAt).getTime()
      console.log('🔍 sessionStart timestamp:', sessionStart, 'fecha:', new Date(sessionStart))
      
      const todayServices = (services || []).filter((service) => {
        const createdTime = new Date(service.createdAt).getTime()
        const deliveredTime = service.deliveredAt ? new Date(service.deliveredAt).getTime() : null
        
        console.log(`✓ Servicio ${service.id}:`, {
          createdAt: service.createdAt,
          createdTime,
          deliveredAt: service.deliveredAt,
          deliveredTime,
          incluido: (createdTime >= sessionStart) || (deliveredTime && deliveredTime >= sessionStart)
        })
        
        // Incluir si fue creado desde openedAt O entregado desde openedAt
        return (createdTime >= sessionStart) || (deliveredTime && deliveredTime >= sessionStart)
      })
      
      console.log('📌 Servicios filtrados para hoy:', todayServices.length)
      
      setServicesDetails(todayServices)
      
      // Calcular total con la lógica correcta:
      // - Si creado Y entregado hoy: sumar abono + saldo (o service_cost si no hay saldo)
      // - Si entregado hoy (sin crear hoy): sumar saldo (o service_cost si no hay saldo)
      // - Si creado hoy pero NO entregado: sumar abono
      let correctServiceTotal = 0
      todayServices.forEach((service) => {
        const createdTime = new Date(service.createdAt).getTime()
        const deliveredTime = service.deliveredAt ? new Date(service.deliveredAt).getTime() : null
        
        const isDeliveredToday = deliveredTime && deliveredTime >= sessionStart
        const isCreatedToday = createdTime >= sessionStart
        
        console.log(`💰 Cálculo para ${service.id}:`, {
          isDeliveredToday,
          isCreatedToday,
          balance: service.balance,
          serviceCost: service.serviceCost,
          downpayment: service.downpayment,
        })
        
        if (isCreatedToday && isDeliveredToday) {
          // Si fue CREADO Y ENTREGADO el mismo día: sumar abono + saldo
          const downpayment = Number(service.downpayment || 0)
          const balance = Number(service.balance || 0)
          const serviceCost = Number(service.serviceCost || 0)
          const finalAmount = balance > 0 ? balance : serviceCost
          
          correctServiceTotal += downpayment + finalAmount
          console.log(`  → Creado y Entregado: suma ${downpayment} (abono) + ${finalAmount} (${balance > 0 ? 'saldo' : 'servicio'}) = ${downpayment + finalAmount}`)
        } else if (isDeliveredToday) {
          // Si fue SOLO ENTREGADO: sumar saldo (o service_cost si no hay saldo)
          const balance = Number(service.balance || 0)
          const serviceCost = Number(service.serviceCost || 0)
          const amount = balance > 0 ? balance : serviceCost
          
          correctServiceTotal += amount
          console.log(`  → Solo Entregado: suma ${amount} (${balance > 0 ? 'saldo' : 'servicio'})`)
        } else if (isCreatedToday && !deliveredTime) {
          // Si fue SOLO CREADO (no entregado): sumar abono
          const abono = Number(service.downpayment || 0)
          correctServiceTotal += abono
          console.log(`  → Solo Creado: suma ${abono} (abono)`)
        }
      })
      
      console.log('💵 Total servicios calculado:', correctServiceTotal)
      
      setData((prev) => ({
        ...prev,
        serviceTotal: correctServiceTotal,
      }))
      
      setServicesDetailsOpen(true)
    } catch (error) {
      console.error('Error cargando servicios:', error)
      setServicesDetails([])
      setServicesDetailsOpen(true)
    } finally {
      setLoadingDetails(false)
    }
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
            Fecha: <strong>{currentDate}</strong>
          </span>
          <span>
            Usuario: <strong>{displayUser}</strong>
          </span>
          {/*
          <span>
            Inicio jornada: <strong>{formatDateTime(cashSummary.openedAt)}</strong>
          </span>
          <span>
            Fin jornada: <strong>{formatDateTime(cashSummary.closedAt)}</strong>
          </span>
          */}
        </div>

        <div className="cash-summary">
          <h2>Resumen del dia</h2>
          <p style={{ cursor: 'pointer' }} onClick={loadSalesDetails} title="Haz clic para ver detalles">
            Total ventas (POS): <strong>{money(cashSummary.salesTotal)}</strong>
          </p>
          <p style={{ cursor: 'pointer' }} onClick={loadServicesDetails} title="Haz clic para ver detalles">
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
              placeholder="0.00"
              value={openingCash || ''}
              disabled={!hasOpenCash}
              onChange={(event) => {
                const val = event.target.value.replace(',', '.')
                const num = parseFloat(val)
                setOpeningCash(isNaN(num) ? 0 : num)
              }}
            />
          </p>
          <p>
            Efectivo en caja contado:
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={countedCash || ''}
              disabled={!hasOpenCash}
              onChange={(event) => {
                const val = event.target.value.replace(',', '.')
                const num = parseFloat(val)
                setCountedCash(isNaN(num) ? 0 : num)
              }}
            />
          </p>
          <p className="difference">
            Diferencia: <strong>{money(difference)}</strong>
          </p>
        </div>

        <div className="action-row">
<<<<<<< HEAD
          <button className="secondary-button" type="button" onClick={openCash} disabled={hasOpenCash || savingCash}>
            <Unlock size={17} />
            Aperturar caja
          </button>
          <button className="success-button" type="button" onClick={closeCash} disabled={!hasOpenCash || savingCash}>
=======
          <button className="secondary-button" type="button" onClick={openCash} disabled={hasOpenCash}>
            <Unlock size={17} />
            Aperturar caja
          </button>
          <button className="success-button" type="button" onClick={closeCash} disabled={!hasOpenCash}>
>>>>>>> mauricio
            <Lock size={17} />
            Cerrar caja
          </button>
        </div>
      </section>

      {isAdmin && showAdminDailyReport ? (
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

      {showAdminDailyReport && isHistoryModalOpen ? (
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

      {showAdminDailyReport && selectedReport ? (
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
              {reportSalesByProduct.length ? (
                <section style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '10px' }}>Ventas</h4>
                  <div style={{ padding: '14px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#ffffff' }}>
                    {reportSalesByProduct.map((product) => (
                      <div
                        key={product.name}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          paddingBottom: '8px',
                          borderBottom: '1px solid #eef2f7',
                          marginBottom: '8px',
                        }}
                      >
                        <span>{product.name}</span>
                        <strong>{money(product.totalAmount)}</strong>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontWeight: 700, color: '#008a3d' }}>
                      <span>Total</span>
                      <span>{money(reportSalesTotal)}</span>
                    </div>
                  </div>
                </section>
              ) : null}

              {reportServiceTransactions.length ? (
                <section style={{ marginBottom: '20px' }}>
                  <h4 style={{ marginBottom: '10px' }}>Servicios</h4>
                  <div style={{ padding: '14px', border: '1px solid #e5e7eb', borderRadius: '12px', background: '#ffffff' }}>
                    {reportServiceTransactions.map((tx, index) => (
                      <div
                        key={`${tx.label}-${index}`}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: '12px',
                          paddingBottom: '8px',
                          borderBottom: '1px solid #eef2f7',
                          marginBottom: '8px',
                        }}
                      >
                        <span>{tx.label}</span>
                        <strong>{money(tx.amount)}</strong>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', fontWeight: 700, color: '#008a3d' }}>
                      <span>Total</span>
                      <span>{money(reportServicesTotal)}</span>
                    </div>
                  </div>
                </section>
              ) : null}

              {!reportSalesByProduct.length && !reportServiceTransactions.length ? (
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

      {salesDetailsOpen ? (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSalesDetailsOpen(false)
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2>Detalle de ventas (POS)</h2>
                <span>Transacciones del día</span>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setSalesDetailsOpen(false)}
              >
                <X size={16} />
                Cerrar
              </button>
            </div>

            {loadingDetails ? (
              <p className="muted-message">Cargando detalles...</p>
            ) : salesDetails.length === 0 ? (
              <p className="muted-message">No hay ventas registradas hoy.</p>
            ) : (
              <div style={{ padding: '14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                {salesDetails.flatMap((sale) => sale.items || []).length > 0 ? (
                  <>
                    {salesDetails.flatMap((sale) => sale.items || []).map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}>
                        <span>{item.name} {item.quantity > 1 ? `x${item.quantity}` : ''}</span>
                        <span style={{ fontWeight: 600 }}>{money(item.price * (item.quantity || 1))}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #172033', fontWeight: 700, color: '#008a3d', fontSize: '16px' }}>
                      <span>TOTAL</span>
                      <span>{money(salesDetails.flatMap((sale) => sale.items || []).reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0))}</span>
                    </div>
                  </>
                ) : (
                  <>
                    {salesDetails.map((sale, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingBottom: '8px', borderBottom: idx < salesDetails.length - 1 ? '1px solid #e2e8f0' : 'none', marginBottom: '8px' }}>
                        <span>Venta registrada</span>
                        <span style={{ fontWeight: 600 }}>{money(sale.total || 0)}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #172033', fontWeight: 700, color: '#008a3d', fontSize: '16px' }}>
                      <span>TOTAL</span>
                      <span>{money(salesDetails.reduce((acc, sale) => acc + (sale.total || 0), 0))}</span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {servicesDetailsOpen ? (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setServicesDetailsOpen(false)
            }
          }}
        >
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h2>Detalle de servicios</h2>
                <span>Reparaciones del día</span>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setServicesDetailsOpen(false)}
              >
                <X size={16} />
                Cerrar
              </button>
            </div>

            {loadingDetails ? (
              <p className="muted-message">Cargando detalles...</p>
            ) : servicesDetails.length === 0 ? (
              <p className="muted-message">No hay servicios registrados hoy.</p>
            ) : (
              <div style={{ padding: '14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                {servicesDetails.map((service) => {
                  if (!cashSummary.openedAt) return null
                  
                  const sessionStart = new Date(cashSummary.openedAt).getTime()
                  const createdTime = new Date(service.createdAt).getTime()
                  const deliveredTime = service.deliveredAt ? new Date(service.deliveredAt).getTime() : null
                  
                  const isDeliveredToday = deliveredTime && deliveredTime >= sessionStart
                  const isCreatedToday = createdTime >= sessionStart
                  
                  // Coleccionar transacciones de esta orden
                  const transactions = []
                  
                  // Si fue creado hoy, añadir abono (si existe)
                  if (isCreatedToday) {
                    const downpayment = Number(service.downpayment || 0)
                    if (downpayment > 0) {
                      transactions.push({
                        id: `${service.id}-abono`,
                        serviceId: service.id,
                        type: 'Abono',
                        amount: downpayment
                      })
                    }
                  }
                  
                  // Si fue entregado hoy, añadir saldo o service_cost
                  if (isDeliveredToday) {
                    const balance = Number(service.balance || 0)
                    const serviceCost = Number(service.serviceCost || 0)
                    const amount = balance > 0 ? balance : serviceCost
                    const type = balance > 0 ? 'Saldo' : 'Servicio'
                    
                    if (amount > 0) {
                      transactions.push({
                        id: `${service.id}-${type.toLowerCase()}`,
                        serviceId: service.id,
                        type,
                        amount
                      })
                    }
                  }
                  
                  // Renderizar todas las transacciones de esta orden
                  return transactions.map((tx) => (
                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingBottom: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '8px' }}>
                      <span>{tx.serviceId} - {tx.type}</span>
                      <span style={{ fontWeight: 600 }}>{money(tx.amount)}</span>
                    </div>
                  ))
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '2px solid #172033', fontWeight: 700, color: '#008a3d', fontSize: '16px' }}>
                  <span>TOTAL</span>
                  <span>{money(cashSummary.serviceTotal)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  )
}

export default CashClose
