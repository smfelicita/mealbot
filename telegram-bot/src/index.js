require('dotenv').config()
const TelegramBot = require('node-telegram-bot-api')
const { PrismaClient } = require('@prisma/client')
const Anthropic = require('@anthropic-ai/sdk')

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })
const prisma = new PrismaClient()
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

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

const MAIN_MENU = {
  reply_markup: {
    keyboard: [
      [{ text: '🌅 Завтрак' }, { text: '☀️ Обед' }],
      [{ text: '🌙 Ужин' },    { text: '🍎 Перекус' }],
      [{ text: '🧊 Мой холодильник' }, { text: '➕ Добавить продукты' }],
      [{ text: '🎲 Случайное блюдо' }, { text: '🤖 Спросить ИИ' }],
    ],
    resize_keyboard: true,
  },
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

  const user = await getUser(msg.from)
  const name = user.name || 'друг'

  await bot.sendMessage(chatId,
    `👋 Привет, *${name}*\\! Я MealBot — помогу выбрать что приготовить\\.\n\n` +
    `Что умею:\n` +
    `🍳 Предлагать блюда на завтрак, обед, ужин\n` +
    `🧊 Учитывать что есть в холодильнике\n` +
    `✨ Отвечать на вопросы про еду\n\n` +
    `Просто напиши что хочешь поесть, или используй меню ниже:`,
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
      '🧊 Холодильник пустой\\.\n\nНажми *➕ Добавить продукты* чтобы заполнить\\.',
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
            { text: '🌅 Завтрак из холодильника', callback_data: 'fridge_breakfast' },
            { text: '☀️ Обед', callback_data: 'fridge_lunch' },
          ],
          [
            { text: '🌙 Ужин', callback_data: 'fridge_dinner' },
            { text: '🗑 Очистить', callback_data: 'fridge_clear' },
          ],
        ],
      },
    }
  )
}

// ─── Add products flow ────────────────────────────────────────────────────
async function startAddProducts(chatId, session) {
  session.state = 'adding_products'
  const ingredients = await prisma.ingredient.findMany({ orderBy: { nameRu: 'asc' } })
  session.data.ingredients = ingredients

  const chunks = chunkArray(ingredients, 8)
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
    `📋 Выбери продукты для холодильника\n\n_Выбрано: ${selected.length}_\n\nНажимай на продукты чтобы отметить:`,
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

// ─── Message handler ───────────────────────────────────────────────────────
bot.on('message', async (msg) => {
  if (!msg.text) return
  const chatId = msg.chat.id
  const user = await getUser(msg.from)
  const session = getSession(chatId)
  const text = msg.text

  // Meal time buttons
  if (MEAL_MAP[text]) {
    return sendDishSuggestions(chatId, user.id, MEAL_MAP[text])
  }

  // Menu commands
  if (text === '🧊 Мой холодильник') return showFridge(chatId, user.id)
  if (text === '➕ Добавить продукты') return startAddProducts(chatId, session)

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
    return bot.sendMessage(chatId, '✨ Спрашивай! Расскажи что хочешь поесть, и я помогу подобрать блюдо. Для выхода — /start')
  }

  // Adding products flow
  if (session.state === 'adding_products') {
    const ing = session.data.ingredients?.find(i => i.nameRu.toLowerCase() === text.toLowerCase())
    if (ing) {
      if (!session.data.selected.includes(ing.id)) session.data.selected.push(ing.id)
      return bot.sendMessage(chatId, `✅ ${ing.nameRu} отмечен! Можешь выбрать ещё или нажми "Добавить".`)
    }
    return
  }

  // AI chat
  if (session.state === 'ai_chat' || text.length > 3) {
    await bot.sendChatAction(chatId, 'typing')
    try {
      const reply = await handleAiChat(chatId, user.id, text)
      return bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' })
    } catch (e) {
      return bot.sendMessage(chatId, '⚠️ Ошибка ИИ, попробуй позже')
    }
  }
})

// ─── Callback query handler ────────────────────────────────────────────────
bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id
  const data = query.data
  const user = await getUser(query.from)
  const session = getSession(chatId)

  await bot.answerCallbackQuery(query.id)

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
    return bot.sendMessage(chatId, text, { parse_mode: 'Markdown' })
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
      await prisma.fridgeItem.upsert({
        where: { userId_ingredientId: { userId: user.id, ingredientId } },
        update: {},
        create: { userId: user.id, ingredientId },
      })
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

function chunkArray(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

console.log('🤖 MealBot Telegram запущен...')
