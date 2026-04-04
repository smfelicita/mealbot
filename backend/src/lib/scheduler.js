const cron = require('node-cron')
const prisma = require('./prisma')
const { sendTelegramMessage } = require('./telegram')

function isSameDay(date, now) {
  if (!date) return false
  const d = new Date(date)
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate()
}

function daysAgo(n, now) {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return d
}

// Перемешать массив (Fisher-Yates)
function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function runDailyNotifications() {
  const now = new Date()
  console.log('[scheduler] Running daily notifications at', now.toISOString())

  // Получить всех пользователей с telegramId
  const users = await prisma.user.findMany({
    where: { telegramId: { not: null } },
    select: {
      id: true,
      telegramId: true,
      name: true,
      lastActiveAt: true,
      lastDailySuggestSentAt: true,
      lastFridgeReminderSentAt: true,
    },
  })

  for (const user of users) {
    try {
      // Если пользователь открывал приложение сегодня — не отправляем ничего
      if (isSameDay(user.lastActiveAt, now)) continue

      // ПРИОРИТЕТ 2: Ежедневное предложение
      if (!isSameDay(user.lastDailySuggestSentAt, now)) {
        const sent = await tryDailySuggest(user, now)
        if (sent) continue
      }

      // ПРИОРИТЕТ 3: Напоминание о холодильнике
      const threeDaysAgo = daysAgo(3, now)
      if (!user.lastFridgeReminderSentAt || new Date(user.lastFridgeReminderSentAt) < threeDaysAgo) {
        await tryFridgeReminder(user, now)
      }
    } catch (e) {
      console.error('[scheduler] error for user', user.id, e.message)
    }
  }
}

async function tryDailySuggest(user, now) {
  // Условие: нет плана на сегодня
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(now); todayEnd.setHours(23, 59, 59, 999)

  const hasPlanToday = await prisma.mealPlan.count({
    where: {
      userId: user.id,
      date: { gte: todayStart, lte: todayEnd },
    },
  })
  if (hasPlanToday) return false

  // Условие: ≥5 блюд в личной кухне
  const myDishes = await prisma.dish.findMany({
    where: {
      OR: [
        { authorId: user.id },
        { visibility: 'PUBLIC' },
      ],
    },
    select: { nameRu: true },
  })
  if (myDishes.length < 5) return false

  // Выбрать 3 случайных блюда
  const picks = shuffle(myDishes).slice(0, 3)
  const list = picks.map(d => `• ${d.nameRu}`).join('\n')

  await sendTelegramMessage(user.telegramId,
    `На сегодня ничего не запланировано.\n\nВот варианты из ваших блюд:\n${list}`)

  await prisma.user.update({
    where: { id: user.id },
    data: { lastDailySuggestSentAt: now },
  })

  return true
}

async function tryFridgeReminder(user, now) {
  const threeDaysAgo = new Date(now); threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  // Проверяем семейную группу
  const familyMembership = await prisma.groupMember.findFirst({
    where: { userId: user.id, group: { type: 'FAMILY' } },
    select: { groupId: true },
  })
  const fridgeWhere = familyMembership
    ? { groupId: familyMembership.groupId }
    : { userId: user.id, groupId: null }

  const fridgeItems = await prisma.fridgeItem.findMany({
    where: fridgeWhere,
    select: { addedAt: true },
    orderBy: { addedAt: 'desc' },
    take: 1,
  })

  const isEmpty = fridgeItems.length === 0
  const isStale = fridgeItems.length > 0 && new Date(fridgeItems[0].addedAt) < threeDaysAgo

  if (!isEmpty && !isStale) return

  await sendTelegramMessage(user.telegramId,
    `Холодильник пуст или давно не обновлялся.\n\nДобавь продукты, чтобы получить подборку блюд.`)

  await prisma.user.update({
    where: { id: user.id },
    data: { lastFridgeReminderSentAt: now },
  })
}

// Запуск: каждый день в 06:00 UTC (9:00 Москва)
cron.schedule('0 6 * * *', runDailyNotifications, { timezone: 'UTC' })

console.log('[scheduler] Daily notification cron scheduled (06:00 UTC)')

module.exports = { runDailyNotifications }
