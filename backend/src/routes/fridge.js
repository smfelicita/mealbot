const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const auth = require('../middleware/auth')
const prisma = new PrismaClient()

// All fridge routes require auth
router.use(auth)

// GET /api/fridge — получить продукты из холодильника
router.get('/', async (req, res, next) => {
  try {
    const items = await prisma.fridgeItem.findMany({
      where: { userId: req.userId },
      include: { ingredient: true },
      orderBy: { ingredient: { nameRu: 'asc' } },
    })
    res.json(items.map(item => ({
      id: item.id,
      ingredientId: item.ingredientId,
      name: item.ingredient.nameRu,
      emoji: item.ingredient.emoji,
      category: item.ingredient.category,
      addedAt: item.addedAt,
      expiresAt: item.expiresAt,
    })))
  } catch (err) {
    next(err)
  }
})

// POST /api/fridge — добавить продукт
router.post('/', async (req, res, next) => {
  try {
    const { ingredientId, expiresAt } = req.body
    if (!ingredientId) return res.status(400).json({ error: 'ingredientId обязателен' })

    const ingredient = await prisma.ingredient.findUnique({ where: { id: ingredientId } })
    if (!ingredient) return res.status(404).json({ error: 'Продукт не найден' })

    const item = await prisma.fridgeItem.upsert({
      where: { userId_ingredientId: { userId: req.userId, ingredientId } },
      update: { expiresAt: expiresAt ? new Date(expiresAt) : null },
      create: { userId: req.userId, ingredientId, expiresAt: expiresAt ? new Date(expiresAt) : null },
      include: { ingredient: true },
    })

    res.status(201).json({
      id: item.id,
      ingredientId: item.ingredientId,
      name: item.ingredient.nameRu,
      emoji: item.ingredient.emoji,
      addedAt: item.addedAt,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/fridge/bulk — добавить несколько продуктов сразу (для Telegram-бота)
router.post('/bulk', async (req, res, next) => {
  try {
    const { ingredientIds } = req.body
    if (!Array.isArray(ingredientIds)) return res.status(400).json({ error: 'ingredientIds должен быть массивом' })

    const results = []
    for (const ingredientId of ingredientIds) {
      const item = await prisma.fridgeItem.upsert({
        where: { userId_ingredientId: { userId: req.userId, ingredientId } },
        update: {},
        create: { userId: req.userId, ingredientId },
        include: { ingredient: true },
      })
      results.push({ ingredientId, name: item.ingredient.nameRu })
    }

    res.json({ added: results })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/fridge/:ingredientId — убрать продукт
router.delete('/:ingredientId', async (req, res, next) => {
  try {
    await prisma.fridgeItem.deleteMany({
      where: { userId: req.userId, ingredientId: req.params.ingredientId },
    })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/fridge — очистить холодильник
router.delete('/', async (req, res, next) => {
  try {
    await prisma.fridgeItem.deleteMany({ where: { userId: req.userId } })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
