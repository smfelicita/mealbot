const router = require('express').Router()
const Anthropic = require('@anthropic-ai/sdk')
const prisma = require('../lib/prisma')
const { authMiddleware: auth, optionalAuth } = require('../middleware/auth')
const { checkAiLimit } = require('../lib/aiLimit')
const { checkMessageRelevance } = require('../lib/messageFilter')
const { logger } = require('../lib/logger')

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Кэш списка блюд для системного промпта — обновляется раз в 5 минут
let dishCache = null
let dishCacheAt = 0
const DISH_CACHE_TTL = 5 * 60 * 1000 // 5 мин

async function getCachedDishes() {
  if (dishCache && Date.now() - dishCacheAt < DISH_CACHE_TTL) return dishCache
  const dishes = await prisma.dish.findMany({
    where: { visibility: 'PUBLIC' },
    select: { id: true, nameRu: true, name: true, mealTime: true, tags: true, imageUrl: true, images: true },
  })
  dishCache = dishes
  dishCacheAt = Date.now()
  return dishes
}

// Счётчик сообщений для гостей: { ip -> { count, date } }
// ВНИМАНИЕ: счётчики сбрасываются при рестарте процесса — гости получают сброс лимита.
// Это ожидаемое поведение: при рестарте логируется предупреждение ниже.
const guestCounters = new Map()
const GUEST_LIMIT = 2

logger.warn({ action: 'guest_counters_reset', note: 'in-memory guest AI counters cleared on startup' }, 'guest_counters_reset')

function getGuestCount(ip) {
  const today = new Date().toDateString()
  const entry = guestCounters.get(ip)
  if (!entry || entry.date !== today) return 0
  return entry.count
}

function incrementGuestCount(ip) {
  const today = new Date().toDateString()
  const entry = guestCounters.get(ip)
  if (!entry || entry.date !== today) {
    guestCounters.set(ip, { count: 1, date: today })
  } else {
    entry.count++
  }
}

function extractMentionedDishes(text, dishMap) {
  const seen = new Set()
  return [...text.matchAll(/\[DISH:([a-z0-9]+)\]/gi)]
    .map(m => m[1])
    .filter(id => { if (seen.has(id)) return false; seen.add(id); return true })
    .map(id => dishMap.get(id))
    .filter(Boolean)
    .map(d => ({ id: d.id, nameRu: d.nameRu, name: d.name, imageUrl: d.imageUrl, images: d.images }))
}

function buildGuestPrompt(dishSummary) {
  return `Ты — дружелюбный кулинарный ассистент MealBot. Помогаешь пользователям выбирать блюда.

Доступные блюда в базе:
${dishSummary}

Правила:
1. Предлагай блюда только из базы выше
2. Когда рекомендуешь блюдо — обязательно ставь маркер [DISH:id] прямо перед названием (id берёшь из списка)
3. Спрашивай о предпочтениях (время дня, диета, настроение, сколько времени на готовку)
4. Отвечай коротко и по делу на русском языке
5. Можешь добавлять эмодзи для наглядности`
}

function buildUserPrompt(dishSummary, fridgeList, isPro) {
  const rules = isPro
    ? [
        'Когда рекомендуешь блюдо из базы — обязательно ставь маркер [DISH:id] прямо перед названием',
        'Учитывай что есть в холодильнике — предпочитай блюда из имеющихся продуктов',
        'Если среди блюд базы нет подходящего — можешь предложить новый оригинальный рецепт (без маркера [DISH:id])',
        'Спрашивай о предпочтениях (время дня, диета, настроение, сколько времени на готовку)',
        'Отвечай коротко и по делу на русском языке',
        'Можешь добавлять эмодзи для наглядности',
      ]
    : [
        'Предлагай блюда только из базы выше',
        'Когда рекомендуешь блюдо — обязательно ставь маркер [DISH:id] прямо перед названием',
        'Учитывай что есть в холодильнике — предпочитай блюда из имеющихся продуктов',
        'Спрашивай о предпочтениях (время дня, диета, настроение, сколько времени на готовку)',
        'Отвечай коротко и по делу на русском языке',
        'Можешь добавлять эмодзи для наглядности',
      ]

  return `Ты — дружелюбный кулинарный ассистент MealBot${isPro ? ' PRO' : ''}. Помогаешь пользователям выбирать блюда.

${fridgeList ? `В холодильнике пользователя сейчас: ${fridgeList}` : 'Холодильник пустой или не заполнен.'}

Доступные блюда в базе:
${dishSummary}

Правила:
${rules.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
}

// POST /api/chat — отправить сообщение ИИ-помощнику
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { message, platform = 'web' } = req.body
    if (!message?.trim()) return res.status(400).json({ error: 'Сообщение не может быть пустым' })

    // Проверка релевантности запроса — до обращения к API и списания лимита
    const relevance = checkMessageRelevance(message)
    if (!relevance.allowed) {
      logger.warn({ action: 'ai_request_blocked_by_filter', userId: req.userId || 'guest', requestId: req.requestId }, 'ai_request_blocked_by_filter')
      return res.status(400).json({ error: relevance.reason, offTopic: true })
    }

    const isGuest = !req.userId
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress

    // Проверка лимита для гостей
    if (isGuest) {
      const count = getGuestCount(ip)
      if (count >= GUEST_LIMIT) {
        logger.warn({ action: 'ai_limit_exceeded', type: 'guest', requestId: req.requestId }, 'ai_limit_exceeded')
        return res.status(429).json({ error: 'Лимит исчерпан', guestLimitReached: true, guestMessagesLeft: 0 })
      }
      incrementGuestCount(ip)
    } else {
      // Проверка лимита для авторизованных пользователей (общий с ботом, через БД)
      const { allowed } = await checkAiLimit(req.userId)
      if (!allowed) {
        logger.warn({ action: 'ai_limit_exceeded', type: 'user', userId: req.userId, requestId: req.requestId }, 'ai_limit_exceeded')
        return res.status(429).json({ error: 'Дневной лимит ИИ-сообщений исчерпан (50/день)', limitReached: true, messagesLeft: 0 })
      }
    }

    // Блюда из БД — нужны всем (кэшируются на 5 мин)
    const dishes = await getCachedDishes()
    const dishMap = new Map(dishes.map(d => [d.id, d]))
    const dishSummary = dishes.map(d =>
      `[DISH:${d.id}] ${d.nameRu} (${d.mealTime.join('/')}, теги: ${d.tags.join(', ')})`
    ).join('\n')

    let systemPrompt
    let messages

    if (isGuest) {
      systemPrompt = buildGuestPrompt(dishSummary)
      messages = [{ role: 'user', content: message }]
    } else {
      const [dbUser, fridgeItems, history] = await Promise.all([
        prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } }),
        prisma.fridgeItem.findMany({ where: { userId: req.userId }, include: { ingredient: true } }),
        prisma.chatMessage.findMany({
          where: { userId: req.userId, platform },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ])
      history.reverse()

      const isPro = dbUser?.role === 'PRO' || dbUser?.role === 'ADMIN'
      const fridgeList = fridgeItems.map(f => f.ingredient.nameRu).join(', ')
      systemPrompt = buildUserPrompt(dishSummary, fridgeList, isPro)
      messages = [
        ...history.map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
      ]
    }

    logger.info({ action: 'ai_request_sent', userId: req.userId || 'guest', platform, requestId: req.requestId }, 'ai_request_sent')
    let aiResponse
    try {
      aiResponse = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 800,
        system: systemPrompt,
        messages,
      })
    } catch (apiErr) {
      logger.error({ action: 'ai_request_failed', userId: req.userId || 'guest', error: apiErr.message, requestId: req.requestId }, 'ai_request_failed')
      throw apiErr
    }
    const assistantText = aiResponse.content[0].text
    const mentionedDishes = extractMentionedDishes(assistantText, dishMap)
    logger.info({ action: 'ai_request_completed', userId: req.userId || 'guest', dishMatches: mentionedDishes.length, requestId: req.requestId }, 'ai_request_completed')

    if (!isGuest) {
      await prisma.chatMessage.createMany({
        data: [
          { userId: req.userId, role: 'user', content: message, platform },
          { userId: req.userId, role: 'assistant', content: assistantText, platform },
        ],
      })
      return res.json({ message: assistantText, dishes: mentionedDishes })
    }

    return res.json({
      message: assistantText,
      dishes: mentionedDishes,
      guestMessagesLeft: GUEST_LIMIT - getGuestCount(ip),
    })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/chat — очистить историю чата
router.delete('/', auth, async (req, res, next) => {
  try {
    const { platform = 'web' } = req.query
    await prisma.chatMessage.deleteMany({
      where: { userId: req.userId, platform },
    })
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
})

module.exports = router
