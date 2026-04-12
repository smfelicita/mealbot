const router = require('express').Router()
const multer = require('multer')
const path = require('path')
const { authMiddleware } = require('../middleware/auth')
const getSupabase = require('../lib/supabase')

const ALLOWED = {
  image: {
    mimes: ['image/jpeg', 'image/png', 'image/webp'],
    exts: ['.jpg', '.jpeg', '.png', '.webp'],
    maxSize: 5 * 1024 * 1024,   // 5 MB
  },
  video: {
    mimes: ['video/mp4', 'video/webm', 'video/quicktime'],
    exts: ['.mp4', '.webm', '.mov'],
    maxSize: 100 * 1024 * 1024, // 100 MB
  },
}

// Use the largest limit at multer level; per-type enforcement is in the route handler
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const rules = ALLOWED[req.params.type]
    if (!rules) return cb(new Error('Неверный тип загрузки'))
    if (!rules.mimes.includes(file.mimetype)) {
      return cb(new Error(`Недопустимый тип файла: ${file.mimetype}`))
    }
    const ext = path.extname(file.originalname).toLowerCase()
    if (!rules.exts.includes(ext)) {
      return cb(new Error(`Недопустимое расширение файла: ${ext}`))
    }
    cb(null, true)
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

    const rules = ALLOWED[type]
    const maxMB = rules.maxSize / (1024 * 1024)
    if (req.file.size > rules.maxSize) {
      return res.status(413).json({ error: `Файл слишком большой. Максимум: ${maxMB} MB` })
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
