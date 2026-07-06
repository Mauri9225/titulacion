const products = [
  {
    id: 'P001',
    name: 'Cable USB Tipo C',
    category: 'Accesorios',
    stock: 45,
    minStock: 10,
    price: 2.5,
  },
  {
    id: 'P002',
    name: 'Cargador Samsung 25W',
    category: 'Cargadores',
    stock: 18,
    minStock: 8,
    price: 8.5,
  },
  {
    id: 'P003',
    name: 'Audifonos inalambricos',
    category: 'Audifonos',
    stock: 12,
    minStock: 6,
    price: 12,
  },
  {
    id: 'P004',
    name: 'Vidrio templado',
    category: 'Protectores',
    stock: 8,
    minStock: 15,
    price: 3,
  },
  {
    id: 'P005',
    name: 'Estuche protector',
    category: 'Protectores',
    stock: 5,
    minStock: 12,
    price: 4,
  },
];

const workOrders = [
  {
    id: '#1024',
    accessories: 'Estuche protector',
    brand: 'Samsung',
    document: '172600XXXX',
    client: 'Juan Perez',
    device: 'Samsung Galaxy A54',
    fault: 'Pantalla rota, no da imagen',
    model: 'Galaxy A54',
    notes: 'Equipo recibido con mica rota.',
    phone: '0998765432',
    status: 'Recibido',
    date: '20/05/2026',
    technician: 'Tecnico',
    serviceCost: 0,
    downpayment: 0,
    balance: 0,
    deliveryDate: '',
  },
  {
    id: '#1023',
    accessories: 'Sin accesorios',
    brand: 'Apple',
    document: '091234XXXX',
    client: 'Maria Solorzano',
    device: 'iPhone 11',
    fault: 'No enciende',
    model: '11',
    notes: '',
    phone: '0987654321',
    status: 'En reparacion',
    date: '20/05/2026',
    technician: 'Tecnico',
    serviceCost: 0,
    downpayment: 0,
    balance: 0,
    deliveryDate: '',
  },
  {
    id: '#1022',
    accessories: 'Cargador',
    brand: 'Huawei',
    document: '130987XXXX',
    client: 'Carlos Rojas',
    device: 'Huawei P40',
    fault: 'Cambio de bateria',
    model: 'P40',
    notes: '',
    phone: '0971112233',
    status: 'Entregado',
    date: '19/05/2026',
    technician: 'Tecnico',
    serviceCost: 35,
    downpayment: 0,
    balance: 0,
    deliveryDate: '22/05/2026',
  },
];

const sales = [
  {
    id: 'V-0001',
    customer: 'Consumidor final',
    items: [
      { id: 'P001', name: 'Cable USB Tipo C', quantity: 1, price: 2.5 },
      { id: 'P004', name: 'Vidrio templado', quantity: 1, price: 3 },
    ],
    subtotal: 5.5,
    discount: 0,
    total: 5.5,
    paymentMethod: 'Efectivo',
    date: new Date().toISOString(),
  },
];

const cashClosings = [];

function nextProductId() {
  return `P${String(products.length + 1).padStart(3, '0')}`;
}

function nextWorkOrderId() {
  const numericIds = workOrders.map((order) => Number(order.id.replace('#', '')));
  const nextId = Math.max(...numericIds, 1024) + 1;

  return `#${nextId}`;
}

function nextSaleId() {
  return `V-${String(sales.length + 1).padStart(4, '0')}`;
}

module.exports = {
  cashClosings,
  nextProductId,
  nextSaleId,
  nextWorkOrderId,
  products,
  sales,
  workOrders,
};
