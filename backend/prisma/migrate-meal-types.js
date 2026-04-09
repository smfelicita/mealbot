/**
 * Миграция данных: MealCategory → MealType для mealTime
 *
 * Что делает:
 * 1. Для каждого блюда, у которого в categories есть BREAKFAST/LUNCH/DINNER/SNACK —
 *    переносит их в mealTime (если там ещё нет)
 * 2. Убирает BREAKFAST/LUNCH/DINNER/SNACK из categories
 * 3. Убирает невалидные значения из mealTime (строки типа "breakfast" → MealType enum)
 */

require('dotenv').config({ path: '../.env' })
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const CAT_TO_MEALTYPE = {
  BREAKFAST: 'BREAKFAST',
  LUNCH: 'LUNCH',
  DINNER: 'DINNER',
  SNACK: 'SNACK',
}

// Старые строковые значения mealTime → MealType enum
const STRING_TO_MEALTYPE = {
  breakfast: 'BREAKFAST',
  lunch: 'LUNCH',
  dinner: 'DINNER',
  snack: 'SNACK',
  anytime: 'ANYTIME',
}

const VALID_CATEGORIES = ['SOUP', 'SALAD', 'MAIN', 'SIDE', 'DESSERT', 'DRINK', 'BAKERY', 'SAUCE']
const VALID_MEALTYPES = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'ANYTIME']

async function main() {
  const dishes = await prisma.$queryRaw`SELECT id, categories, "mealTime" FROM dishes`

  let updated = 0

  for (const dish of dishes) {
    const oldCategories = dish.categories || []
    const oldMealTime = dish.mealTime || []

    // Конвертируем старые строковые mealTime в enum-значения
    const mealTimeFromOld = oldMealTime
      .map(mt => STRING_TO_MEALTYPE[mt] || (VALID_MEALTYPES.includes(mt) ? mt : null))
      .filter(Boolean)

    // Добавляем из categories
    const mealTimeFromCats = oldCategories
      .map(c => CAT_TO_MEALTYPE[c])
      .filter(Boolean)

    // Итоговый mealTime (дедупликация)
    const newMealTime = [...new Set([...mealTimeFromOld, ...mealTimeFromCats])]

    // Убираем из categories то что уже не валидно
    const newCategories = oldCategories.filter(c => VALID_CATEGORIES.includes(c))

    const mealTimeChanged = JSON.stringify(newMealTime.sort()) !== JSON.stringify((dish.mealTime || []).sort())
    const categoriesChanged = JSON.stringify(newCategories.sort()) !== JSON.stringify(oldCategories.sort())

    if (mealTimeChanged || categoriesChanged) {
      await prisma.$executeRaw`
        UPDATE dishes
        SET categories = ${newCategories}::"MealCategory"[],
            "mealTime" = ${newMealTime}::"MealType"[]
        WHERE id = ${dish.id}
      `
      console.log(`[${dish.id}] categories: ${JSON.stringify(oldCategories)} → ${JSON.stringify(newCategories)} | mealTime: ${JSON.stringify(dish.mealTime)} → ${JSON.stringify(newMealTime)}`)
      updated++
    }
  }

  console.log(`\nГотово. Обновлено блюд: ${updated} из ${dishes.length}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
