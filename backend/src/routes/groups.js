const router = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const { authMiddleware: auth } = require('../middleware/auth')
const prisma = new PrismaClient()

// Лимиты
const LIMITS = {
  FAMILY: { groups: 1, members: 10 },
  REGULAR: { groups: 2, members: 1000 },
}

router.use(auth)

async function getMembership(groupId, userId) {
  return prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
  })
}

async function migratePersonalFridgeToFamily(userId, groupId) {
  await prisma.fridgeItem.updateMany({
    where: { userId, groupId: null },
    data: { groupId },
  })
}

async function restorePersonalFridge(userId, groupId) {
  await prisma.fridgeItem.updateMany({
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
router.post('/', async (req, res, next) => {
  try {
    const { name, description, avatarUrl, type = 'REGULAR' } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Укажите название группы' })
    if (!['FAMILY', 'REGULAR'].includes(type)) return res.status(400).json({ error: 'Неверный тип группы' })

    const existingCount = await prisma.groupMember.count({
      where: { userId: req.userId, group: { type } },
    })
    if (existingCount >= LIMITS[type].groups) {
      const label = type === 'FAMILY' ? 'семейную' : 'обычную'
      return res.status(400).json({ error: `Вы уже состоите в максимальном количестве ${label} групп (${LIMITS[type].groups})` })
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        avatarUrl: avatarUrl || null,
        type,
        ownerId: req.userId,
        members: { create: { userId: req.userId, role: 'OWNER' } },
      },
      include: { _count: { select: { members: true, dishes: true } } },
    })

    if (type === 'FAMILY') {
      await migratePersonalFridgeToFamily(req.userId, group.id)
    }

    res.status(201).json(formatGroup(group))
  } catch (e) { next(e) }
})

// POST /api/groups/join
router.post('/join', async (req, res, next) => {
  try {
    const { code } = req.body
    if (!code) return res.status(400).json({ error: 'Укажите код группы' })

    const group = await prisma.group.findUnique({
      where: { id: code },
      include: { _count: { select: { members: true } } },
    })
    if (!group) return res.status(404).json({ error: 'Группа не найдена' })

    const existing = await getMembership(code, req.userId)
    if (existing) return res.status(400).json({ error: 'Вы уже в этой группе' })

    const userGroupCount = await prisma.groupMember.count({
      where: { userId: req.userId, group: { type: group.type } },
    })
    if (userGroupCount >= LIMITS[group.type].groups) {
      const label = group.type === 'FAMILY' ? 'семейной' : 'обычной'
      return res.status(400).json({ error: `Вы уже состоите в максимальном количестве ${label} групп (${LIMITS[group.type].groups})` })
    }

    if (group._count.members >= LIMITS[group.type].members) {
      return res.status(400).json({ error: `Группа заполнена (максимум ${LIMITS[group.type].members} участников)` })
    }

    await prisma.groupMember.create({
      data: { groupId: code, userId: req.userId, role: 'MEMBER' },
    })

    if (group.type === 'FAMILY') {
      await migratePersonalFridgeToFamily(req.userId, code)
    }

    res.json({ groupId: code, message: 'Вы вступили в группу' })
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
router.put('/:id', async (req, res, next) => {
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

    if (group.type === 'FAMILY') {
      for (const member of group.members) {
        await restorePersonalFridge(member.userId, req.params.id)
      }
    }

    await prisma.group.delete({ where: { id: req.params.id } })
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

    if (group.type === 'FAMILY') {
      await restorePersonalFridge(req.userId, req.params.id)
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: req.params.id, userId: req.userId } },
    })
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

    if (group.type === 'FAMILY') {
      await restorePersonalFridge(req.params.userId, req.params.id)
    }

    await prisma.groupMember.delete({
      where: { groupId_userId: { groupId: req.params.id, userId: req.params.userId } },
    })
    res.json({ message: 'Участник исключён' })
  } catch (e) { next(e) }
})

module.exports = router
