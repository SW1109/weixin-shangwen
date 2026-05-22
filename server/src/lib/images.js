const path = require('path')
const fs = require('fs')

const allowedImageTypes = {
  'image/jpeg': {
    ext: '.jpg',
    contentType: 'image/jpeg',
  },
  'image/png': {
    ext: '.png',
    contentType: 'image/png',
  },
  'image/webp': {
    ext: '.webp',
    contentType: 'image/webp',
  },
  'image/gif': {
    ext: '.gif',
    contentType: 'image/gif',
  },
}

const imageFilenamePattern = /^[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|webp|gif)$/

function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return allowedImageTypes['image/jpeg']
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return allowedImageTypes['image/png']
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return allowedImageTypes['image/webp']
  }

  if (
    buffer.length >= 6 &&
    (buffer.toString('ascii', 0, 6) === 'GIF87a' ||
      buffer.toString('ascii', 0, 6) === 'GIF89a')
  ) {
    return allowedImageTypes['image/gif']
  }

  return null
}

async function readFileHeader(filePath, length = 16) {
  const handle = await fs.promises.open(filePath, 'r')
  try {
    const buffer = Buffer.alloc(length)
    const result = await handle.read(buffer, 0, length, 0)
    return buffer.subarray(0, result.bytesRead)
  } finally {
    await handle.close()
  }
}

async function detectImageTypeFromFile(filePath) {
  return detectImageType(await readFileHeader(filePath))
}

function getAllowedImageType(mimeType) {
  return allowedImageTypes[mimeType] || null
}

function isAllowedImageFilename(filename) {
  return imageFilenamePattern.test(filename)
}

function resolveUploadImagePath(uploadDir, filename) {
  if (!isAllowedImageFilename(filename)) {
    return null
  }

  const root = path.resolve(uploadDir)
  const filePath = path.resolve(root, filename)
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    return null
  }

  return filePath
}

module.exports = {
  allowedImageTypes,
  detectImageType,
  detectImageTypeFromFile,
  getAllowedImageType,
  isAllowedImageFilename,
  readFileHeader,
  resolveUploadImagePath,
}
