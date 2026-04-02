const router = require('express').Router()
const crypto = require('crypto')
const prisma = require('../lib/prisma')
const { authMiddleware: auth } = require('../middleware/auth')

// POST /api/telegram/link-token — сгенерировать одноразовый токен для связки
router.post('/link-token', auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { telegramId: true },
    })
    if (user?.telegramId) {
      return res.json({ already_linked: true })
    }

    const token = crypto.randomBytes(16).toString('hex')
    await prisma.user.update({
      where: { id: req.userId },
      data: { pendingTelegramLink: token },
    })

    res.json({ token, botUsername: process.env.TELEGRAM_BOT_USERNAME || '' })
  } catch (err) { next(err) }
})

// GET /api/telegram/link-status — проверить, подключён ли Telegram
router.get('/link-status', auth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { telegramId: true },
    })
    res.json({ linked: !!user?.telegramId })
  } catch (err) { next(err) }
})

module.exports = router
