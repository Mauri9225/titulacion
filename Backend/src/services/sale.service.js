const { pool, query } = require('../config/database');

function normalizeSale(row) {
  return {
    id: row.id,
    customer: row.customer,
    items: row.items || [],
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    total: Number(row.total),
    paymentMethod: row.payment_method,
    date: row.date,
  };
}

async function list() {
  const result = await query(`
    SELECT
      sales.id,
      sales.customer,
      sales.subtotal,
      sales.discount,
      sales.total,
      sales.payment_method,
      sales.date,
      COALESCE(
        json_agg(
          json_build_object(
            'id', sale_items.product_id,
            'name', sale_items.name,
            'quantity', sale_items.quantity,
            'price', sale_items.price
          )
          ORDER BY sale_items.id
        ) FILTER (WHERE sale_items.id IS NOT NULL),
        '[]'
      ) AS items
    FROM sales
    LEFT JOIN sale_items ON sale_items.sale_id = sales.id
    GROUP BY sales.id
    ORDER BY sales.date DESC
  `);

  return result.rows.map(normalizeSale);
}

async function nextSaleId(client) {
  const result = await client.query(`
    SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 3) AS INTEGER)), 0) + 1 AS next_id
    FROM sales
    WHERE id ~ '^V-[0-9]+$'
  `);

  return `V-${String(result.rows[0].next_id).padStart(4, '0')}`;
}

async function create(payload) {
  const items = payload.items || [];
  const subtotal = items.reduce((sum, item) => {
    if (item.type === 'recharge') {
      return sum + Number(item.amount || item.price || 0);
    }

    return sum + Number(item.price) * Number(item.quantity);
  }, 0);
  const discount = Number(payload.discount || 0);
  const total = subtotal - discount;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const id = await nextSaleId(client);
    const saleResult = await client.query(
      `INSERT INTO sales (id, customer, subtotal, discount, total, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, customer, subtotal, discount, total, payment_method, date`,
      [
        id,
        payload.customer || 'Consumidor final',
        subtotal,
        discount,
        total,
        payload.paymentMethod || 'Efectivo',
      ],
    );

    for (const item of items) {
      if (item.type === 'recharge') {
        const amount = Number(item.amount || item.price || 0);
        await client.query(
          `INSERT INTO sale_items (sale_id, product_id, name, quantity, price)
           VALUES ($1, NULL, $2, 1, $3)`,
          [id, item.name || 'Recarga', amount],
        );
        continue;
      }

      const quantity = Number(item.quantity);
      const productResult = await client.query(
        'SELECT id, name, stock, price FROM products WHERE id = $1 FOR UPDATE',
        [item.id],
      );

      if (!productResult.rowCount) {
        const error = new Error(`Producto ${item.id} no encontrado`);
        error.status = 400;
        throw error;
      }

      const product = productResult.rows[0];
      if (Number(product.stock) < quantity) {
        const error = new Error(`Stock insuficiente para ${product.name}`);
        error.status = 400;
        throw error;
      }

      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, name, quantity, price)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, product.id, product.name, quantity, Number(item.price)],
      );
      await client.query(
        `UPDATE products
         SET stock = stock - $2, updated_at = NOW()
         WHERE id = $1`,
        [product.id, quantity],
      );
    }

    await client.query('COMMIT');

    return normalizeSale({
      ...saleResult.rows[0],
      items,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  create,
  list,
};
