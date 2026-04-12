const prisma = require('./prisma')

/**
 * Migrate personal (groupId=null) fridge items to a FAMILY group fridge.
 * Items already present in the group fridge are deleted to avoid duplicates.
 * Must be called inside a Prisma transaction (pass `tx`).
 */
async function migratePersonalFridgeToFamily(tx, userId, groupId) {
  const personal = await tx.fridgeItem.findMany({
    where: { userId, groupId: null },
    select: { id: true, ingredientId: true },
  })
  if (!personal.length) return

  const existing = await tx.fridgeItem.findMany({
    where: { groupId },
    select: { ingredientId: true },
  })
  const existingIds = new Set(existing.map(f => f.ingredientId))

  const toMove = personal.filter(i => !existingIds.has(i.ingredientId)).map(i => i.id)
  const toDel  = personal.filter(i =>  existingIds.has(i.ingredientId)).map(i => i.id)

  if (toMove.length) await tx.fridgeItem.updateMany({ where: { id: { in: toMove } }, data: { groupId } })
  if (toDel.length)  await tx.fridgeItem.deleteMany({ where: { id: { in: toDel } } })
}

/**
 * Move all fridge items belonging to a user in a FAMILY group back to personal (groupId=null).
 * Must be called inside a Prisma transaction (pass `tx`).
 */
async function restorePersonalFridge(tx, userId, groupId) {
  await tx.fridgeItem.updateMany({
    where: { userId, groupId },
    data: { groupId: null },
  })
}

module.exports = { migratePersonalFridgeToFamily, restorePersonalFridge }
