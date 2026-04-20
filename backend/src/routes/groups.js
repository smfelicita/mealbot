const router = require('express').Router()
const { randomBytes } = require('crypto')
const rateLimit = require('express-rate-limit')
const prisma = require('../lib/prisma')
const { authMiddleware: auth } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { groupCreate, groupUpdate } = require('../lib/schemas')
const { logger } = require('../lib/logger')
const { migratePersonalFridgeToFamily, restorePersonalFridge } = require('../lib/fridgeMigration')

// Лимиты
const LIMITS = {
  FAMILY:  { groups: 1,  members: 10   },
  REGULAR: { groups: 10, members: 1000 },
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
    if (!['FAMILY', 'REGULAR'].includes(type)) return res.status(400).json({ error: 'Неверный тип группы' })

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

// POST /api/groups/join
router.post('/join', joinLimiter, async (req, res, next) => {
  try {
    const { code } = req.body
    if (!code?.trim()) return res.status(400).json({ error: 'Укажите код' })

    const group = await prisma.group.findFirst({
      where: {
        joinCode: code.trim().toUpperCase(),
        type: 'REGULAR',
        joinCodeExpiresAt: { gt: new Date() },
      },
      include: { _count: { select: { members: true } } },
    })
    if (!group) return res.status(404).json({ error: 'Неверный или устаревший код' })

    const existing = await getMembership(group.id, req.userId)
    if (existing) return res.status(400).json({ error: 'Вы уже в этой группе' })

    if (group._count.members >= LIMITS.REGULAR.members) {
      return res.status(400).json({ error: 'Группа заполнена' })
    }

    await prisma.groupMember.create({
      data: { groupId: group.id, userId: req.userId, role: 'MEMBER' },
    })

    logger.info({ action: 'group_joined', groupId: group.id, userId: req.userId }, 'group_joined')
    res.json(formatGroup(group))
  } catch (e) { next(e) }
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
      },
    })
    if (!group) return res.status(404).json({ error: 'Группа не найдена' })

    // Собираем id участников группы
    const memberIds = group.members.map(m => m.userId)

    // Блюда видны в группе если:
    // 1. Блюдо прикреплено к этой группе (groupId = group.id) и не PRIVATE (или автор — текущий пользователь)
    // 2. Блюдо ALL_GROUPS и автор — участник группы
    // 3. Для FAMILY-группы: блюдо FAMILY и автор — участник группы
    const visibilityConditions = [
      {
        groupId: group.id,
        OR: [
          { visibility: { not: 'PRIVATE' } },
          { authorId: req.userId },
        ],
      },
      {
        visibility: 'ALL_GROUPS',
        authorId: { in: memberIds },
      },
    ]

    if (group.type === 'FAMILY') {
      visibilityConditions.push({
        visibility: 'FAMILY',
        authorId: { in: memberIds },
      })
    }

    const rawDishes = await prisma.dish.findMany({
      where: { OR: visibilityConditions },
      include: { ingredients: { include: { ingredient: true } } },
      orderBy: { createdAt: 'desc' },
    })

    // Дедупликация (блюдо может попасть по нескольким условиям)
    const seen = new Set()
    const dishes = rawDishes.filter(d => {
      if (seen.has(d.id)) return false
      seen.add(d.id)
      return true
    })

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
      dishes: dishes.map(d => ({
        id: d.id,
        name: d.name,
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
        await tx.dish.updateMany({
          where: { authorId: req.userId, groupId: req.params.id, visibility: 'FAMILY' },
          data: { visibility: 'PRIVATE', groupId: null },
        })
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
        await tx.dish.updateMany({
          where: { authorId: req.params.userId, groupId: req.params.id, visibility: 'FAMILY' },
          data: { visibility: 'PRIVATE', groupId: null },
        })
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
