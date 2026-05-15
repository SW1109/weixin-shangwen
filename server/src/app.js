const fs = require('fs')
const Fastify = require('fastify')
const cors = require('@fastify/cors')
const jwt = require('@fastify/jwt')
const multipart = require('@fastify/multipart')
const fastifyStatic = require('@fastify/static')
const { pool } = require('./lib/db')
const { config } = require('./config')
const { authenticateUser, authenticateMerchant } = require('./lib/auth')
const healthRoutes = require('./routes/health')
const authRoutes = require('./routes/auth')
const commonRoutes = require('./routes/common')
const customerRoutes = require('./routes/customer')
const merchantRoutes = require('./routes/merchant')
const uploadRoutes = require('./routes/upload')

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
  await app.register(fastifyStatic, {
    root: config.upload.dir,
    prefix: '/uploads/',
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
