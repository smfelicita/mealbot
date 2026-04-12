const { Prisma } = require('@prisma/client')
const { logger } = require('../lib/logger')

// Коды Prisma → человекочитаемые сообщения
const PRISMA_MESSAGES = {
  P2002: 'Такая запись уже существует',       // unique constraint
  P2025: 'Запись не найдена',                  // record not found (update/delete)
  P2003: 'Связанная запись не найдена',        // foreign key constraint
  P2014: 'Нарушение связи между записями',     // relation violation
}

module.exports = function errorHandler(err, req, res, next) {
  // Уже отправили ответ — передаём дальше
  if (res.headersSent) return next(err)

  const ctx = { requestId: req.requestId, method: req.method, path: req.path, userId: req.userId }

  // ── Prisma: известная ошибка запроса (P2xxx) ──────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const msg = PRISMA_MESSAGES[err.code] || 'Ошибка базы данных'
    logger.warn({ ...ctx, errorCode: err.code, meta: err.meta }, 'prisma_known_error')
    return res.status(409).json({ error: msg })
  }

  // ── Prisma: ошибка валидации (неверный тип поля и т.п.) ──────────────────
  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.warn({ ...ctx }, 'prisma_validation_error')
    return res.status(400).json({ error: 'Неверные данные запроса' })
  }

  // ── Prisma: не удалось подключиться к БД ─────────────────────────────────
  if (err instanceof Prisma.PrismaClientInitializationError ||
      err instanceof Prisma.PrismaClientRustPanicError) {
    logger.error({ ...ctx, err }, 'prisma_connection_error')
    return res.status(503).json({ error: 'Сервис временно недоступен' })
  }

  // ── JSON parse error (тело запроса не является валидным JSON) ────────────
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Неверный формат запроса' })
  }

  // ── Прикладные ошибки с явным статусом (throw с err.status) ─────────────
  if (err.status && err.status < 500) {
    logger.warn({ ...ctx, statusCode: err.status }, err.message)
    return res.status(err.status).json({ error: err.message })
  }

  // ── Всё остальное — 500, детали не утекают в продакшне ───────────────────
  logger.error({ ...ctx, err }, 'internal_server_error')
  const isDev = process.env.NODE_ENV !== 'production'
  res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    ...(isDev && { detail: err.message }),
  })
}
