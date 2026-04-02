require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api')
const { PrismaClient } = require('@prisma/client')
const Anthropic = require('@anthropic-ai/sdk')
const { distance } = require('fastest-levenshtein')

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })
const prisma = new PrismaClient()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const USER_AI_LIMIT = 50

async function checkAiLimit(userId) {
  const today = new Date().toDateString()
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiMessagesDay: true, aiMessagesDate: true, role: true },
  })
  if (!user) return { allowed: false, left: 0 }
  if (user.role === 'ADMIN') return { allowed: true, left: 999 }

  const isToday = user.aiMessagesDate &&
    new Date(user.aiMessagesDate).toDateString() === today
  const count = isToday ? user.aiMessagesDay : 0
  if (count >= USER_AI_LIMIT) return { allowed: false, left: 0 }

  await prisma.user.update({
    where: { id: userId },
    data: {
      aiMessagesDay: isToday ? { increment: 1 } : 1,
      aiMessagesDate: new Date(),
    },
  })
  return { allowed: true, left: USER_AI_LIMIT - count - 1 }
}

// User session state
const sessions = {}

function getSession(chatId) {
  if (!sessions[chatId]) sessions[chatId] = { state: 'idle', data: {} }
  return sessions[chatId]
}

// ─── Helper: get or create user by Telegram ID ─────────────────────────────
async function getUser(tgUser) {
  let user = await prisma.user.findUnique({ where: { telegramId: String(tgUser.id) } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        telegramId: String(tgUser.id),
        telegramUsername: tgUser.username,
        name: tgUser.first_name,
      },
    })
  }
  return user
}

// ─── Helper: format dish for message ─────────────────────────────────────
function formatDish(dish) {
  const diff = { easy: 'Просто', medium: 'Средне', hard: 'Сложно' }
  let text = `🍽 *${dish.nameRu}*\n`
  if (dish.description) text += `_${dish.description}_\n`
  text += '\n'
  if (dish.cookTime) text += `⏱ ${dish.cookTime} мин  `
  if (dish.calories) text += `🔥 ${dish.calories} ккал  `
  if (dish.difficulty) text += `👨‍🍳 ${diff[dish.difficulty]}\n`
  if (dish.tags?.length) text += `\n🏷 ${dish.tags.slice(0,4).join(' • ')}\n`
  return text
}

// ─── Inline кнопка "Режим ИИ" ──────────────────────────────────────────────
const AI_MODE_BUTTON = {
  inline_keyboard: [[{ text: '🤖 Режим ИИ', callback_data: 'ai_mode' }]],
}

const MAIN_MENU = {
  reply_markup: {
    keyboard: [
      [{ text: '🧊 Мой холодильник' }, { text: '➕ Добавить продукты' }],
      [{ text: '📅 Буду готовить' },   { text: '🤖 Спросить ИИ' }],
      [{ text: '🌅 Завтрак' }, { text: '☀️ Обед' }],
      [{ text: '🌙 Ужин' },    { text: '🍎 Перекус' }],
      [{ text: '🎲 Случайное блюдо' }, { text: '🌐 Открыть приложение' }],
    ],
    resize_keyboard: true,
  },
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Генерирует одноразовый токен для входа в веб-приложение через Telegram
async function generateWebLoginToken(userId) {
  const { randomBytes } = require('crypto')
  const token = randomBytes(32).toString('hex')
  await prisma.user.update({
    where: { id: userId },
    data: { webLoginToken: token, webLoginTokenAt: new Date() },
  })
  return token
}

const MEAL_RU = {
  BREAKFAST: '🌅 Завтрак',
  LUNCH:     '☀️ Обед',
  DINNER:    '🌙 Ужин',
  SNACK:     '🍎 Перекус',
  ANYTIME:   '🍽 Без привязки',
}
const MEAL_ORDER = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'ANYTIME']

// ─── Fuzzy search helpers ─────────────────────────────────────────────────

// Ищет ингредиент по имени с fuzzy. Возвращает лучшее совпадение или null.
function fuzzyFindIngredient(query, ingredients) {
  const q = query.toLowerCase().trim()
  if (!q) return null

  let best = null
  let bestScore = Infinity

  for (const ing of ingredients) {
    const n = ing.nameRu.toLowerCase()
    if (n === q) return ing // точное совпадение
    const score = n.includes(q) ? 0 : distance(q, n)
    if (score < bestScore) {
      bestScore = score
      best = ing
    }
  }

  const threshold = Math.max(2, Math.floor(q.length / 3))
  return bestScore <= threshold ? best : null
}

// ─── /start ───────────────────────────────────────────────────────────────
bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id
  const payload = match?.[1]?.trim()

  // Связка аккаунта: /start link_TOKEN
  if (payload?.startsWith('link_')) {
    const token = payload.slice(5)
    const webUser = await prisma.user.findUnique({ where: { pendingTelegramLink: token } })
    if (!webUser) {
      await bot.sendMessage(chatId, '❌ Ссылка недействительна или уже использована\\. Получите новую в приложении\\.', { parse_mode: 'MarkdownV2' })
      return
    }
    // Привязать telegramId к существующему аккаунту
    await prisma.user.update({
      where: { id: webUser.id },
      data: {
        telegramId: String(msg.from.id),
        telegramUsername: msg.from.username,
        pendingTelegramLink: null,
      },
    })
    const name = webUser.name || msg.from.first_name || 'друг'
    await bot.sendMessage(chatId,
      `✅ Telegram успешно подключён к аккаунту *${name}*\\!\n\nТеперь вы можете управлять холодильником и получать рецепты прямо здесь:`,
      { parse_mode: 'MarkdownV2', ...MAIN_MENU }
    )
    return
  }

  // Запрос ссылки для входа в веб-приложение (/start getlink)
  if (payload === 'getlink') {
    const user = await getUser(msg.from)
    const token = await generateWebLoginToken(user.id)
    const url = `${FRONTEND_URL}/auth/tg?token=${token}`
    await bot.sendMessage(chatId,
      '🌐 Нажми кнопку ниже чтобы войти в веб-приложение MealBot.\n\n_Ссылка действует 10 минут._',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '🌐 Открыть MealBot', url }]],
        },
      }
    )
    return
  }

  const session = getSession(chatId)
  session.state = 'idle'
  session.data = {}

  const user = await getUser(msg.from)
  const name = user.name || 'друг'

  await bot.sendMessage(chatId,
    `👋 Привет, *${name}*\\! Я MealBot — помогу выбрать что приготовить\\.\n\n` +
    `🔐 Твой аккаунт уже создан через Telegram — холодильник и список блюд сохраняются автоматически\\.\n\n` +
    `Что умею:\n` +
    `🧊 Вести твой холодильник \\(\\+ молоко, \\- яйца\\)\n` +
    `📅 Хранить список «Буду готовить»\n` +
    `🍳 Предлагать блюда на завтрак, обед, ужин\n` +
    `🤖 Отвечать на вопросы про еду через ИИ\n\n` +
    `Выбери из меню или напиши *\\+ продукт* чтобы добавить в холодильник:`,
    { parse_mode: 'MarkdownV2', ...MAIN_MENU }
  )
})

// ─── Meal time buttons ────────────────────────────────────────────────────
const MEAL_MAP = {
  '🌅 Завтрак': 'breakfast',
  '☀️ Обед':   'lunch',
  '🌙 Ужин':   'dinner',
  '🍎 Перекус': 'snack',
}

async function sendDishSuggestions(chatId, userId, mealTime, fridgeMode = false) {
  await bot.sendMessage(chatId, '🔍 Ищу...')

  let dishes
  if (fridgeMode) {
    const fridgeItems = await prisma.fridgeItem.findMany({
      where: { userId },
      include: { ingredient: true },
    })
    const fridgeIds = fridgeItems.map(f => f.ingredientId)

    const all = await prisma.dish.findMany({
      where: { mealTime: { has: mealTime } },
      include: { ingredients: { include: { ingredient: true } } },
    })
    dishes = all.filter(d => {
      const required = d.ingredients.filter(di => !di.optional).map(di => di.ingredientId)
      return required.every(id => fridgeIds.includes(id))
    }).slice(0, 5)
  } else {
    dishes = await prisma.dish.findMany({
      where: { mealTime: { has: mealTime } },
      include: { ingredients: { include: { ingredient: true } } },
      take: 5,
    })
  }

  if (!dishes.length) {
    return bot.sendMessage(chatId,
      fridgeMode
        ? '😔 Не нашёл блюд из продуктов в холодильнике. Пополните холодильник!'
        : '😔 Блюда не найдены.',
      { parse_mode: 'Markdown' }
    )
  }

  for (const dish of dishes) {
    await bot.sendMessage(chatId, formatDish(dish), {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '📋 Рецепт', callback_data: `recipe_${dish.id}` },
        ]],
      },
    })
  }
}

// ─── Fridge: show ─────────────────────────────────────────────────────────
async function showFridge(chatId, userId) {
  const items = await prisma.fridgeItem.findMany({
    where: { userId },
    include: { ingredient: true },
    orderBy: { ingredient: { nameRu: 'asc' } },
  })

  if (!items.length) {
    return bot.sendMessage(chatId,
      '🧊 Холодильник пустой\\.\n\nНапиши *\\+ продукт* чтобы добавить, или нажми кнопку:',
      {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [[{ text: '➕ Добавить продукты', callback_data: 'add_products' }]],
        },
      }
    )
  }

  const list = items.map(i => `${i.ingredient.emoji || '•'} ${i.ingredient.nameRu}`).join('\n')
  await bot.sendMessage(chatId,
    `🧊 *Твой холодильник* (${items.length} поз.):\n\n${list}`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🌅 Завтрак', callback_data: 'fridge_breakfast' },
            { text: '☀️ Обед', callback_data: 'fridge_lunch' },
            { text: '🌙 Ужин', callback_data: 'fridge_dinner' },
          ],
          [
            { text: '➕ Добавить продукты', callback_data: 'add_products' },
            { text: '✏️ Управлять', callback_data: 'manage_fridge' },
          ],
          [
            { text: '🗑 Очистить всё', callback_data: 'fridge_clear' },
          ],
        ],
      },
    }
  )
}

// ─── Fridge: manage (delete items) ─────────────────────────────────────────
async function showFridgeManage(chatId, userId) {
  const items = await prisma.fridgeItem.findMany({
    where: { userId },
    include: { ingredient: true },
    orderBy: { ingredient: { nameRu: 'asc' } },
  })

  if (!items.length) {
    return bot.sendMessage(chatId, '🧊 Холодильник уже пустой!')
  }

  // Каждый продукт — отдельная строка с кнопкой удаления
  const keyboard = items.map(i => [{
    text: `❌ ${i.ingredient.emoji || ''} ${i.ingredient.nameRu}`.trim(),
    callback_data: `remove_${i.ingredientId}`,
  }])
  keyboard.push([{ text: '← Назад', callback_data: 'show_fridge' }])

  await bot.sendMessage(chatId,
    `✏️ *Управление холодильником*\n\nНажми на продукт чтобы убрать его:`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard },
    }
  )
}

// ─── Meal plan: show ──────────────────────────────────────────────────────
async function showMealPlan(chatId, userId) {
  const plans = await prisma.mealPlan.findMany({
    where: { userId },
    include: { dish: true },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  })

  if (!plans.length) {
    return bot.sendMessage(chatId,
      '📅 *Буду готовить*\n\nСписок пуст\\. Добавляйте блюда в приложении или через кнопку 📋 Рецепт\\.',
      { parse_mode: 'MarkdownV2' }
    )
  }

  // Группировка по дате
  const grouped = new Map()
  for (const p of plans) {
    const key = p.date ? p.date.toISOString().slice(0, 10) : 'no-date'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key).push(p)
  }

  const sortedKeys = [...grouped.keys()].sort((a, b) => {
    if (a === 'no-date') return 1
    if (b === 'no-date') return -1
    return a.localeCompare(b)
  })

  let text = `📅 *Буду готовить* (${plans.length}):\n`

  for (const key of sortedKeys) {
    const dayPlans = grouped.get(key)
    const dateLabel = key === 'no-date'
      ? '\n📋 *Без даты*'
      : `\n📆 *${new Date(key).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}*`

    text += `\n${dateLabel}`

    const byMeal = {}
    for (const p of dayPlans) {
      if (!byMeal[p.mealType]) byMeal[p.mealType] = []
      byMeal[p.mealType].push(p)
    }

    for (const mt of MEAL_ORDER) {
      if (!byMeal[mt]) continue
      text += `\n  ${MEAL_RU[mt]}`
      for (const p of byMeal[mt]) {
        text += `\n   • ${p.dish.nameRu}`
        if (p.note) text += ` _(${p.note})_`
      }
    }
  }

  await bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [[
        { text: '🗑 Управлять списком', callback_data: 'manage_plan' },
      ]],
    },
  })
}

// ─── Meal plan: manage (delete items) ────────────────────────────────────
async function showMealPlanManage(chatId, userId) {
  const plans = await prisma.mealPlan.findMany({
    where: { userId },
    include: { dish: true },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
  })

  if (!plans.length) {
    return bot.sendMessage(chatId, '📅 Список уже пуст!')
  }

  const keyboard = plans.map(p => {
    const dateStr = p.date
      ? new Date(p.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ' · '
      : ''
    return [{
      text: `❌ ${dateStr}${MEAL_RU[p.mealType] || ''} · ${p.dish.nameRu}`,
      callback_data: `remove_plan_${p.id}`,
    }]
  })
  keyboard.push([{ text: '← Назад', callback_data: 'show_plan' }])

  await bot.sendMessage(chatId,
    '🗑 *Управление списком*\n\nНажми на блюдо чтобы убрать его:',
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard },
    }
  )
}

// ─── Add products flow ────────────────────────────────────────────────────
async function startAddProducts(chatId, session) {
  session.state = 'adding_products'
  const ingredients = await prisma.ingredient.findMany({ orderBy: { nameRu: 'asc' } })
  session.data.ingredients = ingredients
  session.data.page = 0
  session.data.selected = []

  await sendIngredientPage(chatId, session)
}

async function sendIngredientPage(chatId, session) {
  const { ingredients, page, selected } = session.data
  const ITEMS_PER_PAGE = 8
  const start = page * ITEMS_PER_PAGE
  const chunk = ingredients.slice(start, start + ITEMS_PER_PAGE)
  const total = ingredients.length

  const keyboard = chunk.map(ing => [{
    text: `${selected.includes(ing.id) ? '✅' : (ing.emoji || '•')} ${ing.nameRu}`,
    callback_data: `toggle_${ing.id}`,
  }])

  keyboard.push([
    page > 0 ? { text: '← Назад', callback_data: 'page_prev' } : { text: ' ', callback_data: 'noop' },
    { text: `${page+1}/${Math.ceil(total/ITEMS_PER_PAGE)}`, callback_data: 'noop' },
    start + ITEMS_PER_PAGE < total ? { text: 'Вперёд →', callback_data: 'page_next' } : { text: ' ', callback_data: 'noop' },
  ])

  if (selected.length > 0) {
    keyboard.push([{ text: `✅ Добавить выбранные (${selected.length})`, callback_data: 'confirm_products' }])
  }
  keyboard.push([{ text: '❌ Отмена', callback_data: 'cancel_add' }])

  await bot.sendMessage(chatId,
    `📋 Выбери продукты для холодильника\n\n_Выбрано: ${selected.length}_\n\nНажимай на продукты или напиши название:`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: keyboard },
    }
  )
}

// ─── AI chat ───────────────────────────────────────────────────────────────
async function handleAiChat(chatId, userId, userMessage) {
  const history = await prisma.chatMessage.findMany({
    where: { userId, platform: 'telegram' },
    orderBy: { createdAt: 'desc' },
    take: 8,
  })
  history.reverse()

  const fridge = await prisma.fridgeItem.findMany({
    where: { userId },
    include: { ingredient: true },
  })
  const fridgeList = fridge.map(f => f.ingredient.nameRu).join(', ')

  const dishes = await prisma.dish.findMany({ take: 100 })
  const dishSummary = dishes.map(d => `- ${d.nameRu} (${d.mealTime.join('/')})`).join('\n')

  const systemPrompt = `Ты дружелюбный кулинарный помощник MealBot в Telegram. Отвечай кратко (до 200 слов), используй эмодзи.
${fridgeList ? `В холодильнике: ${fridgeList}` : 'Холодильник не заполнен.'}
Доступные блюда:\n${dishSummary}`

  const aiRes = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 500,
    system: systemPrompt,
    messages: [
      ...history.map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ],
  })

  const reply = aiRes.content[0].text
  await prisma.chatMessage.createMany({
    data: [
      { userId, role: 'user', content: userMessage, platform: 'telegram' },
      { userId, role: 'assistant', content: reply, platform: 'telegram' },
    ],
  })
  return reply
}

// ─── Fridge text commands: + добавить / - убрать ──────────────────────────
async function handleFridgeCommand(chatId, userId, text) {
  const addMatch = text.match(/^\+\s*(.+)/)
  const removeMatch = text.match(/^-\s*(.+)/)

  if (addMatch) {
    const query = addMatch[1].trim()
    const allIngredients = await prisma.ingredient.findMany({ where: { isPublic: true } })
    const found = fuzzyFindIngredient(query, allIngredients)

    if (!found) {
      return bot.sendMessage(chatId,
        `🔍 Не нашёл продукт *«${query}»*\\. Проверь написание или добавь через список:`,
        {
          parse_mode: 'MarkdownV2',
          reply_markup: {
            inline_keyboard: [
              [{ text: '📋 Выбрать из списка', callback_data: 'add_products' }],
              [{ text: '🤖 Режим ИИ', callback_data: 'ai_mode' }],
            ],
          },
        }
      )
    }

    const existing = await prisma.fridgeItem.findFirst({
      where: { userId, ingredientId: found.id, groupId: null },
    })
    if (existing) {
      return bot.sendMessage(chatId,
        `${found.emoji || '•'} *${found.nameRu}* уже есть в холодильнике!`,
        { parse_mode: 'Markdown' }
      )
    }

    await prisma.fridgeItem.create({
      data: {
        userId,
        ingredientId: found.id,
        quantityValue: found.defaultQuantity ?? null,
        quantityUnit: found.defaultUnit ?? null,
      },
    })
    return bot.sendMessage(chatId,
      `✅ *${found.nameRu}* добавлен в холодильник!`,
      { parse_mode: 'Markdown' }
    )
  }

  if (removeMatch) {
    const query = removeMatch[1].trim()
    const fridgeItems = await prisma.fridgeItem.findMany({
      where: { userId, groupId: null },
      include: { ingredient: true },
    })

    if (!fridgeItems.length) {
      return bot.sendMessage(chatId, '🧊 Холодильник пустой!')
    }

    const found = fuzzyFindIngredient(query, fridgeItems.map(f => f.ingredient))
    if (!found) {
      return bot.sendMessage(chatId,
        `🔍 Нет *«${query}»* в холодильнике. Проверь написание.`,
        { parse_mode: 'Markdown' }
      )
    }

    await prisma.fridgeItem.deleteMany({ where: { userId, ingredientId: found.id } })
    return bot.sendMessage(chatId,
      `🗑 *${found.nameRu}* убран из холодильника.`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '↩️ Отменить', callback_data: `undo_remove_${found.id}` }]],
        },
      }
    )
  }

  return false // не команда холодильника
}

// ─── Message handler ───────────────────────────────────────────────────────
bot.on('message', async (msg) => {
  if (!msg.text) return
  const chatId = msg.chat.id
  const text = msg.text

  // Slash-команды обрабатываются отдельно (onText), здесь их игнорируем
  if (text.startsWith('/')) return

  const user = await getUser(msg.from)
  const session = getSession(chatId)

  // Meal time buttons
  if (MEAL_MAP[text]) {
    return sendDishSuggestions(chatId, user.id, MEAL_MAP[text])
  }

  // Menu commands
  if (text === '🧊 Мой холодильник') return showFridge(chatId, user.id)
  if (text === '➕ Добавить продукты') return startAddProducts(chatId, session)
  if (text === '📅 Буду готовить') return showMealPlan(chatId, user.id)

  if (text === '🎲 Случайное блюдо') {
    const dishes = await prisma.dish.findMany({ include: { ingredients: { include: { ingredient: true } } } })
    const dish = dishes[Math.floor(Math.random() * dishes.length)]
    return bot.sendMessage(chatId, formatDish(dish), {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '📋 Рецепт', callback_data: `recipe_${dish.id}` }]] },
    })
  }

  if (text === '🤖 Спросить ИИ') {
    session.state = 'ai_chat'
    return bot.sendMessage(chatId,
      '✨ Режим ИИ включён! Задавай вопросы про еду и рецепты.\n\n_Для выхода — /start_',
      { parse_mode: 'Markdown' }
    )
  }

  if (text === '🌐 Открыть приложение') {
    const token = await generateWebLoginToken(user.id)
    const url = `${FRONTEND_URL}/auth/tg?token=${token}`
    return bot.sendMessage(chatId,
      '🌐 Нажми кнопку ниже чтобы войти в веб-приложение MealBot.\n\n_Ссылка действует 10 минут._',
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '🌐 Открыть MealBot', url }]],
        },
      }
    )
  }

  // Adding products flow — fuzzy поиск по тексту
  if (session.state === 'adding_products') {
    const found = fuzzyFindIngredient(text, session.data.ingredients || [])
    if (found) {
      if (!session.data.selected) session.data.selected = []
      if (!session.data.selected.includes(found.id)) {
        session.data.selected.push(found.id)
        return bot.sendMessage(chatId, `✅ *${found.nameRu}* отмечен! Можешь выбрать ещё или нажми "Добавить".`, { parse_mode: 'Markdown' })
      } else {
        return bot.sendMessage(chatId, `${found.emoji || '•'} *${found.nameRu}* уже отмечен.`, { parse_mode: 'Markdown' })
      }
    }
    return bot.sendMessage(chatId, `🔍 Не нашёл *«${text}»*. Попробуй другое написание.`, { parse_mode: 'Markdown' })
  }

  // AI chat
  if (session.state === 'ai_chat') {
    const { allowed, left } = await checkAiLimit(user.id)
    if (!allowed) {
      session.state = 'idle'
      return bot.sendMessage(chatId, `⚠️ Дневной лимит ИИ-сообщений исчерпан (${USER_AI_LIMIT}/день). Возвращайся завтра!`)
    }
    await bot.sendChatAction(chatId, 'typing')
    try {
      const reply = await handleAiChat(chatId, user.id, text)
      const footer = left <= 5 ? `\n\n_Осталось запросов сегодня: ${left}_` : ''
      return bot.sendMessage(chatId, reply + footer, { parse_mode: 'Markdown' })
    } catch (e) {
      return bot.sendMessage(chatId, '⚠️ Ошибка ИИ, попробуй позже')
    }
  }

  // Команды холодильника: + продукт / - продукт
  if (text.startsWith('+') || text.startsWith('-')) {
    const handled = await handleFridgeCommand(chatId, user.id, text)
    if (handled !== false) return
  }

  // Неизвестная команда — подсказка
  return bot.sendMessage(chatId,
    `Не понял 🤔\n\n*Команды холодильника:*\n+ молоко — добавить\n- яйца — убрать\n\nИли выбери из меню ниже, либо включи режим ИИ:`,
    {
      parse_mode: 'Markdown',
      reply_markup: AI_MODE_BUTTON,
    }
  )
})

// ─── Callback query handler ────────────────────────────────────────────────
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id
  const data = query.data
  const user = await getUser(query.from)
  const session = getSession(chatId)

  await bot.answerCallbackQuery(query.id)

  // Включить режим ИИ
  if (data === 'ai_mode') {
    session.state = 'ai_chat'
    return bot.sendMessage(chatId,
      '✨ Режим ИИ включён! Задавай вопросы про еду и рецепты.\n\n_Для выхода — /start_',
      { parse_mode: 'Markdown' }
    )
  }

  // Отмена удаления продукта из холодильника
  if (data.startsWith('undo_remove_')) {
    const ingredientId = data.slice(12)
    const existing = await prisma.fridgeItem.findFirst({ where: { userId: user.id, ingredientId, groupId: null } })
    if (!existing) {
      await prisma.fridgeItem.create({ data: { userId: user.id, ingredientId } })
      const ing = await prisma.ingredient.findUnique({ where: { id: ingredientId } })
      return bot.sendMessage(chatId, `↩️ *${ing?.nameRu || 'Продукт'}* возвращён в холодильник.`, { parse_mode: 'Markdown' })
    }
    return bot.sendMessage(chatId, 'Продукт уже в холодильнике.')
  }

  // Recipe
  if (data.startsWith('recipe_')) {
    const dishId = data.replace('recipe_', '')
    const dish = await prisma.dish.findUnique({
      where: { id: dishId },
      include: { ingredients: { include: { ingredient: true } } },
    })
    if (!dish) return

    const ings = dish.ingredients.map(di => `${di.ingredient.emoji || '•'} ${di.ingredient.nameRu}${di.amount ? ` — ${di.amount}` : ''}`).join('\n')
    let text = `📋 *${dish.nameRu}*\n\n*Ингредиенты:*\n${ings}\n`
    if (dish.recipe) {
      const plain = dish.recipe.replace(/^##\s/gm,'').replace(/\*\*/g,'*').slice(0, 800)
      text += `\n*Рецепт:*\n${plain}`
    }
    return bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [[
          { text: '📅 Буду готовить', callback_data: `plan_add_${dish.id}` },
        ]],
      },
    })
  }

  // Add to meal plan
  if (data.startsWith('plan_add_')) {
    const dishId = data.slice(9)
    const existing = await prisma.mealPlan.findFirst({ where: { userId: user.id, dishId } })
    if (existing) {
      return bot.sendMessage(chatId, '📅 Это блюдо уже в списке «Буду готовить»!')
    }
    await prisma.mealPlan.create({ data: { userId: user.id, dishId } })
    return bot.sendMessage(chatId, '✅ Добавлено в «Буду готовить»! Смотри кнопку 📅 в меню.')
  }

  // Fridge meal suggestions
  const fridgeMeals = { fridge_breakfast:'breakfast', fridge_lunch:'lunch', fridge_dinner:'dinner' }
  if (fridgeMeals[data]) {
    return sendDishSuggestions(chatId, user.id, fridgeMeals[data], true)
  }

  // Fridge clear
  if (data === 'fridge_clear') {
    await prisma.fridgeItem.deleteMany({ where: { userId: user.id } })
    return bot.sendMessage(chatId, '🗑 Холодильник очищен!')
  }

  // Add products: toggle ingredient
  if (data.startsWith('toggle_')) {
    const ingId = data.replace('toggle_', '')
    if (!session.data.selected) session.data.selected = []
    const idx = session.data.selected.indexOf(ingId)
    if (idx > -1) session.data.selected.splice(idx, 1)
    else session.data.selected.push(ingId)

    try {
      await bot.editMessageReplyMarkup(buildIngredientKeyboard(session), {
        chat_id: chatId,
        message_id: query.message.message_id,
      })
    } catch {}
    return
  }

  // Paginate
  if (data === 'page_next') {
    session.data.page++
    await bot.deleteMessage(chatId, query.message.message_id).catch(()=>{})
    return sendIngredientPage(chatId, session)
  }
  if (data === 'page_prev') {
    session.data.page--
    await bot.deleteMessage(chatId, query.message.message_id).catch(()=>{})
    return sendIngredientPage(chatId, session)
  }

  // Confirm adding products
  if (data === 'confirm_products') {
    const ids = session.data.selected || []
    if (!ids.length) return

    for (const ingredientId of ids) {
      const existing = await prisma.fridgeItem.findFirst({
        where: { userId: user.id, ingredientId, groupId: null },
      })
      if (!existing) {
        const ing = await prisma.ingredient.findUnique({ where: { id: ingredientId }, select: { defaultQuantity: true, defaultUnit: true } })
        await prisma.fridgeItem.create({
          data: {
            userId: user.id,
            ingredientId,
            quantityValue: ing?.defaultQuantity ?? null,
            quantityUnit: ing?.defaultUnit ?? null,
          },
        })
      }
    }

    session.state = 'idle'
    session.data = {}

    await bot.deleteMessage(chatId, query.message.message_id).catch(()=>{})
    return bot.sendMessage(chatId,
      `✅ Добавлено ${ids.length} продуктов в холодильник!\n\nТеперь можешь нажать *🧊 Мой холодильник* чтобы посмотреть рецепты из них.`,
      { parse_mode: 'Markdown' }
    )
  }

  // Cancel
  if (data === 'cancel_add') {
    session.state = 'idle'; session.data = {}
    await bot.deleteMessage(chatId, query.message.message_id).catch(()=>{})
    return bot.sendMessage(chatId, '❌ Отменено')
  }

  if (data === 'add_products') {
    return startAddProducts(chatId, session)
  }

  // Meal plan: show
  if (data === 'show_plan') {
    await bot.deleteMessage(chatId, query.message.message_id).catch(() => {})
    return showMealPlan(chatId, user.id)
  }

  // Meal plan: manage
  if (data === 'manage_plan') {
    return showMealPlanManage(chatId, user.id)
  }

  // Meal plan: remove item
  if (data.startsWith('remove_plan_')) {
    const planId = data.slice(12)
    await prisma.mealPlan.deleteMany({ where: { id: planId, userId: user.id } })

    const remaining = await prisma.mealPlan.findMany({
      where: { userId: user.id },
      include: { dish: true },
      orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    })

    if (!remaining.length) {
      await bot.deleteMessage(chatId, query.message.message_id).catch(() => {})
      return bot.sendMessage(chatId, '📅 Список пуст!')
    }

    const keyboard = remaining.map(p => {
      const dateStr = p.date
        ? new Date(p.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) + ' · '
        : ''
      return [{
        text: `❌ ${dateStr}${MEAL_RU[p.mealType] || ''} · ${p.dish.nameRu}`,
        callback_data: `remove_plan_${p.id}`,
      }]
    })
    keyboard.push([{ text: '← Назад', callback_data: 'show_plan' }])

    await bot.editMessageReplyMarkup(
      { inline_keyboard: keyboard },
      { chat_id: chatId, message_id: query.message.message_id }
    ).catch(() => {})
    return
  }

  // Fridge: manage mode
  if (data === 'manage_fridge') {
    return showFridgeManage(chatId, user.id)
  }

  // Fridge: back to main view
  if (data === 'show_fridge') {
    await bot.deleteMessage(chatId, query.message.message_id).catch(() => {})
    return showFridge(chatId, user.id)
  }

  // Fridge: remove single item
  if (data.startsWith('remove_')) {
    const ingredientId = data.slice(7)
    await prisma.fridgeItem.deleteMany({ where: { userId: user.id, ingredientId } })

    // Обновить список: если остались продукты — показать управление, иначе пустой
    const remaining = await prisma.fridgeItem.findMany({
      where: { userId: user.id },
      include: { ingredient: true },
      orderBy: { ingredient: { nameRu: 'asc' } },
    })

    if (!remaining.length) {
      await bot.deleteMessage(chatId, query.message.message_id).catch(()=>{})
      return bot.sendMessage(chatId, '🗑 Холодильник пуст!')
    }

    // Перестроить клавиатуру
    const keyboard = remaining.map(i => [{
      text: `❌ ${i.ingredient.emoji || ''} ${i.ingredient.nameRu}`.trim(),
      callback_data: `remove_${i.ingredientId}`,
    }])
    keyboard.push([{ text: '← Назад', callback_data: 'show_fridge' }])

    await bot.editMessageReplyMarkup(
      { inline_keyboard: keyboard },
      { chat_id: chatId, message_id: query.message.message_id }
    ).catch(()=>{})
    return
  }
})

function buildIngredientKeyboard(session) {
  const { ingredients, page, selected } = session.data
  const ITEMS_PER_PAGE = 8
  const start = page * ITEMS_PER_PAGE
  const chunk = ingredients.slice(start, start + ITEMS_PER_PAGE)
  const total = ingredients.length

  const keyboard = chunk.map(ing => [{
    text: `${selected.includes(ing.id) ? '✅' : (ing.emoji || '•')} ${ing.nameRu}`,
    callback_data: `toggle_${ing.id}`,
  }])
  keyboard.push([
    page > 0 ? { text: '← Назад', callback_data: 'page_prev' } : { text: ' ', callback_data: 'noop' },
    { text: `${page+1}/${Math.ceil(total/ITEMS_PER_PAGE)}`, callback_data: 'noop' },
    start + ITEMS_PER_PAGE < total ? { text: 'Вперёд →', callback_data: 'page_next' } : { text: ' ', callback_data: 'noop' },
  ])
  if (selected.length > 0) keyboard.push([{ text: `✅ Добавить выбранные (${selected.length})`, callback_data: 'confirm_products' }])
  keyboard.push([{ text: '❌ Отмена', callback_data: 'cancel_add' }])
  return { inline_keyboard: keyboard }
}

console.log('🤖 MealBot Telegram запущен...')
