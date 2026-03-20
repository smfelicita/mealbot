const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// GET /api/ingredients — список всех продуктов (для поиска при добавлении в холодильник)
router.get('/', async (req, res, next) => {
  try {
    const { q, category } = req.query
    const where = {}
    if (q) where.nameRu = { contains: q, mode: 'insensitive' }
    if (category) where.category = category

    const ingredients = await prisma.ingredient.findMany({
      where,
      orderBy: { nameRu: 'asc' },
    })
    res.json(ingredients)
  } catch (err) {
    next(err)
  }
})

module.exports = router
