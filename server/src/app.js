const fs = require('fs')
const path = require('path')
const Fastify = require('fastify')
const cors = require('@fastify/cors')
const jwt = require('@fastify/jwt')
const multipart = require('@fastify/multipart')
const { pool } = require('./lib/db')
const { config } = require('./config')
const { authenticateUser, authenticateMerchant } = require('./lib/auth')
const {
  detectImageTypeFromFile,
  resolveUploadImagePath,
} = require('./lib/images')
const healthRoutes = require('./routes/health')
const authRoutes = require('./routes/auth')
const commonRoutes = require('./routes/common')
const customerRoutes = require('./routes/customer')
const merchantRoutes = require('./routes/merchant')
const uploadRoutes = require('./routes/upload')
const shareRoutes = require('./routes/share')

const uploadContentTypes = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

async function buildApp() {
  const app = Fastify({
    logger: true,
    trustProxy: true,
  })

  await app.register(cors, {
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','),
  })
  await app.register(jwt, {
    secret: config.jwtSecret,
  })
  fs.mkdirSync(config.upload.dir, {
    recursive: true,
  })
  await app.register(multipart, {
    limits: {
      fileSize: config.upload.maxFileSize,
      files: 1,
    },
  })

  app.get('/uploads/:filename', async (request, reply) => {
    const filename = String(request.params.filename || '')
    const filePath = resolveUploadImagePath(config.upload.dir, filename)
    if (!filePath) {
      reply.code(404).send({
        code: -1,
        message: '图片不存在',
        data: null,
      })
      return
    }

    try {
      await fs.promises.access(filePath, fs.constants.R_OK)
    } catch (error) {
      reply.code(404).send({
        code: -1,
        message: '图片不存在',
        data: null,
      })
      return
    }

    const imageType = await detectImageTypeFromFile(filePath)
    const expectedContentType = uploadContentTypes[path.extname(filename).toLowerCase()]
    if (!imageType || imageType.contentType !== expectedContentType) {
      reply.code(404).send({
        code: -1,
        message: '图片不存在',
        data: null,
      })
      return
    }

    return reply
      .header('Cache-Control', 'public, max-age=2592000, immutable')
      .header('X-Content-Type-Options', 'nosniff')
      .type(imageType.contentType)
      .send(fs.createReadStream(filePath))
  })

  app.decorate('db', pool)
  app.decorate('configData', config)
  app.decorate('authenticateUser', authenticateUser)
  app.decorate('authenticateMerchant', authenticateMerchant)

  await app.register(healthRoutes, { prefix: '/api' })
  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(commonRoutes, { prefix: '/api' })
  await app.register(customerRoutes, { prefix: '/api/customer' })
  await app.register(merchantRoutes, { prefix: '/api/merchant' })
  await app.register(uploadRoutes, { prefix: '/api/upload' })
  await app.register(shareRoutes, { prefix: '/api/share' })

  app.setErrorHandler((error, request, reply) => {
    request.log.error(error)
    if (reply.sent) {
      return
    }
    reply.code(500).send({
      code: -1,
      message: error.message || '服务端异常',
      data: null,
    })
  })

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      code: -1,
      message: '接口不存在',
      data: null,
    })
  })

  return app
}

module.exports = {
  buildApp,
}
