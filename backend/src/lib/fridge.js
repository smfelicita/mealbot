const prisma = require('./prisma')

// Добавляет базовые продукты в холодильник нового пользователя (только те, которых ещё нет)
async function addDefaultFridgeItems(userId) {
  const basics = await prisma.ingredient.findMany({
    where: { isBasic: true },
    select: { id: true, defaultQuantity: true, defaultUnit: true },
  })
  if (!basics.length) return
  const basicIds = basics.map(b => b.id)
  const existing = await prisma.fridgeItem.findMany({
    where: { userId, groupId: null, ingredientId: { in: basicIds } },
    select: { ingredientId: true },
  })
  const existingIds = new Set(existing.map(e => e.ingredientId))
  const missing = basics.filter(b => !existingIds.has(b.id))
  if (!missing.length) return
  await prisma.fridgeItem.createMany({
    data: missing.map(ing => ({
      userId,
      ingredientId: ing.id,
      groupId: null,
      quantityValue: ing.defaultQuantity ?? null,
      quantityUnit: ing.defaultUnit ?? null,
    })),
    skipDuplicates: true,
  })
}

module.exports = { addDefaultFridgeItems }
