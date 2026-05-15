const { z } = require('zod')
const { ok, fail } = require('../lib/http')
const { mapCategoryRow, mapDishRow } = require('../lib/mappers')

const dishQuerySchema = z.object({
  categoryId: z.coerce.number().optional(),
  keyword: z.string().optional(),
})

async function commonRoutes(fastify) {
  fastify.get('/categories', async (request, reply) => {
    const [rows] = await fastify.db.query(
      `
        SELECT id, name, sort, icon, status
        FROM categories
        WHERE status = 1
        ORDER BY sort ASC, id ASC
      `,
    )
    ok(reply, rows.map(mapCategoryRow))
  })

  fastify.get('/dishes', async (request, reply) => {
    const parsed = dishQuerySchema.safeParse(request.query || {})
    if (!parsed.success) {
      return fail(reply, 400, '查询参数不合法')
    }

    const conditions = ['d.status = 1']
    const params = []

    if (parsed.data.categoryId) {
      conditions.push('d.category_id = ?')
      params.push(parsed.data.categoryId)
    }

    if (parsed.data.keyword) {
      conditions.push('d.name LIKE ?')
      params.push(`%${parsed.data.keyword}%`)
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
        WHERE ${conditions.join(' AND ')}
        ORDER BY c.sort ASC, d.sort ASC, d.sales DESC, d.id DESC
      `,
      params,
    )

    ok(reply, rows.map(mapDishRow))
  })

  fastify.get('/dishes/:id', async (request, reply) => {
    const dishId = Number(request.params.id)
    if (!dishId) {
      return fail(reply, 400, '菜品 ID 不合法')
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
        WHERE d.id = ?
        LIMIT 1
      `,
      [dishId],
    )

    if (!rows.length) {
      return fail(reply, 404, '菜品不存在')
    }

    ok(reply, mapDishRow(rows[0]))
  })
}

module.exports = commonRoutes
