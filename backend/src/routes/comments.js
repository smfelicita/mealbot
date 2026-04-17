const express = require('express')
const router = express.Router()
const prisma = require('../lib/prisma')
const { authMiddleware } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { commentCreate } = require('../lib/schemas')
const { logger } = require('../lib/logger')

// Пользователь может комментировать если видит блюдо в контексте группы:
// - автор блюда (всегда)
// - участник группы, к которой прикреплено блюдо (groupId + visibility != PRIVATE)
// - ALL_GROUPS: состоит в любой общей группе с автором
// - FAMILY: состоит в семейной группе вместе с автором
// PUBLIC — комментарии только автору (публичные без группового обсуждения)
async function canComment(userId, dish) {
  if (dish.authorId === userId) return true
  if (dish.visibility === 'PRIVATE' || dish.visibility === 'PUBLIC') return false

  // Блюдо прикреплено к конкретной группе — проверяем членство
  if (dish.groupId) {
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: dish.groupId, userId } },
    })
    if (member) return true
  }

  // ALL_GROUPS — есть хотя бы одна общая группа с автором
  if (dish.visibility === 'ALL_GROUPS' && dish.authorId) {
    const shared = await prisma.groupMember.findFirst({
      where: {
        userId,
        group: { members: { some: { userId: dish.authorId } } },
      },
    })
    if (shared) return true
  }

  // FAMILY — состоит в семейной группе вместе с автором
  if (dish.visibility === 'FAMILY' && dish.authorId) {
    const shared = await prisma.groupMember.findFirst({
      where: {
        userId,
        group: { type: 'FAMILY', members: { some: { userId: dish.authorId } } },
      },
    })
    if (shared) return true
  }

  return false
}

// GET /api/comments?dishId=xxx — список комментариев
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { dishId } = req.query
    if (!dishId) return res.status(400).json({ error: 'dishId обязателен' })

    const dish = await prisma.dish.findUnique({ where: { id: dishId } })
    if (!dish) return res.status(404).json({ error: 'Блюдо не найдено' })
    if (!await canComment(req.userId, dish)) return res.status(403).json({ error: 'Нет доступа' })

    const comments = await prisma.comment.findMany({
      where: { dishId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
    })
    res.json(comments)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/comments — добавить комментарий
router.post('/', authMiddleware, validate(commentCreate), async (req, res) => {
  try {
    const { dishId, content } = req.body
    if (!dishId || !content?.trim()) return res.status(400).json({ error: 'dishId и content обязательны' })

    // Rate limit: 30 комментариев в час на пользователя
    const since = new Date(Date.now() - 60 * 60 * 1000)
    const recentCount = await prisma.comment.count({
      where: { userId: req.userId, createdAt: { gte: since } },
    })
    if (recentCount >= 30) return res.status(429).json({ error: 'Слишком много комментариев. Подождите немного.' })

    const dish = await prisma.dish.findUnique({ where: { id: dishId } })
    if (!dish) return res.status(404).json({ error: 'Блюдо не найдено' })
    if (!await canComment(req.userId, dish)) return res.status(403).json({ error: 'Нет доступа' })

    const comment = await prisma.comment.create({
      data: { dishId, userId: req.userId, content: content.trim() },
      include: { user: { select: { id: true, name: true } } },
    })
    logger.info({ action: 'comment_created', commentId: comment.id, dishId, userId: req.userId, requestId: req.requestId }, 'comment_created')
    res.status(201).json(comment)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// DELETE /api/comments/:id — удалить свой комментарий
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({ where: { id: req.params.id } })
    if (!comment) return res.status(404).json({ error: 'Не найдено' })
    if (comment.userId !== req.userId) return res.status(403).json({ error: 'Нет доступа' })

    await prisma.comment.delete({ where: { id: req.params.id } })
    logger.info({ action: 'comment_deleted', commentId: req.params.id, userId: req.userId, requestId: req.requestId }, 'comment_deleted')
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PATCH /api/comments/:id/pin — toggle isPinned (только автор блюда)
router.patch('/:id/pin', authMiddleware, async (req, res) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.id },
      include: { dish: { select: { authorId: true } } },
    })
    if (!comment) return res.status(404).json({ error: 'Не найдено' })
    if (comment.dish.authorId !== req.userId) return res.status(403).json({ error: 'Только автор блюда может закреплять комментарии' })

    const updated = await prisma.comment.update({
      where: { id: req.params.id },
      data: { isPinned: !comment.isPinned },
      include: { user: { select: { id: true, name: true } } },
    })
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
