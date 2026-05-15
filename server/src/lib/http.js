function ok(reply, data = null, message = 'ok') {
  reply.send({
    code: 0,
    message,
    data,
  })
}

function fail(reply, statusCode, message) {
  reply.code(statusCode).send({
    code: -1,
    message,
    data: null,
  })
}

module.exports = {
  ok,
  fail,
}
