// Пересчёт dish.calories у всех блюд после перехода calculateNutrition
// на формат «на 100 г».
//
// Запуск:
//   cd backend
//   DATABASE_URL="postgres://...:5432/..." node scripts/recalc-calories.js
//
// Скрипт идёт по всем Dish у которых calories != null (раньше их автоматически
// заполняла утилита старой формулой). Пересчитывает по новой, и если результат
// отличается — обновляет в БД.
// Если calories изначально null — не трогаем (значит авто-расчёт не сработал
// из-за отсутствия данных, и ничего не поменяется).

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const prisma = require('../src/lib/prisma')
const { calculateNutrition } = require('../src/utils/nutrition')

async function main() {
  const dishes = await prisma.dish.findMany({
    include: {
      ingredients: { include: { ingredient: true } },
    },
  })

  let updated = 0
  let skipped = 0
  let cleared = 0

  for (const dish of dishes) {
    if (!dish.ingredients?.length) {
      skipped++
      continue
    }
    const nutrition = calculateNutrition(dish.ingredients)
    const newCalories = nutrition ? nutrition.calories : null

    if (newCalories === dish.calories) {
      skipped++
      continue
    }

    await prisma.dish.update({
      where: { id: dish.id },
      data: { calories: newCalories },
    })

    if (newCalories == null) {
      cleared++
      console.log(`[cleared]  ${dish.id}  "${dish.name}"  ${dish.calories} → null`)
    } else {
      updated++
      console.log(`[updated]  ${dish.id}  "${dish.name}"  ${dish.calories} → ${newCalories}`)
    }
  }

  console.log('---')
  console.log(`Итого: обновлено ${updated}, очищено ${cleared}, без изменений ${skipped}`)
  console.log(`Всего блюд: ${dishes.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
