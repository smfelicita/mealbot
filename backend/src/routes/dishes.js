const router = require('express').Router()
const prisma = require('../lib/prisma')
const { authMiddleware: auth, optionalAuth } = require('../middleware/auth')
const { calculateNutrition } = require('../utils/nutrition')

// Вспомогательная — список groupId где user является участником
async function getMemberGroupIds(userId) {
  if (!userId) return []
  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  })
  return memberships.map(m => m.groupId)
}

// Вспомогательная — список FAMILY groupId пользователя
async function getFamilyGroupIds(userId) {
  if (!userId) return []
  const groups = await prisma.groupMember.findMany({
    where: { userId, group: { type: 'FAMILY' } },
    select: { groupId: true },
  })
  return groups.map(g => g.groupId)
}

// Фильтр "Моя кухня": только личные и семейные блюда
async function buildMyKitchenFilter(userId) {
  const familyGroupIds = await getFamilyGroupIds(userId)
  return {
    OR: [
      { authorId: userId },
      ...(familyGroupIds.length ? [{ visibility: 'FAMILY', groupId: { in: familyGroupIds } }] : []),
    ],
  }
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
      ...allGroupsCondition,
    ],
  }
}

// Проверка доступа к блюду по visibility — возвращает true если доступ разрешён
async function checkDishAccess(dish, userId) {
  if (dish.visibility === 'PUBLIC') return true
  if (dish.authorId === userId) return true
  const groupIds = await getMemberGroupIds(userId)
  if (dish.visibility === 'FAMILY' && dish.groupId) {
    return groupIds.includes(dish.groupId)
  }
  if (dish.visibility === 'ALL_GROUPS') {
    const sharedGroup = await prisma.groupMember.findFirst({
      where: { groupId: { in: groupIds }, userId: dish.authorId },
    })
    return Boolean(sharedGroup)
  }
  return false
}

// Полнотекстовый + нечёткий поиск через pg_trgm (raw SQL)
async function getSearchIds(q) {
  const likeQ = `%${q}%`
  const rows = await prisma.$queryRaw`
    SELECT DISTINCT d.id
    FROM dishes d
    LEFT JOIN dish_ingredients di ON di."dishId" = d.id
    LEFT JOIN ingredients i ON i.id = di."ingredientId"
    WHERE
      d."nameRu" ILIKE ${likeQ}
      OR d.description ILIKE ${likeQ}
      OR similarity(d."nameRu", ${q}) > 0.25
      OR EXISTS (SELECT 1 FROM unnest(d.tags) t WHERE t ILIKE ${likeQ})
      OR i."nameRu" ILIKE ${likeQ}
  `
  return rows.map(r => r.id)
}

// GET /api/dishes — поиск и фильтрация
// Query params: q, mealTime, category, tags, cuisine, ingredients, fridgeMode, myKitchen
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { q, mealTime, category, tags, cuisine, ingredients, fridgeMode, myKitchen, favorites } = req.query

    const visibilityFilter = (myKitchen === 'true' && req.userId)
      ? await buildMyKitchenFilter(req.userId)
      : await buildVisibilityFilter(req.userId)

    const baseWhere = { ...visibilityFilter, ...buildBaseFilter({ mealTime, category, tags, cuisine }) }
    if (q) {
      const ids = await getSearchIds(q)
      baseWhere.id = { in: ids }
    }

    if (favorites === 'true' && req.userId) {
      const favs = await prisma.favorite.findMany({
        where: { userId: req.userId },
        select: { dishId: true },
      })
      baseWhere.id = { in: favs.map(f => f.dishId) }
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
        const required = dish.ingredients.filter(di => !di.optional && !di.toTaste && !di.ingredient.ignoreInFridgeFilter).map(di => di.ingredientId)
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

    if (!await checkDishAccess(dish, req.userId)) {
      return res.status(403).json({ error: 'Нет доступа' })
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
      cookTime, difficulty, calories, imageUrl, images, videoUrl,
      recipe, ingredients, visibility = 'PRIVATE',
    } = req.body

    if (!nameRu?.trim()) return res.status(400).json({ error: 'Укажите название' })
    if (!categories?.length) return res.status(400).json({ error: 'Укажите категорию' })
    if (!mealTime?.length) return res.status(400).json({ error: 'Укажите время приёма пищи' })

    // Автоопределение groupId: FAMILY → семейная группа автора
    const resolvedGroupId = visibility === 'FAMILY'
      ? ((await getFamilyGroupIds(req.userId))[0] || null)
      : null

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
        images: images || [],
        videoUrl: videoUrl || null,
        recipe: recipe || null,
        visibility,
        authorId: req.userId,
        groupId: resolvedGroupId,
        ...(ingredients?.length ? {
          ingredients: {
            create: ingredients.map(ing => ({
              ingredientId: ing.id,
              amount: ing.amount || null,
              amountValue: ing.amountValue ? Number(ing.amountValue) : null,
              unit: ing.unit || null,
              toTaste: ing.toTaste || false,
              optional: ing.optional || false,
            })),
          },
        } : {}),
      },
      include: { ingredients: { include: { ingredient: true } } },
    })

    // Автоматический расчёт калорий если не введены вручную
    if (!calories && dish.ingredients.length) {
      const nutrition = calculateNutrition(dish.ingredients)
      if (nutrition) {
        await prisma.dish.update({ where: { id: dish.id }, data: { calories: nutrition.calories } })
        dish.calories = nutrition.calories
      }
    }

    res.status(201).json(formatDish(dish))
  } catch (err) {
    next(err)
  }
})

// POST /api/dishes/bulk — быстрое добавление нескольких блюд по названию
router.post('/bulk', auth, async (req, res, next) => {
  try {
    const { names } = req.body
    if (!Array.isArray(names) || !names.length) {
      return res.status(400).json({ error: 'Укажите названия блюд' })
    }

    const validNames = names.map(n => n?.trim()).filter(Boolean)
    if (!validNames.length) return res.status(400).json({ error: 'Названия не могут быть пустыми' })

    // Определяем видимость: FAMILY если есть семейная группа, иначе PRIVATE
    const familyGroups = await prisma.groupMember.findMany({
      where: { userId: req.userId, group: { type: 'FAMILY' } },
      select: { groupId: true },
    })
    const familyGroupId = familyGroups[0]?.groupId || null
    const visibility = familyGroupId ? 'FAMILY' : 'PRIVATE'

    const created = await Promise.all(
      validNames.map(nameRu =>
        prisma.dish.create({
          data: {
            name: nameRu,
            nameRu,
            categories: [],
            mealTime: ['ANYTIME'],
            tags: [],
            images: [],
            visibility,
            authorId: req.userId,
            groupId: familyGroupId,
          },
        })
      )
    )

    res.status(201).json({ created: created.map(d => ({ id: d.id, name: d.nameRu })) })
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
      cookTime, difficulty, calories, imageUrl, images, videoUrl,
      recipe, ingredients, visibility,
    } = req.body

    // Если меняется visibility — пересчитываем groupId
    let resolvedGroupId = undefined
    if (visibility !== undefined) {
      resolvedGroupId = visibility === 'FAMILY'
        ? ((await getFamilyGroupIds(req.userId))[0] || null)
        : null
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
        ...(images !== undefined && { images: images || [] }),
        ...(videoUrl !== undefined && { videoUrl: videoUrl || null }),
        ...(recipe !== undefined && { recipe: recipe || null }),
        ...(visibility !== undefined && { visibility }),
        ...(resolvedGroupId !== undefined && { groupId: resolvedGroupId }),
        ...(ingredients?.length ? {
          ingredients: {
            create: ingredients.map(ing => ({
              ingredientId: ing.id,
              amount: ing.amount || null,
              amountValue: ing.amountValue ? Number(ing.amountValue) : null,
              unit: ing.unit || null,
              toTaste: ing.toTaste || false,
              optional: ing.optional || false,
            })),
          },
        } : {}),
      },
      include: { ingredients: { include: { ingredient: true } } },
    })

    // Пересчитать калории если ингредиенты изменились и calories не передан вручную
    if (ingredients !== undefined && !calories && updated.ingredients.length) {
      const nutrition = calculateNutrition(updated.ingredients)
      if (nutrition) {
        await prisma.dish.update({ where: { id: updated.id }, data: { calories: nutrition.calories } })
        updated.calories = nutrition.calories
      }
    }

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

// GET /api/dishes/:id/recommendations
router.get('/:id/recommendations', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params

    const dish = await prisma.dish.findUnique({
      where: { id },
      include: { ingredients: { select: { ingredientId: true, toTaste: true } } },
    })
    if (!dish) return res.status(404).json({ error: 'Блюдо не найдено' })

    if (!await checkDishAccess(dish, req.userId)) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    const dishIngIds = dish.ingredients.filter(di => !di.toTaste).map(di => di.ingredientId)

    const visibilityFilter = await buildVisibilityFilter(req.userId)

    // Все видимые блюда (кроме текущего) с ингредиентами
    const allDishes = await prisma.dish.findMany({
      where: { ...visibilityFilter, id: { not: id } },
      include: {
        ingredients: {
          include: { ingredient: { select: { id: true, nameRu: true, emoji: true } } },
        },
      },
    })

    // Похожие: >= 2 общих ингредиента
    const similar = allDishes
      .map(d => {
        const dIngIds = d.ingredients.filter(di => !di.toTaste).map(di => di.ingredientId)
        const overlap = dIngIds.filter(iid => dishIngIds.includes(iid)).length
        return { d, overlap }
      })
      .filter(({ overlap }) => overlap >= 2)
      .sort((a, b) => b.overlap - a.overlap)
      .slice(0, 6)
      .map(({ d }) => formatDish(d))

    if (!req.userId) {
      return res.json({ similar, fromFridge: null, nearMatch: null })
    }

    // Семейный холодильник или личный
    const familyMembership = await prisma.groupMember.findFirst({
      where: { userId: req.userId, group: { type: 'FAMILY' } },
      select: { groupId: true },
    })
    const fridgeWhere = familyMembership
      ? { groupId: familyMembership.groupId }
      : { userId: req.userId, groupId: null }
    const fridgeItems = await prisma.fridgeItem.findMany({ where: fridgeWhere, select: { ingredientId: true } })
    const fridgeIds = fridgeItems.map(f => f.ingredientId)

    // Из холодильника: все обязательные ингредиенты есть (специи игнорируем)
    const fromFridge = allDishes
      .filter(d => {
        const required = d.ingredients.filter(di => !di.toTaste && !di.optional && !di.ingredient.ignoreInFridgeFilter).map(di => di.ingredientId)
        return required.length > 0 && required.every(iid => fridgeIds.includes(iid))
      })
      .slice(0, 6)
      .map(d => formatDish(d))

    // nearMatch: 1–3 недостающих обязательных ингредиента (специи игнорируем)
    const nearMatch = allDishes
      .map(d => {
        const required = d.ingredients.filter(di => !di.toTaste && !di.optional && !di.ingredient.ignoreInFridgeFilter)
        const missing = required.filter(di => !fridgeIds.includes(di.ingredientId))
        return {
          dish: formatDish(d),
          missing: missing.map(di => ({ name: di.ingredient.nameRu, emoji: di.ingredient.emoji })),
        }
      })
      .filter(({ missing }) => missing.length >= 1 && missing.length <= 3)
      .sort((a, b) => a.missing.length - b.missing.length)
      .slice(0, 6)

    res.json({ similar, fromFridge, nearMatch })
  } catch (err) {
    next(err)
  }
})

const VALID_MEALTYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'ANYTIME']
const MEALTIME_STRING_MAP = { breakfast: 'BREAKFAST', lunch: 'LUNCH', dinner: 'DINNER', snack: 'SNACK', anytime: 'ANYTIME' }

function normalizeMealTime(mt) {
  if (!mt) return null
  return VALID_MEALTYPES.includes(mt) ? mt : (MEALTIME_STRING_MAP[mt.toLowerCase()] || null)
}

function buildBaseFilter({ mealTime, category, tags, cuisine }) {
  const where = {}
  if (mealTime) {
    const mt = normalizeMealTime(mealTime)
    if (mt) where.mealTime = { has: mt }
  }
  if (category) where.categories = { has: category }
  if (cuisine) where.cuisine = { contains: cuisine, mode: 'insensitive' }
  if (tags) {
    const tagList = tags.split(',').filter(Boolean)
    if (tagList.length) where.tags = { hasSome: tagList }
  }
  return where
}

function formatDish(dish) {
  const nutrition = dish.ingredients?.length ? calculateNutrition(dish.ingredients) : null
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
    nutrition,
    imageUrl: dish.imageUrl,
    images: dish.images || [],
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
      amountValue: di.amountValue,
      unit: di.unit,
      toTaste: di.toTaste,
      optional: di.optional,
    })),
  }
}

function formatDishes(dishes) {
  return dishes.map(formatDish)
}

module.exports = router
