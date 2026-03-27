const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { z } = require('zod')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const signToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, { expiresIn: '30d' })

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
    const user = await prisma.user.create({
      data: { email, passwordHash, name },
      select: { id: true, email: true, name: true, role: true },
    })

    res.status(201).json({ token: signToken(user.id, user.role), user })
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ error: err.errors })
    next(err)
  }
})

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' })

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) return res.status(401).json({ error: 'Неверный email или пароль' })

    res.json({
      token: signToken(user.id, user.role),
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/me
const { authMiddleware } = require('../middleware/auth')
router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, role: true, telegramUsername: true, subscriptionUntil: true },
    })
    res.json(user)
  } catch (err) {
    next(err)
  }
})

module.exports = router
