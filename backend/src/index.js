require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const authRoutes = require('./routes/auth')
const dishRoutes = require('./routes/dishes')
const fridgeRoutes = require('./routes/fridge')
const chatRoutes = require('./routes/chat')
const ingredientRoutes = require('./routes/ingredients')
const uploadRoutes = require('./routes/upload')
const groupRoutes = require('./routes/groups')
const mealPlanRoutes = require('./routes/meal-plans')
// const pushRoutes = require('./routes/push') // отключено — уведомления через Telegram
const telegramRoutes = require('./routes/telegram')
const favoriteRoutes = require('./routes/favorites')
const commentRoutes = require('./routes/comments')
const inviteRoutes = require('./routes/invites')

// Планировщик уведомлений (запускается сразу при старте)
require('./lib/scheduler')

// Очистка при старте
const prisma = require('./lib/prisma')
prisma.verificationCode.deleteMany({ where: { expiresAt: { lt: new Date() } } })
  .then(r => r.count > 0 && console.log(`[startup] Deleted ${r.count} expired verification codes`))
  .catch(() => {})
// Старые pendingTelegramLink без TTL (созданные устаревшим роутом) — сбрасываем
prisma.user.updateMany({
  where: { pendingTelegramLink: { not: null }, pendingTelegramLinkExpiresAt: null },
  data: { pendingTelegramLink: null },
}).then(r => r.count > 0 && console.log(`[startup] Cleared ${r.count} legacy pendingTelegramLink records`))
  .catch(() => {})

const app = express()
const PORT = process.env.PORT || 3001

// Request ID + structured logging
const requestId     = require('./middleware/requestId')
const requestLogger = require('./middleware/requestLogger')
app.use(requestId)
app.use(requestLogger)

// Security
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Rate limiting
app.use('/api/chat', rateLimit({ windowMs: 60_000, max: 20, message: 'Слишком много запросов к ИИ' }))
app.use('/api', rateLimit({ windowMs: 60_000, max: 100 }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/dishes', dishRoutes)
app.use('/api/fridge', fridgeRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/ingredients', ingredientRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/groups', groupRoutes)
app.use('/api/meal-plans', mealPlanRoutes)
// app.use('/api/push', pushRoutes) // отключено — уведомления через Telegram
app.use('/api/telegram', telegramRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api', inviteRoutes)

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

// Error handler
const errorHandler = require('./middleware/errorHandler')
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
})

module.exports = app
