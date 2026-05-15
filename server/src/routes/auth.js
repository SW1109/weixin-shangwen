const bcrypt = require('bcryptjs')
const { z } = require('zod')
const { ok, fail } = require('../lib/http')

const wechatLoginSchema = z.object({
  code: z.string().min(1),
  nickName: z.string().min(1),
  avatarUrl: z.string().min(1),
})

const merchantLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

const profileSchema = z.object({
  nickName: z.string().min(1),
  avatarUrl: z.string().min(1),
  phoneNumber: z.string().optional().default(''),
})

async function resolveOpenId(config, code) {
  if (
    !config.wechat.appId ||
    !config.wechat.appSecret ||
    code.startsWith('mock-')
  ) {
    return `mock-openid-${code.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 32)}`
  }

  const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wechat.appId}&secret=${config.wechat.appSecret}&js_code=${code}&grant_type=authorization_code`
  const response = await fetch(url)
  const payload = await response.json()

  if (!payload.openid) {
    throw new Error(payload.errmsg || '微信登录失败')
  }

  return payload.openid
}

async function authRoutes(fastify) {
  fastify.post('/wechat-login', async (request, reply) => {
    const parsed = wechatLoginSchema.safeParse(request.body)
    if (!parsed.success) {
      return fail(reply, 400, '登录参数不完整')
    }

    try {
      const openid = await resolveOpenId(fastify.configData, parsed.data.code)
      await fastify.db.query(
        `
          INSERT INTO users (openid, nick_name, avatar_url, phone_number, created_at, updated_at)
          VALUES (?, ?, ?, '', NOW(), NOW())
          ON DUPLICATE KEY UPDATE
            nick_name = VALUES(nick_name),
            avatar_url = VALUES(avatar_url),
            updated_at = NOW()
        `,
        [openid, parsed.data.nickName, parsed.data.avatarUrl],
      )

      const [rows] = await fastify.db.query(
        `
          SELECT id, openid, nick_name, avatar_url, phone_number
          FROM users
          WHERE openid = ?
          LIMIT 1
        `,
        [openid],
      )
      const user = rows[0]
      const token = await reply.jwtSign({
        type: 'user',
        userId: user.id,
        openid: user.openid,
      })

      ok(
        reply,
        {
          token,
          userInfo: {
            id: user.id,
            openid: user.openid,
            nickName: user.nick_name,
            avatarUrl: user.avatar_url,
            phoneNumber: user.phone_number || '',
          },
        },
        '登录成功',
      )
    } catch (error) {
      fail(reply, 500, error.message || '用户登录失败')
    }
  })

  fastify.post('/merchant-login', async (request, reply) => {
    const parsed = merchantLoginSchema.safeParse(request.body)
    if (!parsed.success) {
      return fail(reply, 400, '账号或密码不能为空')
    }

    const [rows] = await fastify.db.query(
      `
        SELECT id, username, password_hash, role, store_name, store_phone, store_address, status
        FROM merchants
        WHERE username = ?
        LIMIT 1
      `,
      [parsed.data.username],
    )

    const merchant = rows[0]
    if (!merchant || merchant.status !== 1) {
      return fail(reply, 400, '账号不存在或已被禁用')
    }

    const passed = await bcrypt.compare(
      parsed.data.password,
      merchant.password_hash,
    )
    if (!passed) {
      return fail(reply, 400, '密码错误')
    }

    const token = await reply.jwtSign({
      type: 'merchant',
      merchantId: merchant.id,
      role: merchant.role,
    })

    ok(
      reply,
      {
        token,
        merchantInfo: {
          id: merchant.id,
          username: merchant.username,
          role: merchant.role,
          storeName: merchant.store_name,
          storePhone: merchant.store_phone,
          storeAddress: merchant.store_address,
          status: merchant.status,
        },
      },
      '登录成功',
    )
  })

  fastify.get('/me', async (request, reply) => {
    if (!(await fastify.authenticateUser(request, reply))) {
      return
    }

    const [rows] = await fastify.db.query(
      `
        SELECT id, openid, nick_name, avatar_url, phone_number
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [request.currentUser.id],
    )
    const user = rows[0]
    const token = await reply.jwtSign({
      type: 'user',
      userId: user.id,
      openid: user.openid,
    })

    ok(reply, {
      token,
      userInfo: {
        id: user.id,
        openid: user.openid,
        nickName: user.nick_name,
        avatarUrl: user.avatar_url,
        phoneNumber: user.phone_number || '',
      },
    })
  })

  fastify.get('/merchant/me', async (request, reply) => {
    if (!(await fastify.authenticateMerchant(request, reply))) {
      return
    }

    const [rows] = await fastify.db.query(
      `
        SELECT id, username, role, store_name, store_phone, store_address, status
        FROM merchants
        WHERE id = ?
        LIMIT 1
      `,
      [request.currentMerchant.id],
    )
    const merchant = rows[0]
    const token = await reply.jwtSign({
      type: 'merchant',
      merchantId: merchant.id,
      role: merchant.role,
    })

    ok(reply, {
      token,
      merchantInfo: {
        id: merchant.id,
        username: merchant.username,
        role: merchant.role,
        storeName: merchant.store_name,
        storePhone: merchant.store_phone,
        storeAddress: merchant.store_address,
        status: merchant.status,
      },
    })
  })

  fastify.put('/profile', async (request, reply) => {
    if (!(await fastify.authenticateUser(request, reply))) {
      return
    }

    const parsed = profileSchema.safeParse(request.body)
    if (!parsed.success) {
      return fail(reply, 400, '资料参数不完整')
    }

    await fastify.db.query(
      `
        UPDATE users
        SET nick_name = ?, avatar_url = ?, phone_number = ?, updated_at = NOW()
        WHERE id = ?
      `,
      [
        parsed.data.nickName,
        parsed.data.avatarUrl,
        parsed.data.phoneNumber || '',
        request.currentUser.id,
      ],
    )

    const [rows] = await fastify.db.query(
      `
        SELECT id, openid, nick_name, avatar_url, phone_number
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [request.currentUser.id],
    )
    const user = rows[0]
    const token = await reply.jwtSign({
      type: 'user',
      userId: user.id,
      openid: user.openid,
    })

    ok(reply, {
      token,
      userInfo: {
        id: user.id,
        openid: user.openid,
        nickName: user.nick_name,
        avatarUrl: user.avatar_url,
        phoneNumber: user.phone_number || '',
      },
    })
  })
}

module.exports = authRoutes
