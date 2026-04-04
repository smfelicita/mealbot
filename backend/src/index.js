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

// Планировщик уведомлений (запускается сразу при старте)
require('./lib/scheduler')

const app = express()
const PORT = process.env.PORT || 3001

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

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }))

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    error: err.message || 'Внутренняя ошибка сервера',
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`)
})

module.exports = app
