const router = require('express').Router()
const Anthropic = require('@anthropic-ai/sdk')
const prisma = require('../lib/prisma')
const { authMiddleware: auth, optionalAuth } = require('../middleware/auth')

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Счётчик сообщений для гостей: { ip -> { count, date } }
const guestCounters = new Map()
const GUEST_LIMIT = 5

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

// POST /api/chat — отправить сообщение ИИ-помощнику
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const { message, platform = 'web' } = req.body
    if (!message?.trim()) return res.status(400).json({ error: 'Сообщение не может быть пустым' })

    const isGuest = !req.userId

    // Проверка лимита для гостей
    if (isGuest) {
      const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress
      const count = getGuestCount(ip)
      if (count >= GUEST_LIMIT) {
        return res.status(429).json({
          error: 'Лимит исчерпан',
          guestLimitReached: true,
          guestMessagesLeft: 0,
        })
      }
      incrementGuestCount(ip)
      const newCount = getGuestCount(ip)

      // Для гостя: нет истории, нет холодильника
      const dishes = await prisma.dish.findMany({
        include: { ingredients: { include: { ingredient: true } } },
      })
      const dishSummary = dishes.map(d =>
        `- ${d.nameRu} (${d.mealTime.join('/')}, теги: ${d.tags.join(', ')})`
      ).join('\n')

      const systemPrompt = `Ты — дружелюбный кулинарный ассистент MealBot. Помогаешь пользователям выбирать блюда на завтрак, обед и ужин.

Доступные блюда в базе:
${dishSummary}

Правила:
1. Предлагай блюда только из базы выше
2. Спрашивай о предпочтениях (время дня, диета, настроение, сколько времени на готовку)
3. Отвечай коротко и по делу на русском языке
4. Если пользователь спрашивает про конкретное блюдо — дай краткий рецепт
5. Можешь добавлять эмодзи для наглядности
6. Когда рекомендуешь блюдо — укажи его точное название из базы`

      const aiResponse = await anthropic.messages.create({
        model: 'claude-opus-4-5',
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      })

      const assistantText = aiResponse.content[0].text

      return res.json({
        message: assistantText,
        guestMessagesLeft: GUEST_LIMIT - newCount,
      })
    }

    // Авторизованный пользователь — полный функционал
    const history = await prisma.chatMessage.findMany({
      where: { userId: req.userId, platform },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    history.reverse()

    const fridgeItems = await prisma.fridgeItem.findMany({
      where: { userId: req.userId },
      include: { ingredient: true },
    })
    const fridgeList = fridgeItems.map(f => f.ingredient.nameRu).join(', ')

    const dishes = await prisma.dish.findMany({
      include: { ingredients: { include: { ingredient: true } } },
    })
    const dishSummary = dishes.map(d =>
      `- ${d.nameRu} (${d.mealTime.join('/')}, теги: ${d.tags.join(', ')})`
    ).join('\n')

    const systemPrompt = `Ты — дружелюбный кулинарный ассистент MealBot. Помогаешь пользователям выбирать блюда на завтрак, обед и ужин.

${fridgeList ? `В холодильнике пользователя сейчас: ${fridgeList}` : 'Холодильник пустой или не заполнен.'}

Доступные блюда в базе:
${dishSummary}

Правила:
1. Предлагай блюда только из базы выше
2. Учитывай что есть в холодильнике — предпочитай блюда из имеющихся продуктов
3. Спрашивай о предпочтениях (время дня, диета, настроение, сколько времени на готовку)
4. Отвечай коротко и по делу на русском языке
5. Если пользователь спрашивает про конкретное блюдо — дай краткий рецепт
6. Можешь добавлять эмодзи для наглядности
7. Когда рекомендуешь блюдо — укажи его точное название из базы`

    const messages = [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ]

    const aiResponse = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 800,
      system: systemPrompt,
      messages,
    })

    const assistantText = aiResponse.content[0].text

    await prisma.chatMessage.createMany({
      data: [
        { userId: req.userId, role: 'user', content: message, platform },
        { userId: req.userId, role: 'assistant', content: assistantText, platform },
      ],
    })

    res.json({ message: assistantText })
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
