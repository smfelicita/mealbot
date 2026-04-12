const router = require('express').Router()
const { randomBytes } = require('crypto')
const rateLimit = require('express-rate-limit')
const prisma = require('../lib/prisma')
const { authMiddleware: auth } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { groupCreate, groupUpdate } = require('../lib/schemas')
const { logger } = require('../lib/logger')

// Лимиты
const LIMITS = {
  FAMILY: { groups: 1, members: 10 },
  REGULAR: { groups: 2, members: 1000 },
}

const JOIN_CODE_TTL_DAYS = 7

function generateJoinCode() {
  return randomBytes(4).toString('hex').toUpperCase() // 8 символов, напр. "A3F7D2E9"
}

// Rate limit на join: 10 попыток за 15 минут по IP
const joinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток вступления. Попробуйте позже.' },
})

router.use(auth)

async function getMembership(groupId, userId) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  })
}

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

  if (toMove.length) {
    await tx.fridgeItem.updateMany({ where: { id: { in: toMove } }, data: { groupId } })
  }
  if (toDel.length) {
    await tx.fridgeItem.deleteMany({ where: { id: { in: toDel } } })
  }
}

async function restorePersonalFridge(tx, userId, groupId) {
  await tx.fridgeItem.updateMany({
    where: { userId, groupId },
    data: { groupId: null },
  })
}

function formatGroup(group) {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    avatarUrl: group.avatarUrl,
    type: group.type,
    ownerId: group.ownerId,
    createdAt: group.createdAt,
    membersCount: group._count?.members ?? group.members?.length ?? 0,
    dishesCount: group._count?.dishes ?? group.dishes?.length ?? 0,
  }
}

// GET /api/groups
router.get('/', async (req, res, next) => {
  try {
    const groups = await prisma.group.findMany({
      where: { members: { some: { userId: req.userId } } },
      include: { _count: { select: { members: true, dishes: true } } },
      orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
    })
    res.json(groups.map(formatGroup))
  } catch (e) { next(e) }
})

// POST /api/groups
router.post('/', validate(groupCreate), async (req, res, next) => {
  try {
    const { name, description, avatarUrl, type = 'FAMILY' } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Укажите название группы' })
    if (type !== 'FAMILY') return res.status(400).json({ error: 'Создание обычных групп временно недоступно' })

    const existingCount = await prisma.groupMember.count({
      where: { userId: req.userId, group: { type } },
    })
    if (existingCount >= LIMITS[type].groups) {
      const label = type === 'FAMILY' ? 'семейную' : 'обычную'
      return res.status(400).json({ error: `Вы уже состоите в максимальном количестве ${label} групп (${LIMITS[type].groups})` })
    }

    const joinCode = type === 'REGULAR' ? generateJoinCode() : null
    const joinCodeExpiresAt = type === 'REGULAR'
      ? new Date(Date.now() + JOIN_CODE_TTL_DAYS * 24 * 60 * 60 * 1000)
      : null

    const group = await prisma.$transaction(async (tx) => {
      const created = await tx.group.create({
        data: {
          name: name.trim(),
          description: description?.trim() || null,
          avatarUrl: avatarUrl || null,
          type,
          ownerId: req.userId,
          joinCode,
          joinCodeExpiresAt,
          members: { create: { userId: req.userId, role: 'OWNER' } },
        },
        include: { _count: { select: { members: true, dishes: true } } },
      })
      if (type === 'FAMILY') {
        await migratePersonalFridgeToFamily(tx, req.userId, created.id)
      }
      return created
    })

    logger.info({ action: 'group_created', groupId: group.id, groupType: group.type, userId: req.userId, requestId: req.requestId }, 'group_created')
    res.status(201).json(formatGroup(group))
  } catch (e) { next(e) }
})

// POST /api/groups/join (временно отключено)
router.post('/join', (req, res) => {
  res.status(503).json({ error: 'Вступление по коду временно недоступно' })
})

// GET /api/groups/:id
router.get('/:id', async (req, res, next) => {
  try {
    const membership = await getMembership(req.params.id, req.userId)
    if (!membership) return res.status(403).json({ error: 'Вы не являетесь участником этой группы' })

    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        dishes: {
          include: { ingredients: { include: { ingredient: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!group) return res.status(404).json({ error: 'Группа не найдена' })

    res.json({
      id: group.id,
      name: group.name,
      description: group.description,
      avatarUrl: group.avatarUrl,
      type: group.type,
      ownerId: group.ownerId,
      myRole: membership.role,
      joinCode: group.type === 'REGULAR' ? group.joinCode : undefined,
      joinCodeExpiresAt: group.type === 'REGULAR' ? group.joinCodeExpiresAt : undefined,
      members: group.members.map(m => ({
        userId: m.userId,
        name: m.user.name || m.user.email || 'Пользователь',
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      dishes: group.dishes.map(d => ({
        id: d.id,
        name: d.nameRu,
        description: d.description,
        categories: d.categories,
        cuisine: d.cuisine,
        cookTime: d.cookTime,
        calories: d.calories,
        difficulty: d.difficulty,
        imageUrl: d.imageUrl,
        tags: d.tags,
        authorId: d.authorId,
        ingredients: d.ingredients.map(di => ({
          id: di.ingredient.id,
          name: di.ingredient.nameRu,
          emoji: di.ingredient.emoji,
          amount: di.amount,
          optional: di.optional,
        })),
      })),
    })
  } catch (e) { next(e) }
})

// PUT /api/groups/:id
router.put('/:id', validate(groupUpdate), async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({ where: { id: req.params.id } })
    if (!group) return res.status(404).json({ error: 'Группа не найдена' })
    if (group.ownerId !== req.userId) return res.status(403).json({ error: 'Только владелец может редактировать группу' })

    const { name, description, avatarUrl } = req.body
    const updated = await prisma.group.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(avatarUrl !== undefined && { avatarUrl: avatarUrl || null }),
      },
      include: { _count: { select: { members: true, dishes: true } } },
    })
    res.json(formatGroup(updated))
  } catch (e) { next(e) }
})

// DELETE /api/groups/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: { members: { select: { userId: true } } },
    })
    if (!group) return res.status(404).json({ error: 'Группа не найдена' })
    if (group.ownerId !== req.userId) return res.status(403).json({ error: 'Только владелец может удалить группу' })

    await prisma.$transaction(async (tx) => {
      if (group.type === 'FAMILY') {
        for (const member of group.members) {
          await restorePersonalFridge(tx, member.userId, req.params.id)
        }
        await tx.dish.updateMany({
          where: { groupId: req.params.id, visibility: 'FAMILY' },
          data: { visibility: 'PRIVATE', groupId: null },
        })
      }
      await tx.group.delete({ where: { id: req.params.id } })
    })

    logger.info({ action: 'group_deleted', groupId: req.params.id, groupType: group.type, userId: req.userId, requestId: req.requestId }, 'group_deleted')
    res.json({ message: 'Группа удалена' })
  } catch (e) { next(e) }
})

// DELETE /api/groups/:id/leave
router.delete('/:id/leave', async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({ where: { id: req.params.id } })
    if (!group) return res.status(404).json({ error: 'Группа не найдена' })
    if (group.ownerId === req.userId) return res.status(400).json({ error: 'Владелец не может покинуть группу. Удалите группу или передайте права.' })

    const membership = await getMembership(req.params.id, req.userId)
    if (!membership) return res.status(400).json({ error: 'Вы не в этой группе' })

    await prisma.$transaction(async (tx) => {
      if (group.type === 'FAMILY') {
        await restorePersonalFridge(tx, req.userId, req.params.id)
      }
      await tx.groupMember.delete({
        where: { groupId_userId: { groupId: req.params.id, userId: req.userId } },
      })
    })

    logger.info({ action: 'group_left', groupId: req.params.id, userId: req.userId, requestId: req.requestId }, 'group_left')
    res.json({ message: 'Вы вышли из группы' })
  } catch (e) { next(e) }
})

// DELETE /api/groups/:id/members/:userId
router.delete('/:id/members/:userId', async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({ where: { id: req.params.id } })
    if (!group) return res.status(404).json({ error: 'Группа не найдена' })
    if (group.ownerId !== req.userId) return res.status(403).json({ error: 'Только владелец может исключать участников' })
    if (req.params.userId === req.userId) return res.status(400).json({ error: 'Нельзя исключить себя' })

    await prisma.$transaction(async (tx) => {
      if (group.type === 'FAMILY') {
        await restorePersonalFridge(tx, req.params.userId, req.params.id)
      }
      await tx.groupMember.delete({
        where: { groupId_userId: { groupId: req.params.id, userId: req.params.userId } },
      })
    })

    logger.info({ action: 'member_kicked', groupId: req.params.id, targetUserId: req.params.userId, userId: req.userId, requestId: req.requestId }, 'member_kicked')
    res.json({ message: 'Участник исключён' })
  } catch (e) { next(e) }
})

// POST /api/groups/:id/regenerate-code — только владелец REGULAR группы
router.post('/:id/regenerate-code', async (req, res, next) => {
  try {
    const group = await prisma.group.findUnique({ where: { id: req.params.id } })
    if (!group) return res.status(404).json({ error: 'Группа не найдена' })
    if (group.ownerId !== req.userId) return res.status(403).json({ error: 'Только владелец может обновить код' })
    if (group.type === 'FAMILY') return res.status(400).json({ error: 'У семейной группы нет кода вступления' })

    const joinCode = generateJoinCode()
    const joinCodeExpiresAt = new Date(Date.now() + JOIN_CODE_TTL_DAYS * 24 * 60 * 60 * 1000)
    await prisma.group.update({
      where: { id: req.params.id },
      data: { joinCode, joinCodeExpiresAt },
    })
    res.json({ joinCode, joinCodeExpiresAt })
  } catch (e) { next(e) }
})

module.exports = router
