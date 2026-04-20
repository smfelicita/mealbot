// Новые ингредиенты для добавления в БД
// Формат такой же, как в src/prisma/ingredients.js
// После проверки — перенести в ingredients.js и запустить сид

const newIngredients = [

  // --- ОРЕХИ И СЕМЕНА (дополнение) ---
  { name: 'pistachio',        nameRu: 'Фисташки',             category: 'nut',       protein: 20.6, fat: 45.8, carbs: 16.6, defaultQuantity: 200, defaultUnit: 'г'    },
  { name: 'macadamia',        nameRu: 'Макадамия',            category: 'nut',       protein: 7.9,  fat: 75.8, carbs: 5.2,  defaultQuantity: 150, defaultUnit: 'г'    },
  { name: 'brazil_nut',       nameRu: 'Бразильский орех',     category: 'nut',       protein: 14.3, fat: 67.1, carbs: 4.2,  defaultQuantity: 150, defaultUnit: 'г'    },
  { name: 'coconut_flakes',   nameRu: 'Кокосовая стружка',    category: 'nut',       protein: 3.3,  fat: 34.0, carbs: 15.2, defaultQuantity: 100, defaultUnit: 'г'    },
  { name: 'chia_seeds',       nameRu: 'Семена чиа',           category: 'nut',       protein: 16.5, fat: 30.7, carbs: 7.7,  defaultQuantity: 100, defaultUnit: 'г'    },
  { name: 'poppy_seeds',      nameRu: 'Мак',                  category: 'nut',       protein: 17.5, fat: 47.5, carbs: 14.0, defaultQuantity: 100, defaultUnit: 'г'    },

  // --- МОЛОЧНЫЕ (дополнение) ---
  { name: 'heavy_cream',      nameRu: 'Жирные сливки 33%',    category: 'dairy',     protein: 2.2,  fat: 33.0, carbs: 3.2,  defaultQuantity: 200, defaultUnit: 'мл'   },
  { name: 'ghee',             nameRu: 'Топлёное масло',       category: 'dairy',     protein: 0.0,  fat: 99.8, carbs: 0.0,  defaultQuantity: 200, defaultUnit: 'г'    },
  { name: 'ricotta',          nameRu: 'Рикотта',              category: 'dairy',     protein: 11.0, fat: 13.0, carbs: 3.0,  defaultQuantity: 250, defaultUnit: 'г'    },
  { name: 'mascarpone',       nameRu: 'Маскарпоне',           category: 'dairy',     protein: 4.0,  fat: 42.0, carbs: 4.0,  defaultQuantity: 250, defaultUnit: 'г'    },
  { name: 'goat_cheese',      nameRu: 'Козий сыр',            category: 'dairy',     protein: 21.6, fat: 21.0, carbs: 0.0,  defaultQuantity: 150, defaultUnit: 'г'    },
  { name: 'brie',             nameRu: 'Бри',                  category: 'dairy',     protein: 20.0, fat: 28.0, carbs: 0.5,  defaultQuantity: 125, defaultUnit: 'г'    },
  { name: 'cheddar',          nameRu: 'Чеддер',               category: 'dairy',     protein: 24.9, fat: 33.1, carbs: 1.3,  defaultQuantity: 200, defaultUnit: 'г'    },
  { name: 'coconut_milk',     nameRu: 'Кокосовое молоко',     category: 'dairy',     protein: 2.3,  fat: 24.0, carbs: 6.0,  defaultQuantity: 400, defaultUnit: 'мл'   },

  // --- МЯСО (дополнение) ---
  { name: 'duck',             nameRu: 'Утка',                 category: 'meat',      protein: 16.0, fat: 38.0, carbs: 0.0,  defaultQuantity: 1,   defaultUnit: 'кг'   },
  { name: 'rabbit',           nameRu: 'Кролик',               category: 'meat',      protein: 21.0, fat: 11.0, carbs: 0.0,  defaultQuantity: 1,   defaultUnit: 'кг'   },
  { name: 'veal',             nameRu: 'Телятина',             category: 'meat',      protein: 20.0, fat: 2.0,  carbs: 0.0,  defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'chicken_drumstick',nameRu: 'Куриная голень',       category: 'meat',      protein: 20.0, fat: 9.0,  carbs: 0.0,  defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'chicken_liver',    nameRu: 'Куриная печень',       category: 'meat',      protein: 20.4, fat: 5.9,  carbs: 0.7,  defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'beef_liver',       nameRu: 'Говяжья печень',       category: 'meat',      protein: 17.9, fat: 3.7,  carbs: 5.3,  defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'sausages',         nameRu: 'Сосиски',              category: 'meat',      protein: 11.0, fat: 28.0, carbs: 1.0,  defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'salami',           nameRu: 'Салями',               category: 'meat',      protein: 22.0, fat: 40.0, carbs: 1.0,  defaultQuantity: 200, defaultUnit: 'г'    },

  // --- РЫБА (дополнение) ---
  { name: 'trout',            nameRu: 'Форель',               category: 'fish',      protein: 19.5, fat: 6.5,  carbs: 0.0,  defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'sardine',          nameRu: 'Сардина',              category: 'fish',      protein: 19.8, fat: 10.5, carbs: 0.0,  defaultQuantity: 300, defaultUnit: 'г'    },
  { name: 'anchovy',          nameRu: 'Анчоусы',              category: 'fish',      protein: 20.0, fat: 4.8,  carbs: 0.0,  defaultQuantity: 100, defaultUnit: 'г'    },
  { name: 'carp',             nameRu: 'Карп',                 category: 'fish',      protein: 18.0, fat: 5.3,  carbs: 0.0,  defaultQuantity: 1,   defaultUnit: 'кг'   },
  { name: 'scallop',          nameRu: 'Морской гребешок',     category: 'fish',      protein: 17.0, fat: 0.9,  carbs: 3.3,  defaultQuantity: 300, defaultUnit: 'г'    },
  { name: 'octopus',          nameRu: 'Осьминог',             category: 'fish',      protein: 18.2, fat: 2.1,  carbs: 3.7,  defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'canned_salmon',    nameRu: 'Лосось консервированный', category: 'canned', protein: 20.0, fat: 8.0,  carbs: 0.0,  defaultQuantity: 185, defaultUnit: 'г'    },

  // --- ОВОЩИ (дополнение) ---
  { name: 'red_onion',        nameRu: 'Красный лук',          category: 'vegetable', protein: 1.4,  fat: 0.0,  carbs: 8.2,  avgWeightG: 150, defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'shallot',          nameRu: 'Шалот',                category: 'vegetable', protein: 2.5,  fat: 0.1,  carbs: 16.8, avgWeightG: 50,  defaultQuantity: 200, defaultUnit: 'г'    },
  { name: 'chili_pepper',     nameRu: 'Перец чили',           category: 'vegetable', protein: 2.0,  fat: 0.2,  carbs: 9.5,  avgWeightG: 15,  defaultQuantity: 3,   defaultUnit: 'шт'   },
  { name: 'fennel',           nameRu: 'Фенхель',              category: 'vegetable', protein: 1.2,  fat: 0.2,  carbs: 7.3,                   defaultQuantity: 1,   defaultUnit: 'шт'   },
  { name: 'brussels_sprouts', nameRu: 'Брюссельская капуста', category: 'vegetable', protein: 3.4,  fat: 0.3,  carbs: 5.2,                   defaultQuantity: 400, defaultUnit: 'г'    },
  { name: 'jerusalem_artichoke', nameRu: 'Топинамбур',        category: 'vegetable', protein: 2.1,  fat: 0.1,  carbs: 16.0, avgWeightG: 80,  defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'daikon',           nameRu: 'Дайкон',               category: 'vegetable', protein: 0.6,  fat: 0.1,  carbs: 4.1,                   defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'pak_choi',         nameRu: 'Пак-чой',              category: 'vegetable', protein: 1.5,  fat: 0.2,  carbs: 2.2,                   defaultQuantity: 300, defaultUnit: 'г'    },
  { name: 'kohlrabi',         nameRu: 'Кольраби',             category: 'vegetable', protein: 2.8,  fat: 0.1,  carbs: 3.8,                   defaultQuantity: 2,   defaultUnit: 'шт'   },
  { name: 'iceberg_lettuce',  nameRu: 'Айсберг',              category: 'vegetable', protein: 0.9,  fat: 0.1,  carbs: 2.0,                   defaultQuantity: 1,   defaultUnit: 'шт'   },

  // --- ФРУКТЫ (дополнение) ---
  { name: 'plum',             nameRu: 'Слива',                category: 'fruit',     protein: 0.7,  fat: 0.3,  carbs: 11.3, avgWeightG: 60,  defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'apricot',          nameRu: 'Абрикос',              category: 'fruit',     protein: 0.9,  fat: 0.1,  carbs: 9.0,  avgWeightG: 40,  defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'fig',              nameRu: 'Инжир',                category: 'fruit',     protein: 0.7,  fat: 0.2,  carbs: 12.4, avgWeightG: 50,  defaultQuantity: 300, defaultUnit: 'г'    },
  { name: 'dates',            nameRu: 'Финики',               category: 'fruit',     protein: 2.5,  fat: 0.5,  carbs: 69.2,                  defaultQuantity: 200, defaultUnit: 'г'    },
  { name: 'grapefruit',       nameRu: 'Грейпфрут',           category: 'fruit',     protein: 0.7,  fat: 0.2,  carbs: 6.5,  avgWeightG: 300, defaultQuantity: 3,   defaultUnit: 'шт'   },
  { name: 'tangerine',        nameRu: 'Мандарин',             category: 'fruit',     protein: 0.8,  fat: 0.2,  carbs: 7.5,  avgWeightG: 80,  defaultQuantity: 1,   defaultUnit: 'кг'   },
  { name: 'quince',           nameRu: 'Айва',                 category: 'fruit',     protein: 0.6,  fat: 0.5,  carbs: 8.9,  avgWeightG: 250, defaultQuantity: 3,   defaultUnit: 'шт'   },
  { name: 'currant',          nameRu: 'Смородина',            category: 'fruit',     protein: 1.0,  fat: 0.2,  carbs: 7.3,                   defaultQuantity: 300, defaultUnit: 'г'    },
  { name: 'gooseberry',       nameRu: 'Крыжовник',            category: 'fruit',     protein: 0.7,  fat: 0.2,  carbs: 9.1,                   defaultQuantity: 300, defaultUnit: 'г'    },
  { name: 'cranberry',        nameRu: 'Клюква',               category: 'fruit',     protein: 0.5,  fat: 0.2,  carbs: 4.8,                   defaultQuantity: 300, defaultUnit: 'г'    },
  { name: 'passion_fruit',    nameRu: 'Маракуйя',             category: 'fruit',     protein: 2.2,  fat: 0.7,  carbs: 11.2, avgWeightG: 35,  defaultQuantity: 5,   defaultUnit: 'шт'   },
  { name: 'papaya',           nameRu: 'Папайя',               category: 'fruit',     protein: 0.6,  fat: 0.1,  carbs: 9.8,  avgWeightG: 500, defaultQuantity: 1,   defaultUnit: 'шт'   },

  // --- КРУПЫ (дополнение) ---
  { name: 'quinoa',           nameRu: 'Киноа',                category: 'grain',     protein: 14.1, fat: 6.1,  carbs: 57.2, defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'rye_flour',        nameRu: 'Ржаная мука',          category: 'grain',     protein: 8.9,  fat: 1.7,  carbs: 61.8, defaultQuantity: 1,   defaultUnit: 'кг'   },
  { name: 'rice_flour',       nameRu: 'Рисовая мука',         category: 'grain',     protein: 7.0,  fat: 0.5,  carbs: 80.0, defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'almond_flour',     nameRu: 'Миндальная мука',      category: 'grain',     protein: 21.0, fat: 50.0, carbs: 7.0,  defaultQuantity: 200, defaultUnit: 'г'    },
  { name: 'lasagna_sheets',   nameRu: 'Листы для лазаньи',    category: 'grain',     protein: 13.0, fat: 1.5,  carbs: 72.0, defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'rice_noodles',     nameRu: 'Рисовая лапша',        category: 'grain',     protein: 3.5,  fat: 0.6,  carbs: 25.0, defaultQuantity: 300, defaultUnit: 'г'    },
  { name: 'egg_noodles',      nameRu: 'Яичная лапша',         category: 'grain',     protein: 12.0, fat: 3.5,  carbs: 68.0, defaultQuantity: 300, defaultUnit: 'г'    },

  // --- БОБОВЫЕ (дополнение) ---
  { name: 'black_beans',      nameRu: 'Чёрная фасоль',        category: 'legume',    protein: 21.6, fat: 0.9,  carbs: 47.5, defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'edamame',          nameRu: 'Эдамаме',              category: 'legume',    protein: 11.9, fat: 5.2,  carbs: 7.6,  defaultQuantity: 300, defaultUnit: 'г'    },
  { name: 'mung_beans',       nameRu: 'Маш',                  category: 'legume',    protein: 23.9, fat: 1.2,  carbs: 44.3, defaultQuantity: 500, defaultUnit: 'г'    },
  { name: 'tofu',             nameRu: 'Тофу',                 category: 'legume',    protein: 8.1,  fat: 4.8,  carbs: 1.9,  defaultQuantity: 400, defaultUnit: 'г'    },

  // --- СОУСЫ (дополнение) ---
  { name: 'balsamic_vinegar', nameRu: 'Бальзамический уксус', category: 'sauce',     protein: 0.5,  fat: 0.0,  carbs: 17.0, defaultQuantity: 250, defaultUnit: 'мл'   },
  { name: 'fish_sauce',       nameRu: 'Рыбный соус',          category: 'sauce',     protein: 5.0,  fat: 0.0,  carbs: 3.6,  defaultQuantity: 200, defaultUnit: 'мл'   },
  { name: 'oyster_sauce',     nameRu: 'Устричный соус',       category: 'sauce',     protein: 1.5,  fat: 0.3,  carbs: 11.0, defaultQuantity: 200, defaultUnit: 'мл'   },
  { name: 'tahini',           nameRu: 'Тахини',               category: 'sauce',     protein: 17.0, fat: 53.0, carbs: 12.0, defaultQuantity: 200, defaultUnit: 'г'    },
  { name: 'bbq_sauce',        nameRu: 'Соус барбекю',         category: 'sauce',     protein: 1.2,  fat: 0.2,  carbs: 24.0, defaultQuantity: 350, defaultUnit: 'мл'   },
  { name: 'cream_sauce',      nameRu: 'Сливочный соус',       category: 'sauce',     protein: 2.5,  fat: 14.0, carbs: 4.0,  defaultQuantity: 200, defaultUnit: 'мл'   },
  { name: 'white_wine',       nameRu: 'Белое вино (для готовки)', category: 'sauce', protein: 0.1,  fat: 0.0,  carbs: 2.6,  defaultQuantity: 750, defaultUnit: 'мл'   },
  { name: 'chicken_broth',    nameRu: 'Куриный бульон',       category: 'sauce',     protein: 1.5,  fat: 0.5,  carbs: 0.3,  defaultQuantity: 1,   defaultUnit: 'л'    },
  { name: 'beef_broth',       nameRu: 'Говяжий бульон',       category: 'sauce',     protein: 1.8,  fat: 0.5,  carbs: 0.1,  defaultQuantity: 1,   defaultUnit: 'л'    },

  // --- СПЕЦИИ (дополнение) ---
  { name: 'cardamom',         nameRu: 'Кардамон',             category: 'spice',     protein: 10.8, fat: 6.7,  carbs: 68.5,                 ignoreInFridgeFilter: true },
  { name: 'star_anise',       nameRu: 'Бадьян',               category: 'spice',     protein: 17.6, fat: 16.0, carbs: 50.0,                 ignoreInFridgeFilter: true },
  { name: 'saffron',          nameRu: 'Шафран',               category: 'spice',     protein: 11.4, fat: 5.9,  carbs: 65.4,                 ignoreInFridgeFilter: true },
  { name: 'white_pepper',     nameRu: 'Белый перец',          category: 'spice',     protein: 10.4, fat: 2.1,  carbs: 68.6,                 ignoreInFridgeFilter: true },
  { name: 'chili_flakes',     nameRu: 'Хлопья чили',          category: 'spice',     protein: 12.0, fat: 17.3, carbs: 34.8,                 ignoreInFridgeFilter: true },
  { name: 'smoked_paprika',   nameRu: 'Копчёная паприка',     category: 'spice',     protein: 14.8, fat: 12.9, carbs: 53.9,                 ignoreInFridgeFilter: true },
  { name: 'garlic_powder',    nameRu: 'Чесночный порошок',    category: 'spice',     protein: 16.6, fat: 0.7,  carbs: 72.7,                 ignoreInFridgeFilter: true },
  { name: 'dried_basil',      nameRu: 'Базилик сушёный',      category: 'spice',     protein: 22.9, fat: 4.1,  carbs: 47.8,                 ignoreInFridgeFilter: true },
  { name: 'italian_herbs',    nameRu: 'Итальянские травы',    category: 'spice',     protein: 10.0, fat: 5.0,  carbs: 50.0,                 ignoreInFridgeFilter: true },

  // --- ХЛЕБ (дополнение) ---
  { name: 'rye_bread',        nameRu: 'Ржаной хлеб',          category: 'bread',     protein: 6.6,  fat: 1.2,  carbs: 34.2, defaultQuantity: 1,   defaultUnit: 'шт'   },
  { name: 'crispbread',       nameRu: 'Хлебцы',               category: 'bread',     protein: 10.0, fat: 1.0,  carbs: 72.0, defaultQuantity: 200, defaultUnit: 'г'    },
  { name: 'tortilla',         nameRu: 'Тортилья',             category: 'bread',     protein: 8.0,  fat: 5.0,  carbs: 50.0, defaultQuantity: 8,   defaultUnit: 'шт'   },
  { name: 'phyllo_dough',     nameRu: 'Тесто фило',           category: 'bread',     protein: 8.0,  fat: 1.0,  carbs: 55.0, defaultQuantity: 400, defaultUnit: 'г'    },

  // --- СЛАДКОЕ (дополнение) ---
  { name: 'white_chocolate',  nameRu: 'Белый шоколад',        category: 'sweetener', protein: 5.9,  fat: 32.1, carbs: 59.3, defaultQuantity: 100, defaultUnit: 'г'    },
  { name: 'milk_chocolate',   nameRu: 'Молочный шоколад',     category: 'sweetener', protein: 6.9,  fat: 35.7, carbs: 52.4, defaultQuantity: 100, defaultUnit: 'г'    },
  { name: 'agave_syrup',      nameRu: 'Сироп агавы',          category: 'sweetener', protein: 0.0,  fat: 0.5,  carbs: 76.0, defaultQuantity: 250, defaultUnit: 'мл'   },
  { name: 'caramel',          nameRu: 'Карамель',             category: 'sweetener', protein: 0.3,  fat: 0.1,  carbs: 77.0, defaultQuantity: 200, defaultUnit: 'г'    },
  { name: 'gelatin',          nameRu: 'Желатин',              category: 'sweetener', protein: 87.2, fat: 0.4,  carbs: 0.7,  defaultQuantity: 50,  defaultUnit: 'г'    },
  { name: 'agar_agar',        nameRu: 'Агар-агар',            category: 'sweetener', protein: 0.0,  fat: 0.0,  carbs: 0.0,  defaultQuantity: 30,  defaultUnit: 'г'    },

]

module.exports = { newIngredients }
