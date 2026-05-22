const fs = require('fs')
const path = require('path')
const { pipeline } = require('stream/promises')
const {
  detectImageType,
  getAllowedImageType,
  readFileHeader,
} = require('../lib/images')
const { ok, fail } = require('../lib/http')

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

    const claimedType = getAllowedImageType(file.mimetype)
    if (!claimedType) {
      return fail(reply, 400, '仅支持 jpg/png/webp/gif 图片')
    }

    await fs.promises.mkdir(fastify.configData.upload.dir, {
      recursive: true,
    })

    const token = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}`
    const tempFilename = `${token}.uploading`
    const tempFilePath = path.join(fastify.configData.upload.dir, tempFilename)
    let finalFilePath = ''

    try {
      await pipeline(file.file, fs.createWriteStream(tempFilePath))
      const header = await readFileHeader(tempFilePath)
      const detectedType = detectImageType(header)

      if (!detectedType || detectedType.contentType !== claimedType.contentType) {
        await fs.promises.rm(tempFilePath, { force: true })
        return fail(reply, 400, '图片内容与文件类型不匹配')
      }

      const filename = `${token}${detectedType.ext}`
      finalFilePath = path.join(fastify.configData.upload.dir, filename)
      await fs.promises.rename(tempFilePath, finalFilePath)

      ok(reply, {
        url: buildPublicUrl(request, fastify.configData, filename),
      })
    } catch (error) {
      await fs.promises.rm(tempFilePath, { force: true })
      if (finalFilePath) {
        await fs.promises.rm(finalFilePath, { force: true })
      }
      throw error
    }
  })
}

module.exports = uploadRoutes
