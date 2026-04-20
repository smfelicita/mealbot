/**
 * Загружает фото блюд в Supabase Storage и обновляет imageUrl в БД.
 *
 * Использование:
 *   node scripts/upload-dish-photos.js /путь/к/папке/с/фото
 *
 * Формат файлов:
 *   Имя файла (без расширения) = название блюда на русском (nameRu в БД)
 *   Пример: "блины.jpg", "суп куриный.jpg"
 *
 * Требует переменных окружения (из .env или вручную):
 *   DATABASE_URL, SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

require('dotenv').config()
const fs   = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')
const { PrismaClient }  = require('@prisma/client')

const PHOTOS_DIR = process.argv[2]

if (!PHOTOS_DIR) {
  console.error('Укажи путь к папке с фото: node scripts/upload-dish-photos.js /путь/к/фото')
  process.exit(1)
}

const REQUIRED_ENV = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY']
const missing = REQUIRED_ENV.filter(k => !process.env[k])
if (missing.length) {
  console.error(`Нет переменных окружения: ${missing.join(', ')}`)
  process.exit(1)
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
const prisma   = new PrismaClient()

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp'])

function mimeByExt(ext) {
  return { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[ext]
}

async function main() {
  const files = fs.readdirSync(PHOTOS_DIR).filter(f => {
    const ext = path.extname(f).toLowerCase()
    return ALLOWED_EXT.has(ext) && !f.startsWith('.')
  })

  if (files.length === 0) {
    console.log('Нет подходящих файлов в папке (jpg, png, webp).')
    return
  }

  console.log(`Найдено файлов: ${files.length}\n`)

  for (const file of files) {
    const ext      = path.extname(file).toLowerCase()
    const dishName = path.basename(file, ext).trim()
    const filePath = path.join(PHOTOS_DIR, file)

    // Ищем блюдо по nameRu (без учёта регистра, substring)
    const dish = await prisma.dish.findFirst({
      where: { nameRu: { contains: dishName, mode: 'insensitive' } },
      select: { id: true, nameRu: true, imageUrl: true },
    })

    if (!dish) {
      console.log(`⚠  "${dishName}" — блюдо не найдено в БД, пропускаю`)
      continue
    }

    if (dish.imageUrl) {
      console.log(`⏭  "${dish.nameRu}" — уже есть фото, пропускаю (${dish.imageUrl})`)
      continue
    }

    // Загружаем в Supabase Storage
    const buffer      = fs.readFileSync(filePath)
    const storagePath = `images/dishes_seed_${Date.now()}${ext}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(storagePath, buffer, { contentType: mimeByExt(ext), upsert: false })

    if (uploadError) {
      console.error(`✗  "${dish.nameRu}" — ошибка загрузки: ${uploadError.message}`)
      continue
    }

    const { data: urlData } = supabase.storage.from('media').getPublicUrl(storagePath)
    const imageUrl = urlData.publicUrl

    // Обновляем imageUrl в БД
    await prisma.dish.update({
      where: { id: dish.id },
      data:  { imageUrl },
    })

    console.log(`✓  "${dish.nameRu}" → ${imageUrl}`)
  }

  console.log('\nГотово.')
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
