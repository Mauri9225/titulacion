CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_orders (
  id VARCHAR(20) PRIMARY KEY,
  accessories TEXT DEFAULT '',
  brand VARCHAR(80) DEFAULT '',
  document VARCHAR(30) NOT NULL,
  client VARCHAR(120) NOT NULL,
  device VARCHAR(120) NOT NULL,
  fault TEXT NOT NULL,
  model VARCHAR(80) DEFAULT '',
  notes TEXT DEFAULT '',
  repair_description TEXT DEFAULT '',
  phone VARCHAR(30) NOT NULL,
  service_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  downpayment NUMERIC(10, 2) NOT NULL DEFAULT 0,
  balance NUMERIC(10, 2) NOT NULL DEFAULT 0,
  delivery_date VARCHAR(30) DEFAULT '',
  status VARCHAR(40) NOT NULL DEFAULT 'Recibido',
  date VARCHAR(30) NOT NULL,
  technician VARCHAR(80) NOT NULL DEFAULT 'Tecnico',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
  id VARCHAR(20) PRIMARY KEY,
  customer VARCHAR(120) NOT NULL DEFAULT 'Consumidor final',
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(50) NOT NULL DEFAULT 'Efectivo',
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id VARCHAR(20) NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id VARCHAR(20) REFERENCES products(id) ON DELETE SET NULL,
  name VARCHAR(120) NOT NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS cash_closings (
  id VARCHAR(20) PRIMARY KEY,
  date VARCHAR(30) NOT NULL,
  "user" VARCHAR(80) NOT NULL DEFAULT 'Tecnico',
  sales_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  service_total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  opening_cash NUMERIC(10, 2) NOT NULL DEFAULT 55,
  counted_cash NUMERIC(10, 2) NOT NULL DEFAULT 0,
  difference NUMERIC(10, 2) NOT NULL DEFAULT 0,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(30) NOT NULL CHECK (role IN ('admin', 'staff')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (name, email, password_hash, role)
VALUES (
  'Administrador',
  'admin@admin.com',
  'electri-incom-admin:5f7c5d909d350f1474409d512a34ac0592368fbd46a061e12452c0b4f92a88cb',
  'admin'
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO products (id, name, category, stock, min_stock, price)
VALUES
  ('P001', 'Cable USB Tipo C', 'Accesorios', 45, 10, 2.50),
  ('P002', 'Cargador Samsung 25W', 'Cargadores', 18, 8, 8.50),
  ('P003', 'Audifonos inalambricos', 'Audifonos', 12, 6, 12.00),
  ('P004', 'Vidrio templado', 'Protectores', 8, 15, 3.00),
  ('P005', 'Estuche protector', 'Protectores', 5, 12, 4.00)
ON CONFLICT (id) DO NOTHING;

-- Work orders sample data removed to allow fresh numbering from #0001.
INSERT INTO sales (id, customer, subtotal, discount, total, payment_method)
VALUES ('V-0001', 'Consumidor final', 5.50, 0, 5.50, 'Efectivo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sale_items (sale_id, product_id, name, quantity, price)
SELECT 'V-0001', 'P001', 'Cable USB Tipo C', 1, 2.50
WHERE NOT EXISTS (
  SELECT 1 FROM sale_items WHERE sale_id = 'V-0001' AND product_id = 'P001'
);

INSERT INTO sale_items (sale_id, product_id, name, quantity, price)
SELECT 'V-0001', 'P004', 'Vidrio templado', 1, 3.00
WHERE NOT EXISTS (
  SELECT 1 FROM sale_items WHERE sale_id = 'V-0001' AND product_id = 'P004'
);
