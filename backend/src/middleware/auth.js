const jwt = require('jsonwebtoken')
const prisma = require('../lib/prisma')

// Базовая авторизация — проверяет токен и tokenVersion, кладёт userId и role в req
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Требуется авторизация' })
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    // Проверяем tokenVersion — если пользователь вышел, версия не совпадёт
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { tokenVersion: true },
    })
    if (!user || user.tokenVersion !== payload.tokenVersion) {
      return res.status(401).json({ error: 'Сессия завершена' })
    }
    req.userId = payload.userId
    req.userRole = payload.role
    next()
  } catch {
    res.status(401).json({ error: 'Недействительный токен' })
  }
}

// Мягкая авторизация — не блокирует, но кладёт userId если токен есть и tokenVersion совпадает
async function optionalAuth(req, res, next) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const token = header.slice(7)
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { tokenVersion: true },
      })
      if (user && user.tokenVersion === payload.tokenVersion) {
        req.userId = payload.userId
        req.userRole = payload.role
      }
      // Если tokenVersion не совпадает — игнорируем токен (гостевой режим)
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
