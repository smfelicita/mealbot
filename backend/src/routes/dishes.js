const router = require('express').Router()
const prisma = require('../lib/prisma')
const { authMiddleware: auth, optionalAuth } = require('../middleware/auth')

// Вспомогательная — список groupId где user является участником
async function getMemberGroupIds(userId) {
  if (!userId) return []
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  })
  return memberships.map(m => m.groupId)
}

// Строит фильтр видимости с учётом групп и DishVisibility
async function buildVisibilityFilter(userId) {
  const groupIds = await getMemberGroupIds(userId)

  // ALL_GROUPS: рецепты авторов, с которыми я в одной группе
  let allGroupsCondition = []
  if (userId && groupIds.length) {
    const coMembers = await prisma.groupMember.findMany({
      where: { groupId: { in: groupIds }, userId: { not: userId } },
      select: { userId: true },
    })
    const coMemberIds = [...new Set(coMembers.map(m => m.userId))]
    if (coMemberIds.length) {
      allGroupsCondition = [{ visibility: 'ALL_GROUPS', authorId: { in: coMemberIds } }]
    }
  }

  // FAMILY: рецепты с groupId, который является семейной группой пользователя
  const familyGroupIds = groupIds.length
    ? (await prisma.group.findMany({
        where: { id: { in: groupIds }, type: 'FAMILY' },
        select: { id: true },
      })).map(g => g.id)
    : []

  return {
    OR: [
      { visibility: 'PUBLIC' },
      ...(userId ? [{ authorId: userId }] : []),
      ...(groupIds.length ? [{ visibility: 'FAMILY', groupId: { in: familyGroupIds.length ? familyGroupIds : ['__none__'] } }] : []),
      ...(groupIds.length ? [{ visibility: 'PRIVATE', groupId: { in: groupIds } }] : []),
      ...allGroupsCondition,
    ],
  }
}

// Полнотекстовый + нечёткий поиск через pg_trgm (raw SQL)
async function getSearchIds(q) {
  const likeQ = `%${q}%`
  const rows = await prisma.$queryRaw`
    SELECT DISTINCT d.id
    FROM dishes d
    LEFT JOIN dish_ingredients di ON di.dish_id = d.id
    LEFT JOIN ingredients i ON i.id = di.ingredient_id
    WHERE
      d.name_ru ILIKE ${likeQ}
      OR d.description ILIKE ${likeQ}
      OR similarity(d.name_ru, ${q}) > 0.25
      OR EXISTS (SELECT 1 FROM unnest(d.tags) t WHERE t ILIKE ${likeQ})
      OR i.name_ru ILIKE ${likeQ}
  `
  return rows.map(r => r.id)
}

// GET /api/dishes — поиск и фильтрация
// Query params: q, mealTime, category, tags, cuisine, ingredients, fridgeMode
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { q, mealTime, category, tags, cuisine, ingredients, fridgeMode } = req.query

    const visibilityFilter = await buildVisibilityFilter(req.userId)

    const baseWhere = { ...visibilityFilter, ...buildBaseFilter({ mealTime, category, tags, cuisine }) }
    if (q) {
      const ids = await getSearchIds(q)
      baseWhere.id = { in: ids }
    }

    if (fridgeMode === 'true') {
      if (!req.userId) {
        return res.status(401).json({ error: 'Войдите для режима холодильника' })
      }
      const familyMembership = await prisma.groupMember.findFirst({
        where: { userId: req.userId, group: { type: 'FAMILY' } },
        select: { groupId: true },
      })
      const fridgeWhere = familyMembership
        ? { groupId: familyMembership.groupId }
        : { userId: req.userId, groupId: null }
      const fridgeItems = await prisma.fridgeItem.findMany({
        where: fridgeWhere,
        select: { ingredientId: true },
      })
      const fridgeIngredientIds = fridgeItems.map(f => f.ingredientId)

      const allDishes = await prisma.dish.findMany({
        include: { ingredients: { include: { ingredient: true } } },
        where: baseWhere,
        orderBy: { nameRu: 'asc' },
      })

      const filtered = allDishes.filter(dish => {
        const required = dish.ingredients.filter(di => !di.optional).map(di => di.ingredientId)
        return required.every(id => fridgeIngredientIds.includes(id))
      })

      return res.json(formatDishes(filtered))
    }

    const ingredientIds = ingredients ? ingredients.split(',').filter(Boolean) : null

    const where = {
      ...baseWhere,
      ...(ingredientIds?.length
        ? { ingredients: { some: { ingredientId: { in: ingredientIds } } } }
        : {}),
    }

    const dishes = await prisma.dish.findMany({
      where,
      include: { ingredients: { include: { ingredient: true } } },
      orderBy: { nameRu: 'asc' },
    })

    res.json(formatDishes(dishes))
  } catch (err) {
    next(err)
  }
})

// GET /api/dishes/my
router.get('/my', auth, async (req, res, next) => {
  try {
    const dishes = await prisma.dish.findMany({
      where: { authorId: req.userId },
      include: { ingredients: { include: { ingredient: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(formatDishes(dishes))
  } catch (err) {
    next(err)
  }
})

// GET /api/dishes/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const dish = await prisma.dish.findUnique({
      where: { id: req.params.id },
      include: { ingredients: { include: { ingredient: true } } },
    })
    if (!dish) return res.status(404).json({ error: 'Блюдо не найдено' })

    // Проверка доступа по visibility
    if (dish.visibility !== 'PUBLIC' && dish.authorId !== req.userId) {
      const groupIds = await getMemberGroupIds(req.userId)
      if (dish.visibility === 'PRIVATE' && dish.groupId) {
        if (!groupIds.includes(dish.groupId)) return res.status(403).json({ error: 'Нет доступа' })
      } else if (dish.visibility === 'FAMILY' && dish.groupId) {
        if (!groupIds.includes(dish.groupId)) return res.status(403).json({ error: 'Нет доступа' })
      } else if (dish.visibility === 'ALL_GROUPS') {
        // Проверяем что у нас есть хотя бы одна общая группа с автором
        const sharedGroup = await prisma.groupMember.findFirst({
          where: { groupId: { in: groupIds }, userId: dish.authorId },
        })
        if (!sharedGroup) return res.status(403).json({ error: 'Нет доступа' })
      } else {
        return res.status(403).json({ error: 'Нет доступа' })
      }
    }
    res.json(formatDish(dish))
  } catch (err) {
    next(err)
  }
})

// POST /api/dishes
router.post('/', auth, async (req, res, next) => {
  try {
    const {
      nameRu, description, categories, cuisine, mealTime, tags,
      cookTime, difficulty, calories, imageUrl, videoUrl,
      recipe, ingredients, visibility = 'PRIVATE', groupId,
    } = req.body

    if (!nameRu?.trim()) return res.status(400).json({ error: 'Укажите название' })
    if (!categories?.length) return res.status(400).json({ error: 'Укажите категорию' })

    // Проверить членство в группе если groupId указан
    if (groupId) {
      const memberGroupIds = await getMemberGroupIds(req.userId)
      if (!memberGroupIds.includes(groupId)) return res.status(403).json({ error: 'Вы не являетесь участником этой группы' })
    }

    const dish = await prisma.dish.create({
      data: {
        name: nameRu.trim(),
        nameRu: nameRu.trim(),
        description: description || null,
        categories: categories || [],
        cuisine: cuisine || null,
        mealTime: mealTime || [],
        tags: tags || [],
        cookTime: cookTime ? Number(cookTime) : null,
        difficulty: difficulty || null,
        calories: calories ? Number(calories) : null,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        recipe: recipe || null,
        visibility,
        authorId: req.userId,
        groupId: groupId || null,
        ...(ingredients?.length ? {
          ingredients: {
            create: ingredients.map(ing => ({
              ingredientId: ing.id,
              amount: ing.amount || null,
              optional: ing.optional || false,
            })),
          },
        } : {}),
      },
      include: { ingredients: { include: { ingredient: true } } },
    })

    res.status(201).json(formatDish(dish))
  } catch (err) {
    next(err)
  }
})

// PUT /api/dishes/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const dish = await prisma.dish.findUnique({ where: { id: req.params.id } })
    if (!dish) return res.status(404).json({ error: 'Блюдо не найдено' })
    if (dish.authorId !== req.userId) return res.status(403).json({ error: 'Нет доступа' })

    const {
      nameRu, description, categories, cuisine, mealTime, tags,
      cookTime, difficulty, calories, imageUrl, videoUrl,
      recipe, ingredients, visibility, groupId,
    } = req.body

    if (groupId !== undefined && groupId) {
      const memberGroupIds = await getMemberGroupIds(req.userId)
      if (!memberGroupIds.includes(groupId)) return res.status(403).json({ error: 'Вы не являетесь участником этой группы' })
    }

    if (ingredients !== undefined) {
      await prisma.dishIngredient.deleteMany({ where: { dishId: dish.id } })
    }

    const updated = await prisma.dish.update({
      where: { id: req.params.id },
      data: {
        ...(nameRu && { name: nameRu.trim(), nameRu: nameRu.trim() }),
        ...(description !== undefined && { description: description || null }),
        ...(categories !== undefined && { categories }),
        ...(cuisine !== undefined && { cuisine: cuisine || null }),
        ...(mealTime !== undefined && { mealTime }),
        ...(tags !== undefined && { tags }),
        ...(cookTime !== undefined && { cookTime: cookTime ? Number(cookTime) : null }),
        ...(difficulty !== undefined && { difficulty: difficulty || null }),
        ...(calories !== undefined && { calories: calories ? Number(calories) : null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
        ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
        ...(recipe !== undefined && { recipe: recipe || null }),
        ...(visibility !== undefined && { visibility }),
        ...(groupId !== undefined && { groupId: groupId || null }),
        ...(ingredients?.length ? {
          ingredients: {
            create: ingredients.map(ing => ({
              ingredientId: ing.id,
              amount: ing.amount || null,
              optional: ing.optional || false,
            })),
          },
        } : {}),
      },
      include: { ingredients: { include: { ingredient: true } } },
    })

    res.json(formatDish(updated))
  } catch (err) {
    next(err)
  }
})

// DELETE /api/dishes/:id
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const dish = await prisma.dish.findUnique({ where: { id: req.params.id } })
    if (!dish) return res.status(404).json({ error: 'Блюдо не найдено' })
    if (dish.authorId !== req.userId) return res.status(403).json({ error: 'Нет доступа' })
    await prisma.dish.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

function buildBaseFilter({ mealTime, category, tags, cuisine }) {
  const where = {}
  if (mealTime) where.mealTime = { has: mealTime }
  if (category) where.categories = { has: category }
  if (cuisine) where.cuisine = { contains: cuisine, mode: 'insensitive' }
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
    categories: dish.categories,
    cuisine: dish.cuisine,
    mealTime: dish.mealTime,
    tags: dish.tags,
    cookTime: dish.cookTime,
    difficulty: dish.difficulty,
    calories: dish.calories,
    imageUrl: dish.imageUrl,
    videoUrl: dish.videoUrl,
    recipe: dish.recipe,
    visibility: dish.visibility,
    authorId: dish.authorId,
    groupId: dish.groupId,
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
