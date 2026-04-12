const router = require('express').Router()
const { randomBytes } = require('crypto')
const { Resend } = require('resend')
const prisma = require('../lib/prisma')
const { authMiddleware } = require('../middleware/auth')
const validate = require('../middleware/validate')
const { inviteCreate } = require('../lib/schemas')
const { logger, maskEmail } = require('../lib/logger')

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.RESEND_FROM || 'MealBot <noreply@smarussya.ru>'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'
const TTL_DAYS = 7

// ─── POST /api/groups/:id/invite ─────────────────────────────────────────────
// Только участник группы может приглашать. Возвращает { ok: true }.
router.post('/groups/:id/invite', authMiddleware, validate(inviteCreate), async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email?.trim()) return res.status(400).json({ error: 'Укажите email' })
    const normalEmail = email.trim().toLowerCase()

    // Проверяем что вызывающий — участник группы
    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: req.params.id, userId: req.userId } },
    })
    if (!membership) return res.status(403).json({ error: 'Вы не участник этой группы' })

    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, type: true, _count: { select: { members: true } } },
    })
    if (!group) return res.status(404).json({ error: 'Группа не найдена' })

    // У5: в FAMILY-группу приглашать может только владелец
    if (group.type === 'FAMILY' && membership.role !== 'OWNER') {
      return res.status(403).json({ error: 'Приглашать в семейную группу может только владелец' })
    }

    const LIMITS = { FAMILY: 10, REGULAR: 1000 }
    if (group._count.members >= LIMITS[group.type]) {
      return res.status(400).json({ error: 'Группа заполнена' })
    }

    // Rate limit: 10 инвайтов / день / userId
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const senderCount = await prisma.groupInvite.count({
      where: { invitedById: req.userId, createdAt: { gte: since } },
    })
    if (senderCount >= 10) {
      logger.warn({ action: 'invite_rate_limit_sender', userId: req.userId, groupId: req.params.id, requestId: req.requestId }, 'invite_rate_limit_sender')
      return res.status(429).json({ error: 'Вы достигли лимита приглашений на сегодня (10 в день)' })
    }

    // Rate limit: 3 инвайта / день / email (по всем группам)
    const targetCount = await prisma.groupInvite.count({
      where: { email: normalEmail, createdAt: { gte: since } },
    })
    if (targetCount >= 3) {
      logger.warn({ action: 'invite_rate_limit_target', email: maskEmail(normalEmail), groupId: req.params.id, requestId: req.requestId }, 'invite_rate_limit_target')
      return res.status(429).json({ error: 'Этот адрес уже получил максимальное количество приглашений за сегодня' })
    }

    // Уже участник? (У2: case-insensitive поиск)
    const invitedUser = await prisma.user.findFirst({ where: { email: { equals: normalEmail, mode: 'insensitive' } }, select: { id: true } })
    if (invitedUser) {
      const alreadyMember = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: req.params.id, userId: invitedUser.id } },
      })
      if (alreadyMember) return res.status(409).json({ error: 'Этот пользователь уже в группе' })
    }

    // Уже есть активное приглашение на этот email?
    const existing = await prisma.groupInvite.findFirst({
      where: { groupId: req.params.id, email: normalEmail, usedAt: null, expiresAt: { gt: new Date() } },
    })
    if (existing) return res.status(409).json({ error: 'Приглашение уже отправлено на этот email' })

    // Создаём токен
    const token = randomBytes(24).toString('hex')
    const expiresAt = new Date(Date.now() + TTL_DAYS * 24 * 60 * 60 * 1000)
    await prisma.groupInvite.create({
      data: { token, groupId: req.params.id, email: normalEmail, invitedById: req.userId, expiresAt },
    })

    // Получаем имя пригласившего
    const inviter = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { name: true, email: true },
    })
    const inviterName = inviter?.name || inviter?.email || 'Участник'

    // Отправляем письмо
    const inviteUrl = `${FRONTEND_URL}/invite/${token}`
    if (resend) {
      const result = await resend.emails.send({
        from: FROM,
        to: normalEmail,
        subject: `${inviterName} приглашает вас в группу «${group.name}» — MealBot`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
            <h2 style="color:#e85d04">🍽️ MealBot</h2>
            <p><strong>${inviterName}</strong> приглашает вас вступить в группу <strong>«${group.name}»</strong>${group.type === 'FAMILY' ? ' (семейная группа с общим холодильником)' : ''}.</p>
            <p style="margin:24px 0">
              <a href="${inviteUrl}"
                style="background:#e85d04;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
                Вступить в группу
              </a>
            </p>
            <p style="color:#888;font-size:13px">Ссылка действительна ${TTL_DAYS} дней. Если вы не ожидали этого приглашения — просто проигнорируйте письмо.</p>
          </div>
        `,
      })
      if (result?.error) {
        console.error('[Resend] invite error:', result.error)
        return res.status(500).json({ error: 'Не удалось отправить письмо' })
      }
    } else {
      logger.debug({ action: 'invite_email_stub', email: maskEmail(normalEmail), requestId: req.requestId }, 'invite_email_stub')
    }

    logger.info({ action: 'group_invite_sent', groupId: req.params.id, groupType: group.type, email: maskEmail(normalEmail), userId: req.userId, requestId: req.requestId }, 'group_invite_sent')
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ─── DELETE /api/groups/:id/invites/:token ────────────────────────────────────
// Владелец группы или пригласивший могут отозвать приглашение.
router.delete('/groups/:id/invites/:token', authMiddleware, async (req, res, next) => {
  try {
    const invite = await prisma.groupInvite.findUnique({ where: { token: req.params.token } })
    if (!invite || invite.groupId !== req.params.id) return res.status(404).json({ error: 'Приглашение не найдено' })

    const group = await prisma.group.findUnique({ where: { id: req.params.id }, select: { ownerId: true } })
    if (invite.invitedById !== req.userId && group?.ownerId !== req.userId) {
      return res.status(403).json({ error: 'Нет доступа' })
    }

    await prisma.groupInvite.delete({ where: { token: req.params.token } })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// ─── GET /api/invites/:token ──────────────────────────────────────────────────
// Публичный. Возвращает инфо о приглашении.
router.get('/invites/:token', async (req, res, next) => {
  try {
    const invite = await prisma.groupInvite.findUnique({
      where: { token: req.params.token },
      include: {
        group: { select: { id: true, name: true, type: true, _count: { select: { members: true } } } },
        invitedBy: { select: { name: true, email: true } },
      },
    })
    if (!invite) return res.status(404).json({ error: 'Приглашение не найдено или уже использовано' })
    if (invite.expiresAt < new Date()) return res.status(410).json({ error: 'Ссылка истекла. Попросите новое приглашение.' })
    if (invite.usedAt) return res.status(410).json({ error: 'Это приглашение уже было использовано' })

    res.json({
      groupName: invite.group.name,
      groupType: invite.group.type,
      membersCount: invite.group._count.members,
      invitedBy: invite.invitedBy.name || invite.invitedBy.email,
      expiresAt: invite.expiresAt,
    })
  } catch (err) { next(err) }
})

// ─── POST /api/invites/:token/accept ─────────────────────────────────────────
// Требует авторизации. Вступает в группу и помечает токен использованным.
router.post('/invites/:token/accept', authMiddleware, async (req, res, next) => {
  try {
    const invite = await prisma.groupInvite.findUnique({
      where: { token: req.params.token },
      include: { group: { select: { id: true, type: true, _count: { select: { members: true } } } } },
    })
    if (!invite) return res.status(404).json({ error: 'Приглашение не найдено' })
    if (invite.expiresAt < new Date()) return res.status(410).json({ error: 'Ссылка истекла' })
    if (invite.usedAt) return res.status(410).json({ error: 'Приглашение уже использовано' })

    const LIMITS = { FAMILY: { groups: 1, members: 10 }, REGULAR: { groups: 2, members: 1000 } }
    const type = invite.group.type

    // У1: для FAMILY проверяем, что принимает тот, кому отправлено
    if (invite.group.type === 'FAMILY') {
      const accepter = await prisma.user.findUnique({ where: { id: req.userId }, select: { email: true } })
      if (!accepter?.email || accepter.email.toLowerCase() !== invite.email.toLowerCase()) {
        return res.status(403).json({ error: 'Это приглашение предназначено другому пользователю' })
      }
    }

    // Уже в группе?
    const alreadyMember = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: invite.groupId, userId: req.userId } },
    })
    if (alreadyMember) return res.status(409).json({ error: 'Вы уже в этой группе' })

    // Лимит групп у пользователя
    const userGroupCount = await prisma.groupMember.count({
      where: { userId: req.userId, group: { type } },
    })
    if (userGroupCount >= LIMITS[type].groups) {
      const label = type === 'FAMILY' ? 'семейной' : 'обычной'
      const hint = type === 'FAMILY' ? ' Сначала выйдите из текущей семейной группы.' : ''
      return res.status(400).json({ error: `Вы уже состоите в максимальном количестве ${label} групп.${hint}` })
    }

    // Лимит участников группы
    if (invite.group._count.members >= LIMITS[type].members) {
      return res.status(400).json({ error: 'Группа заполнена' })
    }

    // Импортируем миграцию холодильника из groups.js через Prisma напрямую
    await prisma.$transaction(async (tx) => {
      await tx.groupMember.create({
        data: { groupId: invite.groupId, userId: req.userId, role: 'MEMBER' },
      })
      if (type === 'FAMILY') {
        // Миграция личного холодильника в семейный
        const personal = await tx.fridgeItem.findMany({
          where: { userId: req.userId, groupId: null },
          select: { id: true, ingredientId: true },
        })
        if (personal.length) {
          const existing = await tx.fridgeItem.findMany({
            where: { groupId: invite.groupId },
            select: { ingredientId: true },
          })
          const existingIds = new Set(existing.map(f => f.ingredientId))
          const toMove = personal.filter(i => !existingIds.has(i.ingredientId)).map(i => i.id)
          const toDel  = personal.filter(i =>  existingIds.has(i.ingredientId)).map(i => i.id)
          if (toMove.length) await tx.fridgeItem.updateMany({ where: { id: { in: toMove } }, data: { groupId: invite.groupId } })
          if (toDel.length)  await tx.fridgeItem.deleteMany({ where: { id: { in: toDel } } })
        }
      }
      await tx.groupInvite.update({ where: { token: req.params.token }, data: { usedAt: new Date() } })
    })

    logger.info({ action: 'group_invite_accepted', groupId: invite.groupId, groupType: type, userId: req.userId, requestId: req.requestId }, 'group_invite_accepted')
    res.json({ ok: true, groupId: invite.groupId })
  } catch (err) { next(err) }
})

module.exports = router
