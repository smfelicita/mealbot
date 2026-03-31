// Генерирует PNG-иконки без внешних зависимостей
// node scripts/create-icons.js

const zlib = require('zlib')
const fs   = require('fs')
const path = require('path')

// CRC32
const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  crcTable[i] = c
}
function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const t   = Buffer.from(type, 'ascii')
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])))
  return Buffer.concat([len, t, data, crcBuf])
}

// Рисует иконку: оранжевый круг на тёмном фоне + вилка
function createIcon(size) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10])

  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8   // bit depth
  ihdrData[9] = 2   // RGB (no alpha, for compatibility)

  // Рисуем пиксели
  const cx = size / 2, cy = size / 2
  const r  = size * 0.42
  const rowSize = 1 + size * 3
  const raw = Buffer.alloc(size * rowSize)

  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0 // filter: None
    for (let x = 0; x < size; x++) {
      const dx = x - cx, dy = y - cy
      const dist = Math.sqrt(dx*dx + dy*dy)

      let pr, pg, pb
      if (dist <= r) {
        // Оранжевый круг #e85d04
        pr = 0xe8; pg = 0x5d; pb = 0x04
        // Добавляем небольшой светлый блик сверху-слева
        if (dist <= r * 0.7 && dx < -r*0.1 && dy < -r*0.1) {
          pr = Math.min(255, pr + 30); pg = Math.min(255, pg + 20)
        }
      } else {
        // Тёмный фон #0f0f1a
        pr = 0x0f; pg = 0x0f; pb = 0x1a
      }

      // Простая вилка внутри круга — три вертикальные полоски + ручка
      const forkW = size * 0.04
      const tineH = size * 0.28
      const forkTop = cy - size * 0.24
      const handleTop = cy - size * 0.02
      const handleBot = cy + size * 0.26
      const handleX = cx
      const tineSpacing = size * 0.065
      const tines = [cx - tineSpacing, cx, cx + tineSpacing]

      let onFork = false
      for (const tx of tines) {
        if (Math.abs(x - tx) <= forkW && y >= forkTop && y <= forkTop + tineH) {
          onFork = true; break
        }
      }
      if (Math.abs(x - handleX) <= forkW * 1.3 && y >= handleTop && y <= handleBot) {
        onFork = true
      }

      if (onFork && dist <= r * 0.9) {
        pr = 0xff; pg = 0xff; pb = 0xff
      }

      const off = y * rowSize + 1 + x * 3
      raw[off] = pr; raw[off+1] = pg; raw[off+2] = pb
    }
  }

  const compressed = zlib.deflateSync(raw)
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const outDir = path.join(__dirname, '..', 'public')
fs.mkdirSync(outDir, { recursive: true })

fs.writeFileSync(path.join(outDir, 'icon-192.png'), createIcon(192))
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createIcon(512))
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createIcon(180))

console.log('✅ Иконки созданы: icon-192.png, icon-512.png, apple-touch-icon.png')
