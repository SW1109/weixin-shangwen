async function authenticateUser(request, reply) {
  try {
    await request.jwtVerify()
  } catch (error) {
    reply.code(401).send({
      code: -1,
      message: '用户未登录',
      data: null,
    })
    return false
  }

  if (request.user.type !== 'user') {
    reply.code(403).send({
      code: -1,
      message: '当前接口仅允许用户访问',
      data: null,
    })
    return false
  }

  request.currentUser = {
    id: request.user.userId,
    openid: request.user.openid,
  }
  return true
}

async function authenticateMerchant(request, reply) {
  try {
    await request.jwtVerify()
  } catch (error) {
    reply.code(401).send({
      code: -1,
      message: '商家未登录',
      data: null,
    })
    return false
  }

  if (request.user.type !== 'merchant') {
    reply.code(403).send({
      code: -1,
      message: '当前接口仅允许商家访问',
      data: null,
    })
    return false
  }

  request.currentMerchant = {
    id: request.user.merchantId,
    role: request.user.role,
  }
  return true
}

module.exports = {
  authenticateUser,
  authenticateMerchant,
}
