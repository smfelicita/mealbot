// Расчёт КБЖУ блюда на основе ингредиентов.
// Значения в таблице Ingredient хранятся на 100 г.
// На выходе возвращаем КБЖУ тоже на 100 г сырых ингредиентов
// (честнее общего блюда — не зависит от размера порции / количества порций).
// Калории: protein×4 + fat×9 + carbs×4.

const UNIT_TO_GRAMS = {
  'г':       (v) => v,
  'мл':      (v) => v,
  'шт':      (v, avgWeightG) => v * (avgWeightG || 0),
  'зубчик':  (v) => v * 5,
  'пучок':   (v) => v * 30,
  'щепотка': (v) => v * 1,
}

/**
 * Рассчитывает КБЖУ блюда на 100 г сырых ингредиентов.
 * @param {Array} dishIngredients — массив DishIngredient с include ingredient
 * @returns {{ calories: number, protein: number, fat: number, carbs: number } | null}
 */
function calculateNutrition(dishIngredients) {
  let totalProtein = 0
  let totalFat = 0
  let totalCarbs = 0
  let totalGrams = 0
  let hasData = false

  for (const di of dishIngredients) {
    if (di.toTaste) continue
    const { ingredient, amountValue, unit } = di
    if (!ingredient || !amountValue || !unit) continue
    if (ingredient.protein == null && ingredient.fat == null && ingredient.carbs == null) continue

    const converter = UNIT_TO_GRAMS[unit]
    if (!converter) continue

    const grams = converter(amountValue, ingredient.avgWeightG)
    if (!grams) continue

    hasData = true
    totalGrams   += grams
    totalProtein += ((ingredient.protein || 0) * grams) / 100
    totalFat     += ((ingredient.fat     || 0) * grams) / 100
    totalCarbs   += ((ingredient.carbs   || 0) * grams) / 100
  }

  if (!hasData || totalGrams <= 0) return null

  // Нормализуем на 100 г.
  const k = 100 / totalGrams
  const protein = totalProtein * k
  const fat     = totalFat     * k
  const carbs   = totalCarbs   * k
  const calories = Math.round(protein * 4 + fat * 9 + carbs * 4)

  return {
    calories,
    protein: Math.round(protein * 10) / 10,
    fat:     Math.round(fat     * 10) / 10,
    carbs:   Math.round(carbs   * 10) / 10,
  }
}

module.exports = { calculateNutrition }
