const jwt = require('jsonwebtoken')

// Базовая авторизация — проверяет токен, кладёт userId и role в req
function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' })
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = payload.userId
    req.userRole = payload.role
    next()
  } catch {
    res.status(401).json({ error: 'Недействительный токен' })
  }
}

// Мягкая авторизация — не блокирует, но кладёт userId если токен есть
function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const token = header.slice(7)
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      req.userId = payload.userId
      req.userRole = payload.role
    } catch {
      // игнорируем невалидный токен
    }
  }
  next()
}

// Проверка роли — использовать после authMiddleware
function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: 'Недостаточно прав' })
    }
    next()
  }
}

module.exports = { authMiddleware, optionalAuth, requireRole }
