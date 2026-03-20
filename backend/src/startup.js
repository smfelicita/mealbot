// Run this on first deploy: node src/startup.js
const { execSync } = require('child_process')

console.log('Running migrations...')
execSync('npx prisma migrate deploy', { stdio: 'inherit' })

console.log('Seeding database...')
try {
  execSync('node src/prisma/seed.js', { stdio: 'inherit' })
} catch (e) {
  console.log('Seed already ran or failed — skipping')
}

console.log('✅ Startup complete')
