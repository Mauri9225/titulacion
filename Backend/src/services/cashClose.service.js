const { query } = require('../config/database');

const DEFAULT_OPENING_CASH = 55;

function resolveOpeningCash(value) {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_OPENING_CASH;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_OPENING_CASH;
  }

  return parsed;
}

async function ensureCashClosingSchema() {
  await query(`
    ALTER TABLE cash_closings
    ADD COLUMN IF NOT EXISTS opening_cash NUMERIC(10, 2) NOT NULL DEFAULT 55,
    ADD COLUMN IF NOT EXISTS counted_cash NUMERIC(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS difference NUMERIC(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);

  await query(`
    ALTER TABLE cash_closings
    ALTER COLUMN closed_at DROP NOT NULL;
  `);

  await query(`
    ALTER TABLE cash_closings
    ALTER COLUMN opening_cash SET DEFAULT 55;
  `);

  await query(`
    ALTER TABLE work_orders
    ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
  `);

  await query(`
    UPDATE work_orders
    SET delivered_at = updated_at
    WHERE status = 'Entregado' AND delivered_at IS NULL;
  `);
}

function normalizeCashClose(row) {
  return {
    id: row.id,
    date: row.date,
    user: row.user,
    salesTotal: Number(row.sales_total),
    serviceTotal: Number(row.service_total),
    openingCash: resolveOpeningCash(row.opening_cash),
    countedCash: Number(row.counted_cash),
    difference: Number(row.difference),
    openedAt: row.opened_at,
    closedAt: row.closed_at,
  };
}

async function getTodaySummary(authUser = null) {
  await ensureCashClosingSchema();

  const today = new Date().toLocaleDateString('es-EC');
  const userName = authUser?.name || authUser?.email || 'Tecnico';

  const activeSession = await query(
    `SELECT id, date, "user", opening_cash, counted_cash, opened_at, closed_at
     FROM cash_closings
     WHERE closed_at IS NULL
     ORDER BY opened_at DESC, id DESC
     LIMIT 1`,
  );

  const closedSessionToday = await getLatestClosedSessionToday(today);

  // If there is an active session, compute totals starting from the session open time.
  let salesTotal = 0;
  let serviceTotal = 0;
  if (activeSession.rowCount) {
    const start = activeSession.rows[0].opened_at;
    const result = await query(
      `SELECT
         COALESCE((SELECT SUM(total) FROM sales WHERE date >= $1), 0) AS sales_total,
         COALESCE((
           SELECT SUM(downpayment)
           FROM work_orders
           WHERE created_at >= $1
         ), 0)
         +
         COALESCE((
           SELECT SUM(balance)
           FROM work_orders
           WHERE status = 'Entregado' AND delivered_at >= $1
         ), 0) AS service_total
      `,
      [start.toISOString()],
    );

    salesTotal = Number(result.rows[0].sales_total);
    serviceTotal = Number(result.rows[0].service_total);
  } else if (closedSessionToday) {
    salesTotal = Number(closedSessionToday.sales_total);
    serviceTotal = Number(closedSessionToday.service_total);
  } else {
    // No active session: treat as a fresh state for a new jornada — show zeros
    // so the UI starts with an empty session. Historical totals remain available
    // in the reports endpoint.
    salesTotal = 0;
    serviceTotal = 0;
  }

  const initialCountedCash = 0;

  if (activeSession.rowCount) {
    const row = activeSession.rows[0];
    return {
      date: row.date || today,
      user: row.user || userName,
      salesTotal,
      serviceTotal,
      openingCash: resolveOpeningCash(row.opening_cash),
      countedCash: Number(row.counted_cash ?? initialCountedCash),
      openedAt: row.opened_at,
      closedAt: row.closed_at,
    };
  }

  if (closedSessionToday) {
    return {
      date: closedSessionToday.date || today,
      user: closedSessionToday.user || userName,
      salesTotal,
      serviceTotal,
      openingCash: resolveOpeningCash(closedSessionToday.opening_cash),
      countedCash: Number(closedSessionToday.counted_cash ?? initialCountedCash),
      openedAt: closedSessionToday.opened_at,
      closedAt: closedSessionToday.closed_at,
    };
  }

  return {
    date: today,
    user: userName,
    salesTotal,
    serviceTotal,
    openingCash: DEFAULT_OPENING_CASH,
    countedCash: initialCountedCash,
    openedAt: null,
    closedAt: null,
  };
}

async function nextCashCloseId() {
  const result = await query(`
    SELECT COALESCE(MAX(CAST(SUBSTRING(id FROM 4) AS INTEGER)), 0) + 1 AS next_id
    FROM cash_closings
    WHERE id ~ '^CC-[0-9]+$'
  `);

  return `CC-${String(result.rows[0].next_id).padStart(4, '0')}`;
}

async function getActiveSession() {
  const result = await query(
    `SELECT id, date, "user", opening_cash, counted_cash, opened_at, closed_at
     FROM cash_closings
     WHERE closed_at IS NULL
     ORDER BY opened_at DESC, id DESC
     LIMIT 1`,
  );

  return result.rowCount ? result.rows[0] : null;
}

async function getLatestClosedSessionToday(today) {
  const result = await query(
    `SELECT id, date, "user", sales_total, service_total, opening_cash, counted_cash, difference, opened_at, closed_at
     FROM cash_closings
     WHERE date = $1
       AND closed_at IS NOT NULL
     ORDER BY closed_at DESC, id DESC
     LIMIT 1`,
    [today],
  );

  return result.rowCount ? result.rows[0] : null;
}

async function create(payload, authUser = null) {
  await ensureCashClosingSchema();
  const summary = await getTodaySummary(authUser);
  const userName = payload.user || authUser?.name || summary.user || 'Tecnico';
  const today = new Date().toLocaleDateString('es-EC');
  const latestClosedToday = await getLatestClosedSessionToday(today);
  const openingCash = resolveOpeningCash(payload.openingCash ?? summary.openingCash);
  const countedCash = Number(payload.countedCash ?? summary.countedCash ?? 0);
  const difference = countedCash - openingCash - summary.salesTotal - summary.serviceTotal;
  const openedAt = payload.openedAt || summary.openedAt || new Date().toISOString();
  const closedAt = payload.closedAt ?? null;

  let activeSession = await getActiveSession();

<<<<<<< HEAD
  // Reopen the latest closed jornada so a cashier can correct a typed amount
  // before closing the same record again. Totals are recalculated on close.
=======
  // Reopen the latest closed jornada to correct a typed amount before closing it again.
>>>>>>> mauricio
  if (payload.reopen && !activeSession && latestClosedToday) {
    const result = await query(
      `UPDATE cash_closings
       SET "user" = $2,
           closed_at = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, date, "user", sales_total, service_total, opening_cash, counted_cash, difference, opened_at, closed_at`,
      [latestClosedToday.id, userName],
    );

    return normalizeCashClose(result.rows[0]);
  }

  if (payload.closedAt && !activeSession && latestClosedToday) {
    return normalizeCashClose(latestClosedToday);
  }

  if (payload.startNewSession && !activeSession && latestClosedToday) {
    return normalizeCashClose(latestClosedToday);
  }

  if (payload.startNewSession && activeSession) {
    const previousOpeningCash = resolveOpeningCash(activeSession.opening_cash);
    const previousCountedCash = Number(activeSession.counted_cash ?? 0);
    const previousDifference = previousCountedCash - previousOpeningCash - summary.salesTotal - summary.serviceTotal;
    const previousClosedAt = payload.closedAt || new Date().toISOString();

    await query(
      `UPDATE cash_closings
       SET "user" = $2,
           sales_total = $3,
           service_total = $4,
           opening_cash = $5,
           counted_cash = $6,
           difference = $7,
           opened_at = $8,
           closed_at = $9,
           updated_at = NOW()
       WHERE id = $1`,
      [
        activeSession.id,
        userName,
        summary.salesTotal,
        summary.serviceTotal,
        previousOpeningCash,
        previousCountedCash,
        previousDifference,
        activeSession.opened_at,
        previousClosedAt,
      ],
    );

    activeSession = null;
  }

  if (payload.closedAt) {
    if (!activeSession) {
      const result = await query(
        `INSERT INTO cash_closings (
           id, date, "user", sales_total, service_total, opening_cash, counted_cash, difference, opened_at, closed_at
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, date, "user", sales_total, service_total, opening_cash, counted_cash, difference, opened_at, closed_at`,
        [
          await nextCashCloseId(),
          summary.date,
          userName,
          summary.salesTotal,
          summary.serviceTotal,
          openingCash,
          countedCash,
          difference,
          openedAt,
          closedAt,
        ],
      );

      return normalizeCashClose(result.rows[0]);
    }

    const result = await query(
      `UPDATE cash_closings
       SET "user" = $2,
           sales_total = $3,
           service_total = $4,
           opening_cash = $5,
           counted_cash = $6,
           difference = $7,
           opened_at = $8,
           closed_at = $9,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, date, "user", sales_total, service_total, opening_cash, counted_cash, difference, opened_at, closed_at`,
      [
        activeSession.id,
        userName,
        summary.salesTotal,
        summary.serviceTotal,
        openingCash,
        countedCash,
        difference,
        openedAt,
        closedAt,
      ],
    );

    return normalizeCashClose(result.rows[0]);
  }

  if (activeSession) {
    const result = await query(
      `UPDATE cash_closings
       SET "user" = $2,
           sales_total = $3,
           service_total = $4,
           opening_cash = $5,
           counted_cash = $6,
           difference = $7,
           opened_at = $8,
           closed_at = NULL,
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, date, "user", sales_total, service_total, opening_cash, counted_cash, difference, opened_at, closed_at`,
      [
        activeSession.id,
        userName,
        summary.salesTotal,
        summary.serviceTotal,
        openingCash,
        countedCash,
        difference,
        openedAt,
      ],
    );

    return normalizeCashClose(result.rows[0]);
  }

  // Determine the values to insert for a newly opened session. If caller
  // explicitly requested a new session (`startNewSession`), start totals at 0.
  const insertSales = (payload.startNewSession && !payload.closedAt) ? 0 : ((!activeSession && !payload.closedAt) ? 0 : summary.salesTotal);
  const insertService = (payload.startNewSession && !payload.closedAt) ? 0 : ((!activeSession && !payload.closedAt) ? 0 : summary.serviceTotal);

  const result = await query(
    `INSERT INTO cash_closings (
       id, date, "user", sales_total, service_total, opening_cash, counted_cash, difference, opened_at, closed_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING id, date, "user", sales_total, service_total, opening_cash, counted_cash, difference, opened_at, closed_at`,
    [
      await nextCashCloseId(),
      summary.date,
      userName,
      insertSales,
      insertService,
      openingCash,
      countedCash,
      difference,
      openedAt,
      null,
    ],
  );

  return normalizeCashClose(result.rows[0]);
}

async function getReportDetails(report) {
  const start = report.openedAt ? new Date(report.openedAt) : null;
  const end = report.closedAt ? new Date(report.closedAt) : new Date();
  const params = [];
  const salesConditions = [];

  if (start) {
    params.push(start.toISOString());
    salesConditions.push(`sales.date >= $${params.length}`);
  }

  if (end) {
    params.push(end.toISOString());
    salesConditions.push(`sales.date <= $${params.length}`);
  }

  const salesWhere = salesConditions.length ? `WHERE ${salesConditions.join(' AND ')}` : '';

  const salesResult = await query(
    `SELECT
       sales.id,
       sales.customer,
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
     ${salesWhere}
     GROUP BY sales.id
     ORDER BY sales.date DESC`,
    params,
  );

  const workOrderParams = [];
  const downpaymentConditions = ['downpayment > 0'];
  const balanceConditions = ["status = 'Entregado'", 'balance > 0'];

  if (start) {
    workOrderParams.push(start.toISOString());
    downpaymentConditions.push(`created_at >= $${workOrderParams.length}`);
    balanceConditions.push(`delivered_at >= $${workOrderParams.length}`);
  }

  if (end) {
    workOrderParams.push(end.toISOString());
    downpaymentConditions.push(`created_at <= $${workOrderParams.length}`);
    balanceConditions.push(`delivered_at <= $${workOrderParams.length}`);
  }

  const downpaymentWhere = `WHERE ${downpaymentConditions.join(' AND ')}`;
  const balanceWhere = `WHERE ${balanceConditions.join(' AND ')}`;

  const workOrdersResult = await query(
    `SELECT id, client, device, status, downpayment AS amount, 'Abono' AS payment_type,
            repair_description, created_at AS payment_date
     FROM work_orders
     ${downpaymentWhere}
     UNION ALL
     SELECT id, client, device, status, balance AS amount, 'Saldo' AS payment_type,
            repair_description, delivered_at AS payment_date
     FROM work_orders
     ${balanceWhere}
     ORDER BY payment_date DESC`,
    workOrderParams,
  );

  return {
    sales: salesResult.rows.map((row) => ({
      id: row.id,
      customer: row.customer,
      total: Number(row.total),
      paymentMethod: row.payment_method,
      date: row.date,
      items: row.items || [],
    })),
    services: workOrdersResult.rows.map((row) => ({
      id: row.id,
      client: row.client,
      device: row.device,
      status: row.status,
      serviceCost: Number(row.amount),
      paymentType: row.payment_type,
      repairDescription: row.repair_description,
      updatedAt: row.payment_date,
    })),
  };
}

async function listReports() {
  await ensureCashClosingSchema();
  const result = await query(`
    SELECT id, date, "user", sales_total, service_total, opening_cash, counted_cash, difference, opened_at, closed_at
    FROM cash_closings
    ORDER BY COALESCE(closed_at, opened_at, NOW()) DESC, date DESC
  `);

  const reports = [];
  for (const row of result.rows) {
    const report = normalizeCashClose(row);
    reports.push({
      ...report,
      details: await getReportDetails(report),
    });
  }

  return reports;
}

module.exports = {
  create,
  getTodaySummary,
  listReports,
};
