const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const { authMiddleware } = require('../middleware/auth')
const webpush = require('web-push')

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@smarussya.ru',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  )
}

// Helpers
async function getFamilyGroupId(userId) {
  const gm = await prisma.groupMember.findFirst({
    where: { userId, group: { type: 'FAMILY' } },
    select: { groupId: true },
  })
  return gm?.groupId || null
}

async function sendPushToGroup(groupId, excludeUserId, payload) {
  const subs = await prisma.pushSubscription.findMany({
    where: { user: { groupMembers: { some: { groupId } } }, NOT: { userId: excludeUserId } },
  })
  const payloadStr = JSON.stringify(payload)
  for (const sub of subs) {
    webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payloadStr,
    ).catch(() => {})
  }
}

// GET /api/meal-plans — получить план пользователя + семейный
router.get('/', authMiddleware, async (req, res) => {
  try {
    const familyGroupId = await getFamilyGroupId(req.userId)

    const where = familyGroupId
      ? { OR: [{ userId: req.userId, groupId: null }, { groupId: familyGroupId }] }
      : { userId: req.userId }

    const plans = await prisma.mealPlan.findMany({
      where,
      include: {
        dish: { select: { id: true, name: true, nameRu: true, imageUrl: true, images: true, categories: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    })
    res.json(plans)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/meal-plans — добавить блюдо в план
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { dishId, mealType = 'ANYTIME', date, note, shared = false } = req.body
    if (!dishId) return res.status(400).json({ error: 'dishId обязателен' })

    const dish = await prisma.dish.findUnique({ where: { id: dishId }, select: { id: true, nameRu: true } })
    if (!dish) return res.status(404).json({ error: 'Блюдо не найдено' })

    let groupId = null
    if (shared) {
      groupId = await getFamilyGroupId(req.userId)
    }

    const plan = await prisma.mealPlan.create({
      data: {
        dishId,
        userId: req.userId,
        groupId,
        mealType,
        date: date ? new Date(date) : null,
        note: note || null,
      },
      include: {
        dish: { select: { id: true, name: true, nameRu: true, imageUrl: true, images: true, categories: true } },
        user: { select: { id: true, name: true } },
      },
    })

    // Push-уведомление остальным участникам семейной группы
    if (groupId && process.env.VAPID_PUBLIC_KEY) {
      const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { name: true } })
      sendPushToGroup(groupId, req.userId, {
        title: 'Новое блюдо в плане',
        body: `${user?.name || 'Кто-то'} добавил${user?.name ? '' : 'а'} «${dish.nameRu}» в общий план`,
        url: `/dishes/${dishId}`,
      })
    }

    res.status(201).json(plan)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/meal-plans/:id — удалить запись из плана
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const plan = await prisma.mealPlan.findUnique({ where: { id: req.params.id } })
    if (!plan) return res.status(404).json({ error: 'Не найдено' })
    if (plan.userId !== req.userId) return res.status(403).json({ error: 'Нет доступа' })

    await prisma.mealPlan.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
