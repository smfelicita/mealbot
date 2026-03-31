const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const { authMiddleware } = require('../middleware/auth')

// GET /api/push/vapid-key — отдать публичный VAPID ключ
router.get('/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' })
})

// POST /api/push/subscribe — сохранить подписку браузера
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { endpoint, keys } = req.body
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Некорректная подписка' })
    }

    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, userId: req.userId },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: req.userId },
    })

    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/push/unsubscribe — удалить подписку
router.delete('/unsubscribe', authMiddleware, async (req, res) => {
  try {
    const { endpoint } = req.body
    if (endpoint) {
      await prisma.pushSubscription.deleteMany({
        where: { endpoint, userId: req.userId },
      })
    } else {
      await prisma.pushSubscription.deleteMany({ where: { userId: req.userId } })
    }
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
