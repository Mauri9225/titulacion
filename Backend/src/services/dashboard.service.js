const { query } = require('../config/database');

const ECUADOR_TIME_ZONE = 'America/Guayaquil';

function normalizeRecentOrder(row) {
  return {
    id: row.id,
    client: row.client,
    device: row.device,
    status: row.status,
  };
}

async function ensureDashboardSchema() {
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

async function getSummary() {
  await ensureDashboardSchema();

  const [statsResult, chartResult, recentResult] = await Promise.all([
    query(`
      SELECT
        COUNT(*) FILTER (WHERE status <> 'Entregado') AS active_work_orders,
        COUNT(*) FILTER (WHERE status = 'Entregado') AS delivered_work_orders,
        (SELECT COUNT(*) FROM products WHERE stock <= min_stock) AS low_stock_products,
        (
          COALESCE((
            SELECT SUM(total)
            FROM sales
            WHERE (date AT TIME ZONE '${ECUADOR_TIME_ZONE}')::date = (NOW() AT TIME ZONE '${ECUADOR_TIME_ZONE}')::date
          ), 0)
          +
          COALESCE((
            SELECT SUM(downpayment)
            FROM work_orders
            WHERE (created_at AT TIME ZONE '${ECUADOR_TIME_ZONE}')::date = (NOW() AT TIME ZONE '${ECUADOR_TIME_ZONE}')::date
          ), 0)
          +
          COALESCE((
            SELECT SUM(
              CASE
                WHEN balance > 0 THEN balance
                ELSE GREATEST(service_cost - downpayment, 0)
              END
            )
            FROM work_orders
            WHERE status = 'Entregado'
              AND (delivered_at AT TIME ZONE '${ECUADOR_TIME_ZONE}')::date = (NOW() AT TIME ZONE '${ECUADOR_TIME_ZONE}')::date
          ), 0)
        ) AS income_today
      FROM work_orders
    `),
    query(`
      SELECT day::date AS day, COALESCE(SUM(amount), 0) AS total
      FROM generate_series(
        (NOW() AT TIME ZONE '${ECUADOR_TIME_ZONE}')::date - INTERVAL '5 days',
        (NOW() AT TIME ZONE '${ECUADOR_TIME_ZONE}')::date,
        INTERVAL '1 day'
      ) AS day
      LEFT JOIN (
        SELECT (date AT TIME ZONE '${ECUADOR_TIME_ZONE}')::date AS income_date, total AS amount FROM sales
        UNION ALL
        SELECT (created_at AT TIME ZONE '${ECUADOR_TIME_ZONE}')::date AS income_date, downpayment AS amount
        FROM work_orders
        WHERE downpayment > 0
        UNION ALL
        SELECT (delivered_at AT TIME ZONE '${ECUADOR_TIME_ZONE}')::date AS income_date,
               CASE
                 WHEN balance > 0 THEN balance
                 ELSE GREATEST(service_cost - downpayment, 0)
               END AS amount
        FROM work_orders
        WHERE status = 'Entregado'
          AND (balance > 0 OR service_cost > downpayment)
          AND delivered_at IS NOT NULL
      ) income ON income.income_date = day::date
      GROUP BY day
      ORDER BY day
    `),
    query(`
      SELECT id, client, device, status
      FROM work_orders
      ORDER BY created_at DESC
      LIMIT 3
    `),
  ]);

  const stats = statsResult.rows[0];
  const incomeToday = Number(stats.income_today);

  return {
    stats: [
      { label: 'Trabajos activos', value: Number(stats.active_work_orders), tone: 'green' },
      {
        label: 'Equipos entregados',
        value: Number(stats.delivered_work_orders),
        tone: 'blue',
      },
      {
        label: 'Productos en stock bajo',
        value: Number(stats.low_stock_products),
        tone: 'orange',
      },
      {
        label: 'Ingresos del dia',
        value: `$ ${incomeToday.toFixed(2)}`,
        tone: 'purple',
      },
    ],
    chartPoints: chartResult.rows.map((row) => {
      const label = row.day instanceof Date ? row.day.toISOString().split('T')[0] : String(row.day)
      return {
        label,
        total: Number(row.total),
      }
    }),
    recentWorkOrders: recentResult.rows.map(normalizeRecentOrder),
  };
}

module.exports = {
  getSummary,
};
