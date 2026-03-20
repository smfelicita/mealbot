const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const auth = require('../middleware/auth')
const prisma = new PrismaClient()

// GET /api/dishes — поиск и фильтрация
// Query params:
//   q            — поиск по названию
//   mealTime     — breakfast|lunch|dinner|snack
//   category     — BREAKFAST|LUNCH|DINNER|...
//   tags         — comma-separated tags
//   ingredients  — comma-separated ingredient ids (инклюзивная)
//   fridgeMode   — true (эксклюзивная по холодильнику пользователя)
router.get('/', async (req, res, next) => {
  try {
    const { q, mealTime, category, tags, ingredients, fridgeMode } = req.query

    // Fridge mode требует авторизации
    let fridgeIngredientIds = null
    if (fridgeMode === 'true') {
      const authHeader = req.headers.authorization
      if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Войдите для режима холодильника' })
      }
      const jwt = require('jsonwebtoken')
      const payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET)
      const fridgeItems = await prisma.fridgeItem.findMany({
        where: { userId: payload.userId },
        select: { ingredientId: true },
      })
      fridgeIngredientIds = fridgeItems.map(f => f.ingredientId)
    }

    // Для эксклюзивного режима — находим блюда, у которых ВСЕ ингредиенты есть в холодильнике
    if (fridgeIngredientIds !== null) {
      const allDishes = await prisma.dish.findMany({
        include: {
          ingredients: {
            include: { ingredient: true },
          },
        },
        where: buildBaseFilter({ q, mealTime, category, tags }),
        orderBy: { nameRu: 'asc' },
      })

      const filtered = allDishes.filter(dish => {
        const required = dish.ingredients
          .filter(di => !di.optional)
          .map(di => di.ingredientId)
        return required.every(id => fridgeIngredientIds.includes(id))
      })

      return res.json(formatDishes(filtered))
    }

    // Инклюзивная фильтрация по переданным ингредиентам
    const ingredientIds = ingredients ? ingredients.split(',').filter(Boolean) : null

    const where = {
      ...buildBaseFilter({ q, mealTime, category, tags }),
      ...(ingredientIds?.length
        ? {
            ingredients: {
              some: { ingredientId: { in: ingredientIds } },
            },
          }
        : {}),
    }

    const dishes = await prisma.dish.findMany({
      where,
      include: {
        ingredients: {
          include: { ingredient: true },
        },
      },
      orderBy: { nameRu: 'asc' },
    })

    res.json(formatDishes(dishes))
  } catch (err) {
    next(err)
  }
})

// GET /api/dishes/:id
router.get('/:id', async (req, res, next) => {
  try {
    const dish = await prisma.dish.findUnique({
      where: { id: req.params.id },
      include: {
        ingredients: { include: { ingredient: true } },
      },
    })
    if (!dish) return res.status(404).json({ error: 'Блюдо не найдено' })
    res.json(formatDish(dish))
  } catch (err) {
    next(err)
  }
})

function buildBaseFilter({ q, mealTime, category, tags }) {
  const where = {}
  if (q) {
    where.OR = [
      { nameRu: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ]
  }
  if (mealTime) where.mealTime = { has: mealTime }
  if (category) where.category = category
  if (tags) {
    const tagList = tags.split(',').filter(Boolean)
    if (tagList.length) where.tags = { hasSome: tagList }
  }
  return where
}

function formatDish(dish) {
  return {
    id: dish.id,
    name: dish.nameRu,
    description: dish.description,
    category: dish.category,
    mealTime: dish.mealTime,
    tags: dish.tags,
    cookTime: dish.cookTime,
    difficulty: dish.difficulty,
    calories: dish.calories,
    imageUrl: dish.imageUrl,
    recipe: dish.recipe,
    ingredients: dish.ingredients.map(di => ({
      id: di.ingredient.id,
      name: di.ingredient.nameRu,
      emoji: di.ingredient.emoji,
      amount: di.amount,
      optional: di.optional,
    })),
  }
}

function formatDishes(dishes) {
  return dishes.map(formatDish)
}

module.exports = router
