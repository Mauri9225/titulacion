const { query } = require('../config/database');

function getProductStatus(product) {
  const minStock = product.min_stock ?? product.minStock;
  return Number(product.stock) <= Number(minStock) ? 'Bajo stock' : 'Disponible';
}

function normalizeProduct(product) {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    stock: Number(product.stock),
    minStock: Number(product.min_stock ?? product.minStock),
    price: Number(product.price),
    status: getProductStatus(product),
  };
}

async function list(filters = {}) {
  const search = filters.search || '';
  const category = filters.category || '';
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(
      `(id ILIKE $${params.length} OR name ILIKE $${params.length} OR category ILIKE $${params.length})`,
    );
  }

  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await query(
    `SELECT id, name, category, stock, min_stock, price
     FROM products
     ${where}
     ORDER BY id`,
    params,
  );

  return result.rows.map(normalizeProduct);
}

async function nextProductId() {
  const result = await query(`
    SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 2) AS INTEGER)), 0) + 1 AS next_id
    FROM products
    WHERE id ~ '^P[0-9]+$'
  `);

  return `P${String(result.rows[0].next_id).padStart(3, '0')}`;
}

async function create(payload) {
  const id = payload.id || (await nextProductId());
  const result = await query(
    `INSERT INTO products (id, name, category, stock, min_stock, price)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, category, stock, min_stock, price`,
    [
      id,
      payload.name,
      payload.category,
      Number(payload.stock || 0),
      Number(payload.minStock || 0),
      Number(payload.price || 0),
    ],
  );

  return normalizeProduct(result.rows[0]);
}

async function update(id, payload) {
  const current = await query('SELECT * FROM products WHERE id = $1', [id]);

  if (!current.rowCount) {
    return null;
  }

  const product = current.rows[0];
  const result = await query(
    `UPDATE products
     SET name = $2,
         category = $3,
         stock = $4,
         min_stock = $5,
         price = $6,
         updated_at = NOW()
     WHERE id = $1
     RETURNING id, name, category, stock, min_stock, price`,
    [
      id,
      payload.name ?? product.name,
      payload.category ?? product.category,
      payload.stock === undefined ? product.stock : Number(payload.stock),
      payload.minStock === undefined ? product.min_stock : Number(payload.minStock),
      payload.price === undefined ? product.price : Number(payload.price),
    ],
  );

  return normalizeProduct(result.rows[0]);
}

async function remove(id) {
  const result = await query('DELETE FROM products WHERE id = $1', [id]);
  return result.rowCount > 0;
}

module.exports = {
  create,
  list,
  remove,
  update,
};
