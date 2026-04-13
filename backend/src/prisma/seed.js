const { PrismaClient } = require('@prisma/client')
const { ingredients } = require('./ingredients')
const prisma = new PrismaClient()

// 1 блюдо на каждое время приёма пищи — живые, домашние, не каталог
const dishes = [
  {
    name: 'syrniki_home',
    nameRu: 'Сырники без сахара',
    description: 'пышные, почти без сахара. со сметаной обязательно',
    categories: ['BREAKFAST'],
    cuisine: 'Русская',
    mealTime: ['BREAKFAST'],
    tags: ['вегетарианское', 'завтрак', 'творог'],
    cookTime: 25,
    difficulty: 'easy',
    calories: 280,
    recipe: `## Сырники без сахара\n\n**Ингредиенты:**\n- 500 г творога (жирный лучше)\n- 2 яйца\n- 3 ст.л. муки + немного на обваливание\n- щепотка соли\n- сливочное масло для жарки\n\n**Приготовление:**\n1. Творог разминаем вилкой, добавляем яйца, муку, соль — мешаем до однородности\n2. Лепим небольшие круглые лепёшки, обваливаем в муке\n3. Жарим на среднем огне — по 3–4 минуты с каждой стороны, не торопиться\n4. Подаём со сметаной. Холодные тоже вкусные`,
    ingredients: [
      { name: 'cottage_cheese', amount: '500 г',   amountValue: 500, unit: 'г' },
      { name: 'chicken_egg',    amount: '2 шт',    amountValue: 2,   unit: 'шт' },
      { name: 'wheat_flour',    amount: '3 ст.л.', amountValue: 45,  unit: 'г' },
      { name: 'salt',           amount: 'щепотка' },
      { name: 'butter',         amount: '1 ст.л.', amountValue: 15,  unit: 'г' },
      { name: 'sour_cream',     amount: 'по вкусу' },
    ],
  },
  {
    name: 'chicken_soup_home',
    nameRu: 'Тот куриный суп',
    description: 'варю когда никто не болеет — просто потому что вкусно',
    categories: ['SOUP', 'LUNCH'],
    cuisine: 'Русская',
    mealTime: ['LUNCH'],
    tags: ['суп', 'сытное', 'курица'],
    cookTime: 60,
    difficulty: 'easy',
    calories: 160,
    recipe: `## Тот куриный суп\n\n**Ингредиенты:**\n- 400 г куриной грудки или бёдра\n- 3 картофелины\n- 1 морковь\n- 1 луковица\n- соль, укроп, петрушка\n\n**Приготовление:**\n1. Курицу заливаем холодной водой, доводим до кипения — сливаем первую воду\n2. Заливаем чистой водой, варим 30–40 минут, снимаем пену\n3. Добавляем картошку кубиками, морковь кружочками, луковицу целиком\n4. Варим ещё 20 минут. Лук вынимаем\n5. Солим, добавляем зелень. Дать настояться 10 минут`,
    ingredients: [
      { name: 'chicken_breast', amount: '400 г', amountValue: 400, unit: 'г' },
      { name: 'potato',         amount: '3 шт',  amountValue: 3,   unit: 'шт' },
      { name: 'carrot',         amount: '1 шт',  amountValue: 1,   unit: 'шт' },
      { name: 'onion',          amount: '1 шт',  amountValue: 1,   unit: 'шт' },
      { name: 'salt',           amount: 'по вкусу' },
      { name: 'dill',           amount: 'пучок', amountValue: 1,   unit: 'пучок' },
      { name: 'parsley',        amount: 'пучок', amountValue: 1,   unit: 'пучок' },
    ],
  },
  {
    name: 'fried_potatoes_home',
    nameRu: 'Жареная картошка с луком',
    description: 'то самое. главное — не мешать слишком часто и дать подрумяниться',
    categories: ['DINNER'],
    cuisine: 'Русская',
    mealTime: ['DINNER'],
    tags: ['вегетарианское', 'сытное', 'картошка'],
    cookTime: 30,
    difficulty: 'easy',
    calories: 360,
    recipe: `## Жареная картошка с луком\n\n**Ингредиенты:**\n- 600 г картофеля\n- 1 большая луковица\n- подсолнечное масло\n- соль, укроп\n\n**Приготовление:**\n1. Картошку нарезать ломтиками (не слишком тонко — иначе развалятся)\n2. Масло хорошо разогреть на сковороде — важно\n3. Выкладываем картошку, первые 5–7 минут не трогаем — пусть схватится корочка\n4. Перемешиваем, жарим ещё 10–15 минут, иногда переворачивая\n5. За 5 минут до готовности добавляем лук полукольцами\n6. Солим, посыпаем укропом`,
    ingredients: [
      { name: 'potato',        amount: '600 г',   amountValue: 600, unit: 'г' },
      { name: 'onion',         amount: '1 шт',    amountValue: 1,   unit: 'шт' },
      { name: 'sunflower_oil', amount: '3 ст.л.', amountValue: 45,  unit: 'мл' },
      { name: 'salt',          amount: 'по вкусу' },
      { name: 'dill',          amount: 'пучок',   amountValue: 1,   unit: 'пучок' },
    ],
  },
  {
    name: 'blinchiki_home',
    nameRu: 'Любимые блинчики',
    description: 'тонкие, по маминому рецепту. с чем угодно — со сметаной, с вареньем, просто так',
    categories: ['BREAKFAST', 'SNACK'],
    cuisine: 'Русская',
    mealTime: ['SNACK'],
    tags: ['вегетарианское', 'традиционное', 'выходной'],
    cookTime: 35,
    difficulty: 'easy',
    calories: 320,
    recipe: `## Любимые блинчики\n\n**Ингредиенты:**\n- 2 яйца\n- 500 мл молока\n- 200 г муки\n- 1 ч.л. сахара\n- щепотка соли\n- 2 ст.л. растопленного масла\n\n**Приготовление:**\n1. Взбить яйца с сахаром и солью\n2. Добавить половину молока, просеять муку — мешать до однородности\n3. Влить оставшееся молоко и масло, дать постоять 10 минут\n4. Сковороду хорошо прогреть, слегка смазать маслом\n5. Наливать тонким слоем, жарить по 1–2 минуты с каждой стороны\n\nТесто лучше делать с вечера — утром выходят ещё нежнее`,
    ingredients: [
      { name: 'chicken_egg', amount: '2 шт',    amountValue: 2,   unit: 'шт' },
      { name: 'milk',        amount: '500 мл',  amountValue: 500, unit: 'мл' },
      { name: 'wheat_flour', amount: '200 г',   amountValue: 200, unit: 'г' },
      { name: 'sugar',       amount: '1 ч.л.',  amountValue: 5,   unit: 'г' },
      { name: 'salt',        amount: 'щепотка' },
      { name: 'butter',      amount: '2 ст.л.', amountValue: 30,  unit: 'г' },
    ],
  },
]

async function main() {
  console.log('🌱 Starting seed...')

  // Создаём / обновляем ингредиенты
  console.log('Creating ingredients...')
  const ingredientMap = {}
  for (const ing of ingredients) {
    const { name, nameRu, category, protein = null, fat = null, carbs = null, avgWeightG = null, isBasic = false, ignoreInFridgeFilter = false, emoji = null, defaultQuantity = null, defaultUnit = null } = ing
    const data = { name, nameRu, category, protein, fat, carbs, avgWeightG, isBasic, ignoreInFridgeFilter, emoji, defaultQuantity, defaultUnit }
    const created = await prisma.ingredient.upsert({
      where: { name },
      update: { nameRu, category, protein, fat, carbs, avgWeightG, isBasic, ignoreInFridgeFilter, emoji, defaultQuantity, defaultUnit },
      create: data,
    })
    ingredientMap[ing.name] = created.id
  }
  console.log(`✅ ${ingredients.length} ingredients`)

  // Удаляем старые системные блюда (authorId IS NULL) — заменяем новыми живыми
  console.log('Cleaning up old system dishes...')
  const deleted = await prisma.dish.deleteMany({ where: { authorId: null } })
  console.log(`  🗑  Удалено ${deleted.count} старых блюд`)

  // Создаём новые блюда
  console.log('Creating dishes...')
  for (const dish of dishes) {
    const { ingredients: dishIngredients, ...dishData } = dish

    const ingData = dishIngredients.map(ing => ({
      ingredientId: ingredientMap[ing.name],
      amount: ing.amount,
      amountValue: ing.amountValue ?? null,
      unit: ing.unit ?? null,
      toTaste: !ing.amountValue || ing.amount === 'по вкусу' || ing.amount === 'щепотка',
    }))

    const created = await prisma.dish.create({
      data: {
        ...dishData,
        visibility: 'PUBLIC',
        authorId: null,
        ingredients: { create: ingData },
      },
    })
    console.log(`  ✅ ${created.nameRu}`)
  }

  console.log(`\n🎉 Seed complete! ${dishes.length} dishes`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
