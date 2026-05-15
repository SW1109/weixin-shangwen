const fs = require('fs')
const path = require('path')
const { pipeline } = require('stream/promises')
const { ok, fail } = require('../lib/http')

const allowedMimeTypes = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

function buildPublicUrl(request, config, filename) {
  const baseUrl =
    config.upload.publicBaseUrl ||
    `${request.protocol}://${request.headers.host}`
  return `${baseUrl.replace(/\/+$/, '')}/uploads/${filename}`
}

async function authenticateAny(request, reply) {
  try {
    await request.jwtVerify()
    if (request.user.type !== 'user' && request.user.type !== 'merchant') {
      return false
    }
    return true
  } catch (error) {
    reply.code(401).send({
      code: -1,
      message: '请先登录后再上传图片',
      data: null,
    })
    return false
  }
}

async function uploadRoutes(fastify) {
  fastify.post('/image', async (request, reply) => {
    if (!(await authenticateAny(request, reply))) {
      return
    }

    const file = await request.file()
    if (!file) {
      return fail(reply, 400, '请选择图片文件')
    }

    const ext = allowedMimeTypes[file.mimetype]
    if (!ext) {
      return fail(reply, 400, '仅支持 jpg/png/webp/gif 图片')
    }

    await fs.promises.mkdir(fastify.configData.upload.dir, {
      recursive: true,
    })

    const filename = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}${ext}`
    const filePath = path.join(fastify.configData.upload.dir, filename)

    await pipeline(file.file, fs.createWriteStream(filePath))

    ok(reply, {
      url: buildPublicUrl(request, fastify.configData, filename),
    })
  })
}

module.exports = uploadRoutes
