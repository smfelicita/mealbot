const router = require('express').Router()
const prisma = require('../lib/prisma')
const { authMiddleware: auth, optionalAuth } = require('../middleware/auth')

// GET /api/ingredients — публичные + свои кастомные (если авторизован)
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { q, category } = req.query

    const visibilityFilter = {
      OR: [
        { isPublic: true },
        ...(req.userId ? [{ authorId: req.userId }] : []),
      ],
    }

    const where = {
      ...visibilityFilter,
      ...(q ? { nameRu: { contains: q, mode: 'insensitive' } } : {}),
      ...(category ? { category } : {}),
    }

    const ingredients = await prisma.ingredient.findMany({
      where,
      orderBy: [{ isPublic: 'desc' }, { nameRu: 'asc' }],
    })

    res.json(ingredients)
  } catch (err) {
    next(err)
  }
})

// POST /api/ingredients — создать кастомный ингредиент
// Виден только автору; ADMIN может одобрить (сделать isPublic: true) позже
router.post('/', auth, async (req, res, next) => {
  try {
    const { nameRu, category } = req.body
    if (!nameRu?.trim()) return res.status(400).json({ error: 'Укажите название ингредиента' })
    if (!category) return res.status(400).json({ error: 'Укажите категорию' })

    // Проверяем наличие в публичных или среди своих
    const existing = await prisma.ingredient.findFirst({
      where: {
        nameRu: { equals: nameRu.trim(), mode: 'insensitive' },
        OR: [{ isPublic: true }, { authorId: req.userId }],
      },
    })
    if (existing) {
      return res.status(409).json({ error: 'Такой ингредиент уже существует', ingredient: existing })
    }

    const ingredient = await prisma.ingredient.create({
      data: {
        name: `custom_${req.userId}_${Date.now()}`,
        nameRu: nameRu.trim(),
        category,
        isPublic: false,
        authorId: req.userId,
      },
    })

    res.status(201).json(ingredient)
  } catch (err) {
    next(err)
  }
})

module.exports = router
