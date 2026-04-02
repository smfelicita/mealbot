const router = require('express').Router()
const prisma = require('../lib/prisma')
const { authMiddleware: auth, optionalAuth } = require('../middleware/auth')
const { distance } = require('fastest-levenshtein')

function fuzzyScore(query, name) {
  const q = query.toLowerCase()
  const n = name.toLowerCase()
  if (n.includes(q)) return 0
  return distance(q, n)
}

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

    if (!q) {
      const ingredients = await prisma.ingredient.findMany({
        where: { ...visibilityFilter, ...(category ? { category } : {}) },
        orderBy: [{ isPublic: 'desc' }, { nameRu: 'asc' }],
      })
      return res.json(ingredients)
    }

    // Сначала точный поиск (contains)
    const exact = await prisma.ingredient.findMany({
      where: {
        ...visibilityFilter,
        nameRu: { contains: q, mode: 'insensitive' },
        ...(category ? { category } : {}),
      },
      orderBy: [{ isPublic: 'desc' }, { nameRu: 'asc' }],
    })
    if (exact.length > 0) return res.json(exact)

    // Fuzzy fallback — если ничего не нашли точным поиском
    const all = await prisma.ingredient.findMany({
      where: { ...visibilityFilter, ...(category ? { category } : {}) },
    })
    const threshold = Math.max(2, Math.floor(q.length / 3))
    const fuzzy = all
      .map(i => ({ ...i, _score: fuzzyScore(q, i.nameRu) }))
      .filter(i => i._score <= threshold)
      .sort((a, b) => a._score - b._score)
      .map(({ _score, ...i }) => i)

    res.json(fuzzy)
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
