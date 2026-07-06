export const dashboardStats = [
  { label: 'Trabajos activos', value: 12, tone: 'green' },
  { label: 'Ordenes abiertas', value: 8, tone: 'blue' },
  { label: 'Productos en stock bajo', value: 23, tone: 'orange' },
  { label: 'Ingresos del dia', value: '$ 1,320.00', tone: 'purple' },
]

export const chartPoints = [8, 14, 18, 26, 31, 46]

export const workOrders = [
  {
    id: '#1024',
    client: 'Juan Perez',
    device: 'Samsung Galaxy A54',
    fault: 'Pantalla rota, no da imagen',
    status: 'Recibido',
    date: '20/05/2026',
    technician: 'Tecnico',
  },
  {
    id: '#1023',
    client: 'Maria Solorzano',
    device: 'iPhone 11',
    fault: 'No enciende',
    status: 'En reparacion',
    date: '20/05/2026',
    technician: 'Tecnico',
  },
  {
    id: '#1022',
    client: 'Carlos Rojas',
    device: 'Huawei P40',
    fault: 'Cambio de bateria',
    status: 'Reparado',
    date: '19/05/2026',
    technician: 'Tecnico',
  },
]

export const products = [
  {
    id: 'P001',
    name: 'Cable USB Tipo C',
    category: 'Accesorios',
    stock: 45,
    minStock: 10,
    price: 2.5,
    status: 'Disponible',
  },
  {
    id: 'P002',
    name: 'Cargador Samsung 25W',
    category: 'Cargadores',
    stock: 18,
    minStock: 8,
    price: 8.5,
    status: 'Disponible',
  },
  {
    id: 'P003',
    name: 'Audifonos inalambricos',
    category: 'Audifonos',
    stock: 12,
    minStock: 6,
    price: 12,
    status: 'Disponible',
  },
  {
    id: 'P004',
    name: 'Vidrio templado',
    category: 'Protectores',
    stock: 8,
    minStock: 15,
    price: 3,
    status: 'Bajo stock',
  },
  {
    id: 'P005',
    name: 'Estuche protector',
    category: 'Protectores',
    stock: 5,
    minStock: 12,
    price: 4,
    status: 'Bajo stock',
  },
]

export const ticketItems = [
  { id: 'P001', name: 'Cable USB Tipo C', quantity: 1, price: 2.5 },
  { id: 'P004', name: 'Vidrio templado', quantity: 1, price: 3 },
]

export const cashSummary = {
  date: '20/05/2026',
  user: 'Tecnico',
  salesTotal: 87.5,
  serviceTotal: 1120,
  countedCash: 1207.5,
}
