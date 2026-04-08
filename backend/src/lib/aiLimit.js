const prisma = require('./prisma')

const USER_LIMIT = 10

/**
 * Проверяет и увеличивает счётчик ИИ-сообщений для авторизованного пользователя.
 * @returns {{ allowed: boolean, left: number }}
 */
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

  if (count >= USER_LIMIT) return { allowed: false, left: 0 }

  await prisma.user.update({
    where: { id: userId },
    data: {
      aiMessagesDay: isToday ? { increment: 1 } : 1,
      aiMessagesDate: new Date(),
    },
  })

  return { allowed: true, left: USER_LIMIT - count - 1 }
}

module.exports = { checkAiLimit, USER_LIMIT }
