const { z } = require('zod')
const { ok, fail } = require('../lib/http')
const { mapAddressRow, mapCartRow } = require('../lib/mappers')
const { generateOrderNo, hydrateOrders } = require('../lib/orders')

const addressSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  province: z.string().default(''),
  city: z.string().default(''),
  district: z.string().default(''),
  detail: z.string().min(1),
  isDefault: z.boolean().default(false),
})

const cartSchema = z.object({
  items: z.array(
    z.object({
      dishId: z.coerce.number().int().positive(),
      quantity: z.coerce.number().int().positive(),
    }),
  ),
})

const createOrderSchema = z.object({
  addressId: z.coerce.number().int().positive(),
  remark: z.string().max(100).default(''),
  dishes: z.array(
    z.object({
      dishId: z.coerce.number().int().positive(),
      quantity: z.coerce.number().int().positive(),
    }),
  ),
})

async function syncDefaultAddress(executor, userId, isDefault, addressId) {
  if (!isDefault) {
    return
  }

  await executor.query(
    `
      UPDATE addresses
      SET is_default = 0, updated_at = NOW()
      WHERE user_id = ? AND id <> ?
    `,
    [userId, addressId || 0],
  )
}

async function customerRoutes(fastify) {
  fastify.get('/addresses', async (request, reply) => {
    if (!(await fastify.authenticateUser(request, reply))) {
      return
    }

    const [rows] = await fastify.db.query(
      `
        SELECT id, name, phone, province, city, district, detail, is_default
        FROM addresses
        WHERE user_id = ?
        ORDER BY is_default DESC, id DESC
      `,
      [request.currentUser.id],
    )
    ok(reply, rows.map(mapAddressRow))
  })

  fastify.post('/addresses', async (request, reply) => {
    if (!(await fastify.authenticateUser(request, reply))) {
      return
    }

    const parsed = addressSchema.safeParse(request.body)
    if (!parsed.success) {
      return fail(reply, 400, '地址参数不完整')
    }

    const connection = await fastify.db.getConnection()
    try {
      await connection.beginTransaction()
      const [result] = await connection.query(
        `
          INSERT INTO addresses (
            user_id,
            name,
            phone,
            province,
            city,
            district,
            detail,
            is_default,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [
          request.currentUser.id,
          parsed.data.name,
          parsed.data.phone,
          parsed.data.province,
          parsed.data.city,
          parsed.data.district,
          parsed.data.detail,
          parsed.data.isDefault ? 1 : 0,
        ],
      )
      await syncDefaultAddress(
        connection,
        request.currentUser.id,
        parsed.data.isDefault,
        result.insertId,
      )
      await connection.commit()
      ok(reply, {
        id: result.insertId,
        ...parsed.data,
      })
    } catch (error) {
      await connection.rollback()
      fail(reply, 500, error.message || '保存地址失败')
    } finally {
      connection.release()
    }
  })

  fastify.put('/addresses/:id', async (request, reply) => {
    if (!(await fastify.authenticateUser(request, reply))) {
      return
    }

    const addressId = Number(request.params.id)
    const parsed = addressSchema.safeParse(request.body)
    if (!addressId || !parsed.success) {
      return fail(reply, 400, '地址参数不合法')
    }

    const connection = await fastify.db.getConnection()
    try {
      await connection.beginTransaction()
      await connection.query(
        `
          UPDATE addresses
          SET
            name = ?,
            phone = ?,
            province = ?,
            city = ?,
            district = ?,
            detail = ?,
            is_default = ?,
            updated_at = NOW()
          WHERE id = ? AND user_id = ?
        `,
        [
          parsed.data.name,
          parsed.data.phone,
          parsed.data.province,
          parsed.data.city,
          parsed.data.district,
          parsed.data.detail,
          parsed.data.isDefault ? 1 : 0,
          addressId,
          request.currentUser.id,
        ],
      )
      await syncDefaultAddress(
        connection,
        request.currentUser.id,
        parsed.data.isDefault,
        addressId,
      )
      await connection.commit()
      ok(reply, {
        id: addressId,
        ...parsed.data,
      })
    } catch (error) {
      await connection.rollback()
      fail(reply, 500, error.message || '更新地址失败')
    } finally {
      connection.release()
    }
  })

  fastify.delete('/addresses/:id', async (request, reply) => {
    if (!(await fastify.authenticateUser(request, reply))) {
      return
    }

    const addressId = Number(request.params.id)
    await fastify.db.query(
      `
        DELETE FROM addresses
        WHERE id = ? AND user_id = ?
      `,
      [addressId, request.currentUser.id],
    )
    ok(reply, true, '删除成功')
  })

  fastify.post('/addresses/:id/default', async (request, reply) => {
    if (!(await fastify.authenticateUser(request, reply))) {
      return
    }

    const addressId = Number(request.params.id)
    const connection = await fastify.db.getConnection()
    try {
      await connection.beginTransaction()
      await connection.query(
        `
          UPDATE addresses
          SET is_default = 0, updated_at = NOW()
          WHERE user_id = ?
        `,
        [request.currentUser.id],
      )
      await connection.query(
        `
          UPDATE addresses
          SET is_default = 1, updated_at = NOW()
          WHERE id = ? AND user_id = ?
        `,
        [addressId, request.currentUser.id],
      )
      await connection.commit()
      ok(reply, true, '设置成功')
    } catch (error) {
      await connection.rollback()
      fail(reply, 500, '设置默认地址失败')
    } finally {
      connection.release()
    }
  })

  fastify.get('/cart', async (request, reply) => {
    if (!(await fastify.authenticateUser(request, reply))) {
      return
    }

    const [rows] = await fastify.db.query(
      `
        SELECT
          ci.dish_id,
          ci.quantity,
          d.name,
          d.image,
          d.price,
          d.stock
        FROM carts c
        JOIN cart_items ci ON ci.cart_id = c.id
        JOIN dishes d ON d.id = ci.dish_id
        WHERE c.user_id = ?
        ORDER BY ci.id ASC
      `,
      [request.currentUser.id],
    )
    ok(reply, rows.map(mapCartRow))
  })

  fastify.put('/cart', async (request, reply) => {
    if (!(await fastify.authenticateUser(request, reply))) {
      return
    }

    const parsed = cartSchema.safeParse(request.body)
    if (!parsed.success) {
      return fail(reply, 400, '购物车数据不合法')
    }

    const connection = await fastify.db.getConnection()
    try {
      await connection.beginTransaction()
      const [cartRows] = await connection.query(
        `
          SELECT id
          FROM carts
          WHERE user_id = ?
          LIMIT 1
        `,
        [request.currentUser.id],
      )

      let cartId = cartRows[0]?.id
      if (!cartId) {
        const [cartResult] = await connection.query(
          `
            INSERT INTO carts (user_id, created_at, updated_at)
            VALUES (?, NOW(), NOW())
          `,
          [request.currentUser.id],
        )
        cartId = cartResult.insertId
      }

      await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [cartId])
      if (parsed.data.items.length) {
        const values = parsed.data.items.map((item) => [
          cartId,
          item.dishId,
          item.quantity,
          new Date(),
          new Date(),
        ])
        await connection.query(
          `
            INSERT INTO cart_items (cart_id, dish_id, quantity, created_at, updated_at)
            VALUES ?
          `,
          [values],
        )
      }

      await connection.query(
        `
          UPDATE carts
          SET updated_at = NOW()
          WHERE id = ?
        `,
        [cartId],
      )
      await connection.commit()
    } catch (error) {
      await connection.rollback()
      return fail(reply, 500, error.message || '同步购物车失败')
    } finally {
      connection.release()
    }

    const [rows] = await fastify.db.query(
      `
        SELECT
          ci.dish_id,
          ci.quantity,
          d.name,
          d.image,
          d.price,
          d.stock
        FROM carts c
        JOIN cart_items ci ON ci.cart_id = c.id
        JOIN dishes d ON d.id = ci.dish_id
        WHERE c.user_id = ?
        ORDER BY ci.id ASC
      `,
      [request.currentUser.id],
    )
    ok(reply, rows.map(mapCartRow))
  })

  fastify.post('/orders', async (request, reply) => {
    if (!(await fastify.authenticateUser(request, reply))) {
      return
    }

    const parsed = createOrderSchema.safeParse(request.body)
    if (!parsed.success || !parsed.data.dishes.length) {
      return fail(reply, 400, '订单参数不完整')
    }

    const connection = await fastify.db.getConnection()
    try {
      await connection.beginTransaction()

      const [addressRows] = await connection.query(
        `
          SELECT id, name, phone, province, city, district, detail
          FROM addresses
          WHERE id = ? AND user_id = ?
          LIMIT 1
        `,
        [parsed.data.addressId, request.currentUser.id],
      )
      const address = addressRows[0]
      if (!address) {
        throw new Error('收货地址不存在')
      }

      const dishIds = parsed.data.dishes.map((item) => item.dishId)
      const placeholders = dishIds.map(() => '?').join(', ')
      const [dishRows] = await connection.query(
        `
          SELECT
            d.id,
            d.name,
            d.image,
            d.price,
            d.stock,
            d.status
          FROM dishes d
          WHERE d.id IN (${placeholders})
          FOR UPDATE
        `,
        dishIds,
      )

      const dishMap = new Map(dishRows.map((row) => [row.id, row]))
      let totalAmount = 0
      const orderItems = parsed.data.dishes.map((item) => {
        const dish = dishMap.get(item.dishId)
        if (!dish) {
          throw new Error(`菜品 ${item.dishId} 不存在`)
        }
        if (dish.status !== 1) {
          throw new Error(`${dish.name} 已下架`)
        }
        if (dish.stock !== -1 && dish.stock < item.quantity) {
          throw new Error(`${dish.name} 库存不足`)
        }

        totalAmount += Number(dish.price) * item.quantity
        return {
          dish,
          quantity: item.quantity,
        }
      })

      const [userRows] = await connection.query(
        `
          SELECT id, nick_name, avatar_url, phone_number
          FROM users
          WHERE id = ?
          LIMIT 1
        `,
        [request.currentUser.id],
      )
      const user = userRows[0]
      const orderNo = generateOrderNo()

      const [orderResult] = await connection.query(
        `
          INSERT INTO orders (
            order_no,
            user_id,
            user_openid,
            user_nickname,
            user_avatar_url,
            user_phone_number,
            total_amount,
            address_name,
            address_phone,
            address_province,
            address_city,
            address_district,
            address_detail,
            remark,
            status,
            pay_status,
            created_at,
            updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, NOW(), NOW())
        `,
        [
          orderNo,
          request.currentUser.id,
          request.currentUser.openid,
          user.nick_name,
          user.avatar_url,
          user.phone_number || address.phone,
          totalAmount,
          address.name,
          address.phone,
          address.province,
          address.city,
          address.district,
          address.detail,
          parsed.data.remark,
        ],
      )

      if (orderItems.length) {
        const values = orderItems.map((item) => [
          orderResult.insertId,
          item.dish.id,
          item.dish.name,
          item.dish.image,
          Number(item.dish.price),
          item.quantity,
          new Date(),
          new Date(),
        ])
        await connection.query(
          `
            INSERT INTO order_items (
              order_id,
              dish_id,
              dish_name,
              dish_image,
              price,
              quantity,
              created_at,
              updated_at
            )
            VALUES ?
          `,
          [values],
        )
      }

      for (const item of orderItems) {
        await connection.query(
          `
            UPDATE dishes
            SET
              sales = sales + ?,
              stock = CASE
                WHEN stock = -1 THEN -1
                ELSE stock - ?
              END,
              updated_at = NOW()
            WHERE id = ?
          `,
          [item.quantity, item.quantity, item.dish.id],
        )
      }

      await connection.commit()
      ok(
        reply,
        {
          orderId: orderResult.insertId,
          orderNo,
        },
        '下单成功',
      )
    } catch (error) {
      await connection.rollback()
      fail(reply, 400, error.message || '创建订单失败')
    } finally {
      connection.release()
    }
  })

  fastify.get('/orders', async (request, reply) => {
    if (!(await fastify.authenticateUser(request, reply))) {
      return
    }

    const status = Number(request.query.status || 0)
    const conditions = ['o.user_id = ?']
    const params = [request.currentUser.id]
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
        WHERE ${conditions.join(' AND ')}
        ORDER BY o.id DESC
      `,
      params,
    )

    ok(reply, await hydrateOrders(fastify.db, rows))
  })

  fastify.get('/orders/:id', async (request, reply) => {
    if (!(await fastify.authenticateUser(request, reply))) {
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
        WHERE o.id = ? AND o.user_id = ?
        LIMIT 1
      `,
      [orderId, request.currentUser.id],
    )

    if (!rows.length) {
      return fail(reply, 404, '订单不存在')
    }

    const orders = await hydrateOrders(fastify.db, rows)
    ok(reply, orders[0])
  })

  fastify.post('/orders/:id/pay', async (request, reply) => {
    if (!(await fastify.authenticateUser(request, reply))) {
      return
    }

    const orderId = Number(request.params.id)
    const [rows] = await fastify.db.query(
      `
        SELECT id, status, pay_status
        FROM orders
        WHERE id = ? AND user_id = ?
        LIMIT 1
      `,
      [orderId, request.currentUser.id],
    )
    const order = rows[0]
    if (!order) {
      return fail(reply, 404, '订单不存在')
    }
    if (order.status !== 1 || order.pay_status === 1) {
      return fail(reply, 400, '订单状态异常')
    }

    await fastify.db.query(
      `
        UPDATE orders
        SET status = 2, pay_status = 1, pay_time = NOW(), updated_at = NOW()
        WHERE id = ?
      `,
      [orderId],
    )
    ok(reply, true, '支付成功')
  })

  fastify.post('/orders/:id/cancel', async (request, reply) => {
    if (!(await fastify.authenticateUser(request, reply))) {
      return
    }

    const orderId = Number(request.params.id)
    const connection = await fastify.db.getConnection()
    try {
      await connection.beginTransaction()
      const [orderRows] = await connection.query(
        `
          SELECT id, status
          FROM orders
          WHERE id = ? AND user_id = ?
          LIMIT 1
          FOR UPDATE
        `,
        [orderId, request.currentUser.id],
      )
      const order = orderRows[0]
      if (!order) {
        throw new Error('订单不存在')
      }
      if (![1, 2].includes(order.status)) {
        throw new Error('当前订单不允许取消')
      }

      const [itemRows] = await connection.query(
        `
          SELECT dish_id, quantity
          FROM order_items
          WHERE order_id = ?
        `,
        [orderId],
      )

      for (const item of itemRows) {
        await connection.query(
          `
            UPDATE dishes
            SET
              sales = GREATEST(sales - ?, 0),
              stock = CASE
                WHEN stock = -1 THEN -1
                ELSE stock + ?
              END,
              updated_at = NOW()
            WHERE id = ?
          `,
          [item.quantity, item.quantity, item.dish_id],
        )
      }

      await connection.query(
        `
          UPDATE orders
          SET status = 5, updated_at = NOW()
          WHERE id = ?
        `,
        [orderId],
      )
      await connection.commit()
      ok(reply, true, '订单已取消')
    } catch (error) {
      await connection.rollback()
      fail(reply, 400, error.message || '取消订单失败')
    } finally {
      connection.release()
    }
  })
}

module.exports = customerRoutes
