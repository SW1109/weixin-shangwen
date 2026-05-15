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
    start.setDate(start.getDate() - 6)
  }

  if (range === 'month') {
    start.setDate(start.getDate() - 29)
  }

  return {
    start,
    end,
  }
}

async function getStatisticsSummary(executor, filters) {
  const { start, end } = buildRange(filters)

  const [orderRows] = await executor.query(
    `
      SELECT
        COUNT(*) AS total_orders,
        SUM(CASE WHEN pay_status = 1 THEN total_amount ELSE 0 END) AS total_sales,
        SUM(CASE WHEN pay_status = 1 THEN 1 ELSE 0 END) AS paid_orders
      FROM orders
      WHERE created_at BETWEEN ? AND ?
        AND status <> 5
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
        AND status <> 5
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

  const totals = orderRows[0]
  const ordersByStatus = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
  }
  statusRows.forEach((item) => {
    ordersByStatus[item.status] = item.total
  })

  const totalSales = Number(totals.total_sales || 0)
  const totalOrders = Number(totals.total_orders || 0)

  return {
    totalSales,
    totalOrders,
    paidOrders: Number(totals.paid_orders || 0),
    totalDishes: Number(dishRows[0].total_dishes || 0),
    avgOrderAmount: totalOrders ? totalSales / totalOrders : 0,
    ordersByStatus,
    topDishes: topRows.map((row) => ({
      dishId: row.dish_id,
      name: row.dish_name,
      quantity: Number(row.quantity),
      amount: Number(row.amount),
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
