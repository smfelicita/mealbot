const router = require('express').Router()
const prisma = require('../lib/prisma')
const { authMiddleware: auth } = require('../middleware/auth')

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
