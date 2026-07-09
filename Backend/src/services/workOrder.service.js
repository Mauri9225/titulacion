const { query } = require('../config/database');

function normalizeOrder(row) {
  return {
    id: row.id,
    accessories: row.accessories,
    brand: row.brand,
    document: row.document,
    client: row.client,
    device: row.device,
    fault: row.fault,
    model: row.model,
    notes: row.notes,
    repairDescription: row.repair_description,
    phone: row.phone,
    serviceCost: Number(row.service_cost),
    downpayment: Number(row.downpayment),
    balance: Number(row.balance),
    deliveryDate: row.delivery_date,
    deliveredAt: row.delivered_at,
    createdAt: row.created_at,
    status: row.status,
    date: row.date,
    technician: row.technician,
  };
}

async function ensureWorkOrderSchema() {
  await query(`
    ALTER TABLE work_orders
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
  `);

  await query(`
    UPDATE work_orders AS w
    SET id = REGEXP_REPLACE(w.id, '^#', '')
    WHERE w.id ~ '^#[0-9]+$'
      AND NOT EXISTS (
        SELECT 1
        FROM work_orders AS existing
        WHERE existing.id = REGEXP_REPLACE(w.id, '^#', '')
      );
  `);

  await query(`
    UPDATE work_orders
    SET delivered_at = updated_at
    WHERE status = 'Entregado' AND delivered_at IS NULL;
  `);
}

async function list(filters = {}) {
  const search = filters.search || '';
  const status = filters.status || '';
  const params = [];
  const conditions = [];

  if (search) {
    params.push(`%${search}%`);
    conditions.push(`(
        id ILIKE $${params.length}
        OR client ILIKE $${params.length}
        OR document ILIKE $${params.length}
        OR device ILIKE $${params.length}
      )`);
  }

  if (status) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT *
     FROM work_orders
     ${where}
     ORDER BY created_at DESC, id DESC`,
    params,
  );

  return result.rows.map(normalizeOrder);
}

async function findById(id) {
  const normalizedId = String(id || '').replace(/^#/, '');
  const result = await query(
    `SELECT *
     FROM work_orders
     WHERE id = $1 OR id = $2
     ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END
     LIMIT 1`,
    [normalizedId, `#${normalizedId}`],
  );
  return result.rowCount ? normalizeOrder(result.rows[0]) : null;
}

async function nextWorkOrderId() {
  const result = await query(`
    SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(id, '^#', '') AS INTEGER)), 0) + 1 AS next_id
    FROM work_orders
    WHERE REGEXP_REPLACE(id, '^#', '') ~ '^[0-9]+$'
  `);

  return String(result.rows[0].next_id).padStart(4, '0');
}

function createValidationError(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function validateWorkOrder(payload) {
  const document = String(payload.document || '');
  const phone = String(payload.phone || '');

  if (!/^\d{1,13}$/.test(document)) {
    throw createValidationError('La cedula/RUC debe tener solo numeros y maximo 13 digitos.');
  }

  if (!/^\d{1,10}$/.test(phone)) {
    throw createValidationError('El telefono debe tener solo numeros y maximo 10 digitos.');
  }
}

async function create(payload) {
  await ensureWorkOrderSchema();
  validateWorkOrder(payload);

  const id = await nextWorkOrderId();
  const date = new Date().toLocaleDateString('es-EC');
  const result = await query(
    `INSERT INTO work_orders (
       id, accessories, brand, document, client, device, fault, model, notes,
       repair_description, phone, service_cost, downpayment, balance,
       delivery_date, status, date, technician
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
     RETURNING *`,
    [
      id,
      payload.accessories || '',
      payload.brand || '',
      payload.document,
      payload.client,
      payload.device,
      payload.fault,
      payload.model || '',
      payload.notes || '',
      payload.repairDescription || '',
      payload.phone,
      Number(payload.serviceCost || 0),
      Number(payload.downpayment || 0),
      Number(payload.balance || 0),
      payload.deliveryDate || '',
      'Recibido',
      date,
      payload.technician || 'Tecnico',
    ],
  );

  return normalizeOrder(result.rows[0]);
}

async function updateStatus(id, payload) {
  await ensureWorkOrderSchema();

  const normalizedId = String(id || '').replace(/^#/, '');
  const current = await query(
    `SELECT *
     FROM work_orders
     WHERE id = $1 OR id = $2
     ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END
     LIMIT 1`,
    [normalizedId, `#${normalizedId}`],
  );

  if (!current.rowCount) {
    return null;
  }

  const order = current.rows[0];
  const nextStatus = payload.status || order.status;
  const deliveredAt =
    nextStatus === 'Entregado' && !order.delivered_at
      ? new Date().toISOString()
      : order.delivered_at;
  const result = await query(
    `UPDATE work_orders
     SET status = $2,
         service_cost = $3,
         downpayment = $4,
         balance = $5,
         delivery_date = $6,
         repair_description = $7,
         delivered_at = $8,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [
      id,
      nextStatus,
      payload.serviceCost === undefined ? order.service_cost : Number(payload.serviceCost),
      payload.downpayment === undefined ? order.downpayment : Number(payload.downpayment),
      payload.balance === undefined ? order.balance : Number(payload.balance),
      payload.deliveryDate === undefined ? order.delivery_date : payload.deliveryDate || '',
      payload.repairDescription === undefined
        ? order.repair_description
        : payload.repairDescription || '',
      deliveredAt,
    ],
  );

  return normalizeOrder(result.rows[0]);
}

module.exports = {
  create,
  findById,
  list,
  updateStatus,
};
