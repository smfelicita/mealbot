const pino = require('pino')

const isDev = process.env.NODE_ENV !== 'production'
const level = process.env.LOG_LEVEL || (isDev ? 'debug' : 'info')

const logger = pino({
  level,
  // В dev — красивый вывод через pino-pretty
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
    },
  }),
  // В prod — чистый JSON в stdout → PM2 пишет в файл
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  // Запрещённые поля — никогда не попадают в лог
  redact: {
    paths: ['*.password', '*.passwordHash', '*.code', '*.token', '*.jwt',
            '*.inviteToken', '*.telegramToken', '*.webLoginToken'],
    censor: '[REDACTED]',
  },
})

// ─── Маскировка email ────────────────────────────────────────────────────────
function maskEmail(email) {
  if (!email) return undefined
  const [local, domain] = email.split('@')
  if (!domain) return '[invalid-email]'
  return `${local[0]}***@${domain}`
}

// ─── Хелперы для событий ─────────────────────────────────────────────────────

function makeCtx(base = {}) {
  const ctx = { ...base }
  if (ctx.email) ctx.email = maskEmail(ctx.email)
  return ctx
}

module.exports = {
  logger,
  maskEmail,

  // Хелпер: логировать с контекстом запроса (requestId, userId, route, method)
  fromReq: (req) => logger.child({
    requestId: req.requestId,
    method:    req.method,
    route:     req.route?.path || req.path,
    userId:    req.userId || undefined,
  }),

  // Хелпер: структурированное событие
  event: (req, action, data = {}) => {
    const ctx = makeCtx(data)
    const log = logger.child({
      requestId: req.requestId,
      method:    req.method,
      route:     req.route?.path || req.path,
      userId:    req.userId || undefined,
      action,
      ...ctx,
    })
    return log
  },
}
