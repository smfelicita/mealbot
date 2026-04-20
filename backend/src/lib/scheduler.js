const cron = require('node-cron')
const prisma = require('./prisma')
const { sendTelegramMessage } = require('./telegram')

// Получить текущий час в таймзоне пользователя
function getLocalHour(timezone, date) {
  try {
    return parseInt(new Intl.DateTimeFormat('en', {
      hour: 'numeric', hour12: false, timeZone: timezone,
    }).format(date), 10)
  } catch {
    return parseInt(new Intl.DateTimeFormat('en', {
      hour: 'numeric', hour12: false, timeZone: 'Europe/Moscow',
    }).format(date), 10)
  }
}

// Сравнить два момента как один и тот же день в таймзоне пользователя
function isSameDayInTz(date1, date2, timezone) {
  if (!date1) return false
  try {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }) // en-CA → "YYYY-MM-DD"
    return fmt.format(new Date(date1)) === fmt.format(new Date(date2))
  } catch {
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow' })
    return fmt.format(new Date(date1)) === fmt.format(new Date(date2))
  }
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

async function runHourlyCheck() {
  const now = new Date()

  // Получить всех пользователей с telegramId
  const users = await prisma.user.findMany({
    where: { telegramId: { not: null } },
    select: {
      id: true,
      telegramId: true,
      name: true,
      timezone: true,
      lastActiveAt: true,
      lastDailySuggestSentAt: true,
      lastFridgeReminderSentAt: true,
    },
  })

  for (const user of users) {
    try {
      const tz = user.timezone || 'Europe/Moscow'

      // Отправляем только если сейчас 16:xx в таймзоне пользователя
      if (getLocalHour(tz, now) !== 16) continue

      // Если пользователь открывал приложение сегодня (в его TZ) — пропускаем
      if (isSameDayInTz(user.lastActiveAt, now, tz)) continue

      // ПРИОРИТЕТ 2: Ежедневное предложение
      if (!isSameDayInTz(user.lastDailySuggestSentAt, now, tz)) {
        const sent = await tryDailySuggest(user, now, tz)
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

async function tryDailySuggest(user, now, tz) {
  // Нет плана на сегодня в TZ пользователя
  const fmtDate = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now) // "YYYY-MM-DD"
  const todayStart = new Date(`${fmtDate}T00:00:00.000Z`)
  // Сдвинуть на UTC-offset: проще через начало следующего дня
  const todayEnd = new Date(`${fmtDate}T23:59:59.999Z`)

  const hasPlanToday = await prisma.mealPlan.count({
    where: {
      userId: user.id,
      date: { gte: todayStart, lte: todayEnd },
    },
  })
  if (hasPlanToday) return false

  // ≥5 блюд в личной кухне или семейной группе
  const familyMembership = await prisma.groupMember.findFirst({
    where: { userId: user.id, group: { type: 'FAMILY' } },
    select: { groupId: true },
  })
  const myDishes = await prisma.dish.findMany({
    where: {
      OR: [
        { authorId: user.id },
        ...(familyMembership ? [{ visibility: 'FAMILY', groupId: familyMembership.groupId }] : []),
      ],
    },
    select: { name: true },
  })
  if (myDishes.length < 5) return false

  const picks = shuffle(myDishes).slice(0, 3)
  const list = picks.map(d => `• ${d.name}`).join('\n')

  await sendTelegramMessage(user.telegramId,
    `На сегодня ничего не запланировано.\n\nВот варианты из ваших блюд:\n${list}`)

  await prisma.user.update({
    where: { id: user.id },
    data: { lastDailySuggestSentAt: now },
  })

  return true
}

async function tryFridgeReminder(user, now) {
  const threeDaysAgo = daysAgo(3, now)

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

// Запуск каждый час — проверяем кому сейчас 16:xx по местному времени
cron.schedule('0 * * * *', runHourlyCheck, { timezone: 'UTC' })

console.log('[scheduler] Hourly notification cron scheduled (fires at 16:00 user local time)')

module.exports = { runHourlyCheck }
