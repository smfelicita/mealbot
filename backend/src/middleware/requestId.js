const { randomBytes } = require('crypto')

module.exports = function requestId(req, res, next) {
  const id = `req_${randomBytes(6).toString('hex')}`
  req.requestId = id
  res.setHeader('X-Request-Id', id)
  next()
}
