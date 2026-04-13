const router = require('express').Router()
const prisma = require('../lib/prisma')
const { authMiddleware: auth } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { fridgeItemAdd, fridgeBulk, fridgePatch } = require('../lib/schemas')
const { logger } = require('../lib/logger')

router.use(auth)

// Найти семейную группу пользователя (если есть)
async function getFamilyGroupId(userId) {
  const membership = await prisma.groupMember.findFirst({
    where: { userId, group: { type: 'FAMILY' } },
    select: { groupId: true },
  })
  return membership?.groupId || null
}

// Upsert: для семейного холодильника — уникально по (groupId, ingredientId),
// для личного — по (userId, ingredientId, groupId=null)
// defaultQuantity/defaultUnit — дефолты из ингредиента, применяются только при создании нового item
async function upsertFridgeItem(userId, familyGroupId, ingredientId, expiresAt, quantityValue, quantityUnit, defaultQuantity, defaultUnit) {
  // При создании: если qty не передано явно — берём дефолт из ингредиента
  const createQty = quantityValue !== undefined ? (quantityValue ?? null) : (defaultQuantity ?? null)
  const createUnit = quantityUnit !== undefined ? (quantityUnit ?? null) : (defaultUnit ?? null)

  if (familyGroupId) {
    const existing = await prisma.fridgeItem.findFirst({
      where: { groupId: familyGroupId, ingredientId },
    })
    if (existing) {
      return prisma.fridgeItem.update({
        where: { id: existing.id },
        data: {
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          ...(quantityValue !== undefined && { quantityValue: quantityValue ?? null }),
          ...(quantityUnit !== undefined && { quantityUnit: quantityUnit ?? null }),
        },
        include: { ingredient: true },
      })
    }
    return prisma.fridgeItem.create({
      data: { userId, groupId: familyGroupId, ingredientId, expiresAt: expiresAt ? new Date(expiresAt) : null, quantityValue: createQty, quantityUnit: createUnit },
      include: { ingredient: true },
    })
  } else {
    const existing = await prisma.fridgeItem.findFirst({
      where: { userId, ingredientId, groupId: null },
    })
    if (existing) {
      return prisma.fridgeItem.update({
        where: { id: existing.id },
        data: {
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          ...(quantityValue !== undefined && { quantityValue: quantityValue ?? null }),
          ...(quantityUnit !== undefined && { quantityUnit: quantityUnit ?? null }),
        },
        include: { ingredient: true },
      })
    }
    return prisma.fridgeItem.create({
      data: { userId, groupId: null, ingredientId, expiresAt: expiresAt ? new Date(expiresAt) : null, quantityValue: createQty, quantityUnit: createUnit },
      include: { ingredient: true },
    })
  }
}

function formatItem(item) {
  return {
    id: item.id,
    ingredientId: item.ingredientId,
    name: item.ingredient.nameRu,
    emoji: item.ingredient.emoji,
    category: item.ingredient.category,
    isBasic: item.ingredient.isBasic || false,
    quantityValue: item.quantityValue ?? null,
    quantityUnit: item.quantityUnit ?? null,
    addedAt: item.addedAt,
    expiresAt: item.expiresAt,
    addedByUserId: item.userId,
  }
}

// GET /api/fridge
router.get('/', async (req, res, next) => {
  try {
    const familyGroupId = await getFamilyGroupId(req.userId)
    const where = familyGroupId
      ? { groupId: familyGroupId }
      : { userId: req.userId, groupId: null }

    const items = await prisma.fridgeItem.findMany({
      where,
      include: { ingredient: true },
      orderBy: { ingredient: { nameRu: 'asc' } },
    })
    res.json({ items: items.map(formatItem), familyGroupId })
  } catch (err) { next(err) }
})

// POST /api/fridge
router.post('/', validate(fridgeItemAdd), async (req, res, next) => {
  try {
    const { ingredientId, expiresAt, quantityValue, quantityUnit } = req.body
    if (!ingredientId) return res.status(400).json({ error: 'ingredientId обязателен' })

    const ingredient = await prisma.ingredient.findUnique({ where: { id: ingredientId } })
    if (!ingredient) return res.status(404).json({ error: 'Продукт не найден' })

    const familyGroupId = await getFamilyGroupId(req.userId)
    const item = await upsertFridgeItem(req.userId, familyGroupId, ingredientId, expiresAt, quantityValue, quantityUnit, ingredient.defaultQuantity, ingredient.defaultUnit)

    logger.info({ action: 'fridge_item_added', ingredientId, userId: req.userId, familyGroupId: familyGroupId || null, requestId: req.requestId }, 'fridge_item_added')
    res.status(201).json(formatItem(item))
  } catch (err) { next(err) }
})

// POST /api/fridge/bulk
router.post('/bulk', validate(fridgeBulk), async (req, res, next) => {
  try {
    const { ingredientIds } = req.body
    if (!Array.isArray(ingredientIds)) return res.status(400).json({ error: 'ingredientIds должен быть массивом' })

    const familyGroupId = await getFamilyGroupId(req.userId)
    const results = []
    for (const ingredientId of ingredientIds) {
      const ingredient = await prisma.ingredient.findUnique({ where: { id: ingredientId }, select: { nameRu: true, defaultQuantity: true, defaultUnit: true } })
      if (!ingredient) continue
      const item = await upsertFridgeItem(req.userId, familyGroupId, ingredientId, null, undefined, undefined, ingredient.defaultQuantity, ingredient.defaultUnit)
      results.push({ ingredientId, name: item.ingredient.nameRu })
    }
    res.json({ added: results })
  } catch (err) { next(err) }
})

// PATCH /api/fridge/:ingredientId — обновить количество
router.patch('/:ingredientId', validate(fridgePatch), async (req, res, next) => {
  try {
    const { quantityValue, quantityUnit } = req.body
    const familyGroupId = await getFamilyGroupId(req.userId)
    const where = familyGroupId
      ? { groupId: familyGroupId, ingredientId: req.params.ingredientId }
      : { userId: req.userId, ingredientId: req.params.ingredientId, groupId: null }

    const count = await prisma.fridgeItem.updateMany({
      where,
      data: { quantityValue: quantityValue ?? null, quantityUnit: quantityUnit ?? null },
    })
    if (count.count === 0) return res.status(404).json({ error: 'Продукт не найден в холодильнике' })

    const updated = await prisma.fridgeItem.findFirst({ where, include: { ingredient: true } })
    res.json(formatItem(updated))
  } catch (err) { next(err) }
})

// DELETE /api/fridge/:ingredientId
router.delete('/:ingredientId', async (req, res, next) => {
  try {
    const familyGroupId = await getFamilyGroupId(req.userId)
    const where = familyGroupId
      ? { groupId: familyGroupId, ingredientId: req.params.ingredientId }
      : { userId: req.userId, ingredientId: req.params.ingredientId, groupId: null }

    await prisma.fridgeItem.deleteMany({ where })
    logger.info({ action: 'fridge_item_removed', ingredientId: req.params.ingredientId, userId: req.userId, requestId: req.requestId }, 'fridge_item_removed')
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// DELETE /api/fridge
router.delete('/', async (req, res, next) => {
  try {
    const familyGroupId = await getFamilyGroupId(req.userId)
    const where = familyGroupId
      ? { groupId: familyGroupId }
      : { userId: req.userId, groupId: null }

    await prisma.fridgeItem.deleteMany({ where })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

module.exports = router
