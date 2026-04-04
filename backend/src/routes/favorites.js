const router = require('express').Router()
const prisma = require('../lib/prisma')
const { authMiddleware: auth } = require('../middleware/auth')

router.use(auth)

// GET /api/favorites — список dishId в избранном
router.get('/', async (req, res, next) => {
  try {
    const favs = await prisma.favorite.findMany({
      where: { userId: req.userId },
      select: { dishId: true },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ dishIds: favs.map(f => f.dishId) })
  } catch (err) { next(err) }
})

// POST /api/favorites/:dishId — добавить в избранное
router.post('/:dishId', async (req, res, next) => {
  try {
    const { dishId } = req.params
    await prisma.favorite.upsert({
      where: { userId_dishId: { userId: req.userId, dishId } },
      create: { userId: req.userId, dishId },
      update: {},
    })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

// DELETE /api/favorites/:dishId — убрать из избранного
router.delete('/:dishId', async (req, res, next) => {
  try {
    await prisma.favorite.deleteMany({
      where: { userId: req.userId, dishId: req.params.dishId },
    })
    res.json({ ok: true })
  } catch (err) { next(err) }
})

module.exports = router
