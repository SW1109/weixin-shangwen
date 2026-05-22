const { z } = require('zod')
const { ok, fail } = require('../lib/http')
const { mapCategoryRow, mapDishRow } = require('../lib/mappers')
const { canTransition, hydrateOrders } = require('../lib/orders')

const categorySchema = z.object({
  name: z.string().min(1),
  sort: z.coerce.number().int().min(0),
  icon: z.string().nullable().optional(),
  status: z.coerce.number().int().min(0).max(1),
})

const dishSchema = z.object({
  id: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive(),
  name: z.string().min(1),
  image: z.string().min(1),
  price: z.coerce.number().positive(),
  originalPrice: z.union([z.coerce.number().positive(), z.null()]).optional(),
  description: z.string().default(''),
  stock: z.coerce.number().int(),
  status: z.coerce.number().int().min(0).max(1),
  isRecommend: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  sort: z.coerce.number().int().min(0).default(0),
})

const orderStatusLabels = {
  1: '待支付',
  2: '待配送',
  3: '配送中',
  4: '已完成',
  5: '已取消',
}

function roundMetric(value, precision = 2) {
  return Number(Number(value || 0).toFixed(precision))
}

function formatDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatShortDateLabel(dateKey) {
  const [, month, day] = dateKey.split('-')
  return `${Number(month)}/${Number(day)}`
}

function buildTrendBuckets({ range, start, end, startDate, endDate }) {
  if (range === 'today' && !startDate && !endDate) {
    return {
      mode: 'hour',
      buckets: Array.from({ length: 24 }, (_, hour) => ({
        key: String(hour),
        label: `${String(hour).padStart(2, '0')}:00`,
      })),
    }
  }

  const buckets = []
  const current = new Date(start)
  current.setHours(0, 0, 0, 0)
  const final = new Date(end)
  final.setHours(0, 0, 0, 0)

  while (current <= final) {
    const key = formatDateKey(current)
    buckets.push({
      key,
      label: formatShortDateLabel(key),
    })
    current.setDate(current.getDate() + 1)
  }

  return {
    mode: 'day',
    buckets,
  }
}

function buildRange({ range = 'today', startDate, endDate } = {}) {
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const start = new Date()
  start.setHours(0, 0, 0, 0)

  if (startDate || endDate) {
    const startFromQuery = startDate ? new Date(startDate) : start
    const endFromQuery = endDate ? new Date(endDate) : end
    startFromQuery.setHours(0, 0, 0, 0)
    endFromQuery.setHours(23, 59, 59, 999)
    return {
      start: startFromQuery,
      end: endFromQuery,
    }
  }

  if (range === 'week') {
    const weekday = start.getDay() || 7
    start.setDate(start.getDate() - weekday + 1)
  }

  if (range === 'month') {
    start.setDate(1)
  }

  return {
    start,
    end,
  }
}

async function getStatisticsSummary(executor, filters) {
  const { start, end } = buildRange(filters)
  const trendConfig = buildTrendBuckets({
    range: filters?.range || 'today',
    start,
    end,
    startDate: filters?.startDate,
    endDate: filters?.endDate,
  })

  const [orderRows] = await executor.query(
    `
      SELECT
        SUM(CASE WHEN status <> 5 THEN 1 ELSE 0 END) AS total_orders,
        SUM(CASE WHEN pay_status = 1 AND status <> 5 THEN total_amount ELSE 0 END) AS total_sales,
        SUM(CASE WHEN pay_status = 1 AND status <> 5 THEN 1 ELSE 0 END) AS paid_orders,
        SUM(CASE WHEN status = 4 THEN 1 ELSE 0 END) AS completed_orders,
        SUM(CASE WHEN status = 5 THEN 1 ELSE 0 END) AS canceled_orders,
        COUNT(DISTINCT CASE WHEN status <> 5 THEN user_id ELSE NULL END) AS unique_customers
      FROM orders
      WHERE created_at BETWEEN ? AND ?
    `,
    [start, end],
  )

  const [repeatCustomerRows] = await executor.query(
    `
      SELECT COUNT(*) AS repeat_customers
      FROM (
        SELECT user_id
        FROM orders
        WHERE created_at BETWEEN ? AND ?
          AND status <> 5
        GROUP BY user_id
        HAVING COUNT(*) > 1
      ) repeated
    `,
    [start, end],
  )

  const [dishRows] = await executor.query(
    `
      SELECT
        COALESCE(SUM(oi.quantity), 0) AS total_dishes
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.pay_status = 1
        AND o.status <> 5
    `,
    [start, end],
  )

  const [statusRows] = await executor.query(
    `
      SELECT status, COUNT(*) AS total
      FROM orders
      WHERE created_at BETWEEN ? AND ?
      GROUP BY status
    `,
    [start, end],
  )

  const [topRows] = await executor.query(
    `
      SELECT
        oi.dish_id,
        oi.dish_name,
        SUM(oi.quantity) AS quantity,
        SUM(oi.price * oi.quantity) AS amount
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.pay_status = 1
        AND o.status <> 5
      GROUP BY oi.dish_id, oi.dish_name
      ORDER BY quantity DESC
      LIMIT 10
    `,
    [start, end],
  )

  const trendBucketExpression =
    trendConfig.mode === 'hour'
      ? 'HOUR(o.created_at)'
      : "DATE_FORMAT(o.created_at, '%Y-%m-%d')"
  const [trendRows] = await executor.query(
    `
      SELECT
        ${trendBucketExpression} AS bucket,
        COUNT(*) AS orders,
        SUM(CASE WHEN o.pay_status = 1 THEN o.total_amount ELSE 0 END) AS sales
      FROM orders o
      WHERE o.created_at BETWEEN ? AND ?
        AND o.status <> 5
      GROUP BY bucket
      ORDER BY bucket ASC
    `,
    [start, end],
  )

  const [categoryRows] = await executor.query(
    `
      SELECT
        c.id AS category_id,
        COALESCE(c.name, '未分类') AS category_name,
        COALESCE(SUM(oi.quantity), 0) AS quantity,
        COALESCE(SUM(oi.price * oi.quantity), 0) AS amount
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      LEFT JOIN dishes d ON d.id = oi.dish_id
      LEFT JOIN categories c ON c.id = d.category_id
      WHERE o.created_at BETWEEN ? AND ?
        AND o.pay_status = 1
        AND o.status <> 5
      GROUP BY c.id, c.name
      ORDER BY amount DESC
      LIMIT 8
    `,
    [start, end],
  )

  const totals = orderRows[0]
  const ordersByStatus = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  }
  statusRows.forEach((item) => {
    ordersByStatus[item.status] = Number(item.total)
  })

  const totalSales = Number(totals.total_sales || 0)
  const totalOrders = Number(totals.total_orders || 0)
  const paidOrders = Number(totals.paid_orders || 0)
  const completedOrders = Number(totals.completed_orders || 0)
  const canceledOrders = Number(totals.canceled_orders || 0)
  const uniqueCustomers = Number(totals.unique_customers || 0)
  const repeatCustomers = Number(repeatCustomerRows[0].repeat_customers || 0)
  const totalDishes = Number(dishRows[0].total_dishes || 0)
  const allOrderCount = totalOrders + canceledOrders
  const statusTotal = Object.values(ordersByStatus).reduce(
    (sum, value) => sum + Number(value || 0),
    0,
  )
  const trendMap = new Map(
    trendRows.map((row) => [
      String(row.bucket),
      {
        sales: Number(row.sales || 0),
        orders: Number(row.orders || 0),
      },
    ]),
  )
  const salesTrend = trendConfig.buckets.map((bucket) => {
    const current = trendMap.get(bucket.key) || {
      sales: 0,
      orders: 0,
    }
    return {
      label: bucket.label,
      sales: roundMetric(current.sales),
      orders: current.orders,
    }
  })
  const peakTrend = salesTrend.reduce(
    (best, item) => (item.sales > best.sales ? item : best),
    { label: '暂无', sales: 0, orders: 0 },
  )

  return {
    totalSales: roundMetric(totalSales),
    totalOrders,
    paidOrders,
    completedOrders,
    canceledOrders,
    uniqueCustomers,
    repeatCustomers,
    totalDishes,
    avgOrderAmount: paidOrders ? roundMetric(totalSales / paidOrders) : 0,
    avgDishesPerOrder: paidOrders ? roundMetric(totalDishes / paidOrders, 1) : 0,
    payRate: totalOrders ? roundMetric((paidOrders / totalOrders) * 100, 1) : 0,
    completionRate: totalOrders
      ? roundMetric((completedOrders / totalOrders) * 100, 1)
      : 0,
    cancelRate: allOrderCount
      ? roundMetric((canceledOrders / allOrderCount) * 100, 1)
      : 0,
    peakSalesLabel: peakTrend.sales > 0 ? peakTrend.label : '暂无高峰',
    ordersByStatus,
    statusDistribution: Object.keys(ordersByStatus).map((status) => ({
      status: Number(status),
      label: orderStatusLabels[status],
      value: Number(ordersByStatus[status] || 0),
      ratio: statusTotal
        ? roundMetric((Number(ordersByStatus[status] || 0) / statusTotal) * 100, 1)
        : 0,
    })),
    salesTrend,
    categorySales: categoryRows.map((row) => ({
      categoryId: row.category_id || 0,
      name: row.category_name,
      quantity: Number(row.quantity),
      amount: roundMetric(row.amount),
    })),
    topDishes: topRows.map((row) => ({
      dishId: row.dish_id,
      name: row.dish_name,
      quantity: Number(row.quantity),
      amount: roundMetric(row.amount),
    })),
  }
}

async function merchantRoutes(fastify) {
  fastify.get('/dashboard', async (request, reply) => {
    if (!(await fastify.authenticateMerchant(request, reply))) {
      return
    }

    const todayStats = await getStatisticsSummary(fastify.db, {
      range: 'today',
    })
    const [statusRows] = await fastify.db.query(
      `
        SELECT status, COUNT(*) AS total
        FROM orders
        WHERE status IN (1, 2, 3)
        GROUP BY status
      `,
    )
    const [recentRows] = await fastify.db.query(
      `
        SELECT
          o.id,
          o.order_no,
          o.user_nickname,
          o.user_avatar_url,
          o.user_phone_number,
          o.total_amount,
          o.address_name,
          o.address_phone,
          o.address_province,
          o.address_city,
          o.address_district,
          o.address_detail,
          o.remark,
          o.status,
          o.pay_status,
          o.pay_time,
          o.complete_time,
          o.created_at,
          o.updated_at
        FROM orders o
        ORDER BY o.id DESC
        LIMIT 5
      `,
    )
    const recentOrders = await hydrateOrders(fastify.db, recentRows)
    const orderStats = {
      unpaid: 0,
      toDeliver: 0,
      delivering: 0,
    }

    statusRows.forEach((item) => {
      if (item.status === 1) {
        orderStats.unpaid = item.total
      }
      if (item.status === 2) {
        orderStats.toDeliver = item.total
      }
      if (item.status === 3) {
        orderStats.delivering = item.total
      }
    })

    ok(reply, {
      todayStats,
      orderStats,
      recentOrders,
    })
  })

  fastify.get('/orders', async (request, reply) => {
    if (!(await fastify.authenticateMerchant(request, reply))) {
      return
    }

    const status = Number(request.query.status || 0)
    const conditions = []
    const params = []
    if (status) {
      conditions.push('o.status = ?')
      params.push(status)
    }

    const [rows] = await fastify.db.query(
      `
        SELECT
          o.id,
          o.order_no,
          o.user_nickname,
          o.user_avatar_url,
          o.user_phone_number,
          o.total_amount,
          o.address_name,
          o.address_phone,
          o.address_province,
          o.address_city,
          o.address_district,
          o.address_detail,
          o.remark,
          o.status,
          o.pay_status,
          o.pay_time,
          o.complete_time,
          o.created_at,
          o.updated_at
        FROM orders o
        ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
        ORDER BY o.id DESC
      `,
      params,
    )

    ok(reply, await hydrateOrders(fastify.db, rows))
  })

  fastify.get('/orders/:id', async (request, reply) => {
    if (!(await fastify.authenticateMerchant(request, reply))) {
      return
    }

    const orderId = Number(request.params.id)
    const [rows] = await fastify.db.query(
      `
        SELECT
          o.id,
          o.order_no,
          o.user_nickname,
          o.user_avatar_url,
          o.user_phone_number,
          o.total_amount,
          o.address_name,
          o.address_phone,
          o.address_province,
          o.address_city,
          o.address_district,
          o.address_detail,
          o.remark,
          o.status,
          o.pay_status,
          o.pay_time,
          o.complete_time,
          o.created_at,
          o.updated_at
        FROM orders o
        WHERE o.id = ?
        LIMIT 1
      `,
      [orderId],
    )

    if (!rows.length) {
      return fail(reply, 404, '订单不存在')
    }

    const orders = await hydrateOrders(fastify.db, rows)
    ok(reply, orders[0])
  })

  fastify.post('/orders/:id/status', async (request, reply) => {
    if (!(await fastify.authenticateMerchant(request, reply))) {
      return
    }

    const orderId = Number(request.params.id)
    const nextStatus = Number(request.body.status)
    const [rows] = await fastify.db.query(
      `
        SELECT id, status
        FROM orders
        WHERE id = ?
        LIMIT 1
      `,
      [orderId],
    )
    const order = rows[0]
    if (!order) {
      return fail(reply, 404, '订单不存在')
    }
    if (!canTransition(order.status, nextStatus)) {
      return fail(reply, 400, '无效的状态变更')
    }

    await fastify.db.query(
      `
        UPDATE orders
        SET
          status = ?,
          complete_time = CASE WHEN ? = 4 THEN NOW() ELSE complete_time END,
          updated_at = NOW()
        WHERE id = ?
      `,
      [nextStatus, nextStatus, orderId],
    )
    ok(reply, true, '状态更新成功')
  })

  fastify.get('/dishes', async (request, reply) => {
    if (!(await fastify.authenticateMerchant(request, reply))) {
      return
    }

    const categoryId = Number(request.query.categoryId || 0)
    const conditions = []
    const params = []
    if (categoryId) {
      conditions.push('d.category_id = ?')
      params.push(categoryId)
    }

    const [rows] = await fastify.db.query(
      `
        SELECT
          d.id,
          d.category_id,
          c.name AS category_name,
          d.name,
          d.image,
          d.price,
          d.original_price,
          d.description,
          d.stock,
          d.sales,
          d.status,
          d.is_recommend,
          d.tags,
          d.sort
        FROM dishes d
        JOIN categories c ON c.id = d.category_id
        ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
        ORDER BY c.sort ASC, d.sort ASC, d.id DESC
      `,
      params,
    )
    ok(reply, rows.map(mapDishRow))
  })

  fastify.post('/dishes', async (request, reply) => {
    if (!(await fastify.authenticateMerchant(request, reply))) {
      return
    }

    const parsed = dishSchema.safeParse(request.body)
    if (!parsed.success) {
      return fail(reply, 400, '菜品参数不完整')
    }

    const [result] = await fastify.db.query(
      `
        INSERT INTO dishes (
          category_id,
          name,
          image,
          price,
          original_price,
          description,
          stock,
          sales,
          status,
          is_recommend,
          tags,
          sort,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, NOW(), NOW())
      `,
      [
        parsed.data.categoryId,
        parsed.data.name,
        parsed.data.image,
        parsed.data.price,
        parsed.data.originalPrice || null,
        parsed.data.description,
        parsed.data.stock,
        parsed.data.status,
        parsed.data.isRecommend ? 1 : 0,
        JSON.stringify(parsed.data.tags),
        parsed.data.sort,
      ],
    )
    ok(reply, { id: result.insertId, ...parsed.data }, '新增成功')
  })

  fastify.put('/dishes/:id', async (request, reply) => {
    if (!(await fastify.authenticateMerchant(request, reply))) {
      return
    }

    const dishId = Number(request.params.id)
    const parsed = dishSchema.safeParse({
      ...request.body,
      id: dishId,
    })
    if (!parsed.success) {
      return fail(reply, 400, '菜品参数不完整')
    }

    await fastify.db.query(
      `
        UPDATE dishes
        SET
          category_id = ?,
          name = ?,
          image = ?,
          price = ?,
          original_price = ?,
          description = ?,
          stock = ?,
          status = ?,
          is_recommend = ?,
          tags = ?,
          sort = ?,
          updated_at = NOW()
        WHERE id = ?
      `,
      [
        parsed.data.categoryId,
        parsed.data.name,
        parsed.data.image,
        parsed.data.price,
        parsed.data.originalPrice || null,
        parsed.data.description,
        parsed.data.stock,
        parsed.data.status,
        parsed.data.isRecommend ? 1 : 0,
        JSON.stringify(parsed.data.tags),
        parsed.data.sort,
        dishId,
      ],
    )
    ok(reply, { id: dishId, ...parsed.data }, '更新成功')
  })

  fastify.delete('/dishes/:id', async (request, reply) => {
    if (!(await fastify.authenticateMerchant(request, reply))) {
      return
    }

    const dishId = Number(request.params.id)
    await fastify.db.query('DELETE FROM dishes WHERE id = ?', [dishId])
    ok(reply, true, '删除成功')
  })

  fastify.post('/dishes/:id/status', async (request, reply) => {
    if (!(await fastify.authenticateMerchant(request, reply))) {
      return
    }

    const dishId = Number(request.params.id)
    const status = Number(request.body.status)
    await fastify.db.query(
      `
        UPDATE dishes
        SET status = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [status, dishId],
    )
    ok(reply, true, '状态更新成功')
  })

  fastify.get('/categories', async (request, reply) => {
    if (!(await fastify.authenticateMerchant(request, reply))) {
      return
    }

    const [rows] = await fastify.db.query(
      `
        SELECT id, name, sort, icon, status
        FROM categories
        ORDER BY sort ASC, id ASC
      `,
    )
    ok(reply, rows.map(mapCategoryRow))
  })

  fastify.post('/categories', async (request, reply) => {
    if (!(await fastify.authenticateMerchant(request, reply))) {
      return
    }

    const parsed = categorySchema.safeParse(request.body)
    if (!parsed.success) {
      return fail(reply, 400, '分类参数不完整')
    }

    const [result] = await fastify.db.query(
      `
        INSERT INTO categories (name, sort, icon, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, NOW(), NOW())
      `,
      [
        parsed.data.name,
        parsed.data.sort,
        parsed.data.icon || null,
        parsed.data.status,
      ],
    )
    ok(reply, { id: result.insertId, ...parsed.data }, '新增成功')
  })

  fastify.put('/categories/:id', async (request, reply) => {
    if (!(await fastify.authenticateMerchant(request, reply))) {
      return
    }

    const categoryId = Number(request.params.id)
    const parsed = categorySchema.safeParse(request.body)
    if (!parsed.success) {
      return fail(reply, 400, '分类参数不完整')
    }

    await fastify.db.query(
      `
        UPDATE categories
        SET name = ?, sort = ?, icon = ?, status = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [
        parsed.data.name,
        parsed.data.sort,
        parsed.data.icon || null,
        parsed.data.status,
        categoryId,
      ],
    )
    ok(reply, { id: categoryId, ...parsed.data }, '更新成功')
  })

  fastify.delete('/categories/:id', async (request, reply) => {
    if (!(await fastify.authenticateMerchant(request, reply))) {
      return
    }

    const categoryId = Number(request.params.id)
    const [rows] = await fastify.db.query(
      `
        SELECT COUNT(*) AS total
        FROM dishes
        WHERE category_id = ?
      `,
      [categoryId],
    )
    if (rows[0].total > 0) {
      return fail(reply, 400, '请先删除该分类下的菜品')
    }

    await fastify.db.query('DELETE FROM categories WHERE id = ?', [categoryId])
    ok(reply, true, '删除成功')
  })

  fastify.get('/statistics', async (request, reply) => {
    if (!(await fastify.authenticateMerchant(request, reply))) {
      return
    }

    ok(
      reply,
      await getStatisticsSummary(fastify.db, {
        range: request.query.range || 'today',
        startDate: request.query.startDate,
        endDate: request.query.endDate,
      }),
    )
  })
}

module.exports = merchantRoutes
