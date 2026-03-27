const router = require('express').Router()
const multer = require('multer')
const path = require('path')
const { authMiddleware } = require('../middleware/auth')
const getSupabase = require('../lib/supabase')

// Файл хранится в памяти (не на диске) — сразу отправляем в Supabase
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB максимум
  },
  fileFilter: (req, file, cb) => {
    const allowed = {
      image: ['image/jpeg', 'image/png', 'image/webp'],
      video: ['video/mp4', 'video/webm', 'video/quicktime'],
    }
    const type = req.params.type
    const allowedTypes = allowed[type] || []
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error(`Недопустимый тип файла: ${file.mimetype}`))
    }
  },
})

// POST /api/upload/:type  (type = image | video)
// Требует авторизации
router.post('/:type', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { type } = req.params
    if (!['image', 'video'].includes(type)) {
      return res.status(400).json({ error: 'Тип должен быть image или video' })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' })
    }

    const ext = path.extname(req.file.originalname).toLowerCase()
    const fileName = `${type}s/${req.userId}_${Date.now()}${ext}`

    const supabase = getSupabase()
    const { error } = await supabase.storage
      .from('media')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      })

    if (error) throw error

    const { data } = supabase.storage.from('media').getPublicUrl(fileName)

    res.json({ url: data.publicUrl })
  } catch (err) {
    console.error('Upload error:', err)
    res.status(500).json({ error: err.message || 'Ошибка загрузки файла' })
  }
})

module.exports = router
