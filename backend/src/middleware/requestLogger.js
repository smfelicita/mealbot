const { logger } = require('../lib/logger')

// Логирует каждый не-GET запрос при завершении.
// GET логируются только если медленные (>500ms) или завершились ошибкой.
const SLOW_THRESHOLD_MS = 500

module.exports = function requestLogger(req, res, next) {
  const startedAt = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - startedAt
    const isGet = req.method === 'GET'
    const isError = res.statusCode >= 400
    const isSlow = duration >= SLOW_THRESHOLD_MS

    // GET без ошибок и без тормозов — не логируем (не захламляем stdout)
    if (isGet && !isError && !isSlow) return

    const ctx = {
      requestId:  req.requestId,
      method:     req.method,
      path:       req.path,
      statusCode: res.statusCode,
      duration,
      userId:     req.userId || undefined,
    }

    if (res.statusCode >= 500) {
      logger.error(ctx, 'request_error')
    } else if (res.statusCode >= 400) {
      logger.warn(ctx, 'request_failed')
    } else if (isSlow) {
      logger.warn(ctx, 'request_slow')
    } else {
      logger.info(ctx, 'request_completed')
    }
  })

  next()
}
