const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { z } = require('zod')
const prisma = require('../lib/prisma')
const { Resend } = require('resend')
const { authMiddleware } = require('../middleware/auth')

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.RESEND_FROM || 'MealBot <noreply@smarussya.ru>'

async function sendEmailCode(email, code) {
  if (!resend) {
    console.log(`[EMAIL STUB] Код подтверждения для ${email}: ${code}`)
    return
  }
  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Ваш код подтверждения — MealBot',
    html: `
      <div style="font-family:sans-serif;max-width:420px;margin:0 auto">
        <h2 style="color:#e85d04">🍽️ MealBot</h2>
        <p>Ваш код подтверждения:</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#e85d04;margin:16px 0">${code}</div>
        <p style="color:#888;font-size:13px">Код действителен 15 минут. Если вы не регистрировались — просто проигнорируйте это письмо.</p>
      </div>
    `,
  })
}

const signToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '30d' })

// Добавляет базовые продукты в холодильник нового пользователя (если холодильник пуст)
async function addDefaultFridgeItems(userId) {
  const existing = await prisma.fridgeItem.count({ where: { userId, groupId: null } })
  if (existing > 0) return
  const basics = await prisma.ingredient.findMany({ where: { isBasic: true }, select: { id: true, defaultQuantity: true, defaultUnit: true } })
  if (!basics.length) return
  await prisma.fridgeItem.createMany({
    data: basics.map(ing => ({
      userId,
      ingredientId: ing.id,
      groupId: null,
      quantityValue: ing.defaultQuantity ?? null,
      quantityUnit: ing.defaultUnit ?? null,
    })),
    skipDuplicates: true,
  })
}

function genCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function saveCode(type, target, code) {
  const expiresAt = new Date(Date.now() + (type === 'phone' ? 10 : 15) * 60 * 1000)
  await prisma.verificationCode.create({ data: { type, target, code, expiresAt } })
}

async function findValidCode(type, target, code) {
  return prisma.verificationCode.findFirst({
    where: { type, target, code, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
}

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('8') && digits.length === 11) return '+7' + digits.slice(1)
  if (digits.startsWith('7') && digits.length === 11) return '+' + digits
  if (digits.length === 10) return '+7' + digits
  return '+' + digits
}

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
      name: z.string().min(1).optional(),
    })
    const { email, password, name } = schema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'Email уже зарегистрирован' })

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.create({ data: { email, passwordHash, name } })

    const code = genCode()
    await saveCode('email', email, code)
    await sendEmailCode(email, code)

    res.status(201).json({ requireVerification: true, email })
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors })
    next(err)
  }
})

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res, next) => {
  try {
    const { email, code } = req.body
    if (!email || !code) return res.status(400).json({ error: 'Укажи email и код' })

    const vc = await findValidCode('email', email, code)
    if (!vc) return res.status(400).json({ error: 'Неверный или истёкший код' })

    await prisma.verificationCode.update({ where: { id: vc.id }, data: { usedAt: new Date() } })

    const user = await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
      select: { id: true, email: true, name: true, role: true },
    })

    await addDefaultFridgeItems(user.id)
    res.json({ token: signToken(user.id, user.role), user })
  } catch (err) { next(err) }
})

// POST /api/auth/resend-email-code
router.post('/resend-email-code', async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Укажи email' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' })

    const recent = await prisma.verificationCode.findFirst({
      where: { type: 'email', target: email, createdAt: { gt: new Date(Date.now() - 60_000) } },
    })
    if (recent) return res.status(429).json({ error: 'Подождите минуту перед повторной отправкой' })

    await prisma.verificationCode.deleteMany({
      where: { type: 'email', target: email, usedAt: null },
    })

    const code = genCode()
    await saveCode('email', email, code)
    await sendEmailCode(email, code)

    res.json({ sent: true })
  } catch (err) { next(err) }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Неверный email или пароль' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' })

    res.json({
      token: signToken(user.id, user.role),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
  } catch (err) { next(err) }
})

// POST /api/auth/send-phone-code
router.post('/send-phone-code', async (req, res, next) => {
  try {
    const { phone } = req.body
    if (!phone) return res.status(400).json({ error: 'Укажи номер телефона' })

    const normalized = normalizePhone(phone)
    if (normalized.length < 10) return res.status(400).json({ error: 'Неверный формат номера' })

    const recent = await prisma.verificationCode.findFirst({
      where: { type: 'phone', target: normalized, createdAt: { gt: new Date(Date.now() - 60_000) } },
    })
    if (recent) return res.status(429).json({ error: 'Подождите минуту перед повторной отправкой' })

    await prisma.verificationCode.deleteMany({
      where: { type: 'phone', target: normalized, usedAt: null },
    })

    const code = genCode()
    await saveCode('phone', normalized, code)
    console.log(`[SMS STUB] Код для ${normalized}: ${code}`)

    res.json({ sent: true, phone: normalized })
  } catch (err) { next(err) }
})

// POST /api/auth/verify-phone
router.post('/verify-phone', async (req, res, next) => {
  try {
    const { phone, code, name } = req.body
    if (!phone || !code) return res.status(400).json({ error: 'Укажи телефон и код' })

    const normalized = normalizePhone(phone)
    const vc = await findValidCode('phone', normalized, code)
    if (!vc) return res.status(400).json({ error: 'Неверный или истёкший код' })

    await prisma.verificationCode.update({ where: { id: vc.id }, data: { usedAt: new Date() } })

    let user = await prisma.user.findUnique({ where: { phone: normalized } })
    const isNew = !user
    if (!user) {
      user = await prisma.user.create({
        data: { phone: normalized, phoneVerified: true, name: name || null },
      })
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      })
    }

    if (isNew) await addDefaultFridgeItems(user.id)
    res.json({
      token: signToken(user.id, user.role),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
  } catch (err) { next(err) }
})

// POST /api/auth/google
router.post('/google', async (req, res, next) => {
  try {
    const { token } = req.body
    if (!token) return res.status(400).json({ error: 'Токен не передан' })
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'Google OAuth не настроен' })

    const { OAuth2Client } = require('google-auth-library')
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
    const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID })
    const { sub: googleId, email, name } = ticket.getPayload()

    let user = await prisma.user.findUnique({ where: { googleId } })
    if (!user && email) {
      user = await prisma.user.findUnique({ where: { email } })
      if (user) {
        user = await prisma.user.update({ where: { id: user.id }, data: { googleId } })
      }
    }
    const isNew = !user
    if (!user) {
      user = await prisma.user.create({ data: { googleId, email: email || null, name: name || null, emailVerified: !!email } })
    }

    if (isNew) await addDefaultFridgeItems(user.id)
    res.json({
      token: signToken(user.id, user.role),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
  } catch (err) {
    if (err.message?.includes('Token used too late') || err.message?.includes('Invalid token')) {
      return res.status(401).json({ error: 'Неверный Google токен' })
    }
    next(err)
  }
})

// POST /api/auth/generate-telegram-link — генерирует ссылку для привязки Telegram к аккаунту
router.post('/generate-telegram-link', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { telegramId: true, pendingTelegramLink: true, updatedAt: true },
    })

    if (user.telegramId) return res.status(409).json({ error: 'Telegram уже подключён' })

    // Rate limit: не чаще раза в минуту
    if (user.pendingTelegramLink && user.updatedAt > new Date(Date.now() - 60_000)) {
      return res.status(429).json({ error: 'Подождите минуту перед повторным запросом' })
    }

    const { randomBytes } = require('crypto')
    const token = randomBytes(16).toString('hex')
    await prisma.user.update({
      where: { id: req.userId },
      data: { pendingTelegramLink: token },
    })
    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'MealBotRu'
    res.json({ url: `https://t.me/${botUsername}?start=link_${token}` })
  } catch (err) { next(err) }
})

// GET /api/auth/tg?token= — обмен одноразового токена на JWT
router.get('/tg', async (req, res, next) => {
  try {
    const { token } = req.query
    if (!token) return res.status(400).json({ error: 'Токен не передан' })

    const user = await prisma.user.findUnique({ where: { webLoginToken: token } })
    if (!user || !user.webLoginTokenAt) return res.status(401).json({ error: 'Недействительный токен' })

    // Токен действует 10 минут
    const age = Date.now() - new Date(user.webLoginTokenAt).getTime()
    if (age > 10 * 60 * 1000) return res.status(401).json({ error: 'Токен истёк' })

    // Сбрасываем токен после использования
    await prisma.user.update({
      where: { id: user.id },
      data: { webLoginToken: null, webLoginTokenAt: null },
    })

    res.json({
      token: signToken(user.id, user.role),
      user: { id: user.id, email: user.email, name: user.name, role: user.role, telegramId: user.telegramId, telegramUsername: user.telegramUsername },
    })
  } catch (err) { next(err) }
})

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, role: true, telegramId: true, telegramUsername: true, subscriptionUntil: true, phone: true, phoneVerified: true, emailVerified: true },
    })
    res.json(user)
  } catch (err) { next(err) }
})

module.exports = router
