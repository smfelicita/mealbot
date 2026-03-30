// Расчёт КБЖУ блюда на основе ингредиентов
// Все значения в граммах; калории: protein×4 + fat×9 + carbs×4

const UNIT_TO_GRAMS = {
  'г':       (v) => v,
  'мл':      (v) => v,
  'шт':      (v, avgWeightG) => v * (avgWeightG || 0),
  'зубчик':  (v) => v * 5,
  'пучок':   (v) => v * 30,
  'щепотка': (v) => v * 1,
}

/**
 * Рассчитывает КБЖУ блюда.
 * @param {Array} dishIngredients — массив DishIngredient с include ingredient
 * @returns {{ calories: number, protein: number, fat: number, carbs: number } | null}
 */
function calculateNutrition(dishIngredients) {
  let totalProtein = 0
  let totalFat = 0
  let totalCarbs = 0
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
    totalProtein += ((ingredient.protein || 0) * grams) / 100
    totalFat     += ((ingredient.fat     || 0) * grams) / 100
    totalCarbs   += ((ingredient.carbs   || 0) * grams) / 100
  }

  if (!hasData) return null

  const calories = Math.round(totalProtein * 4 + totalFat * 9 + totalCarbs * 4)
  return {
    calories,
    protein: Math.round(totalProtein * 10) / 10,
    fat:     Math.round(totalFat     * 10) / 10,
    carbs:   Math.round(totalCarbs   * 10) / 10,
  }
}

module.exports = { calculateNutrition }
