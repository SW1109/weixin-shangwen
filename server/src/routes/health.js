const { ok } = require('../lib/http')

async function healthRoutes(fastify) {
  fastify.get('/health', async (request, reply) => {
    ok(reply, {
      status: 'ok',
      timestamp: new Date().toISOString(),
    })
  })
}

module.exports = healthRoutes
