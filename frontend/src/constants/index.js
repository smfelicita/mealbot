export const UNITS = ['г', 'кг', 'мл', 'л', 'шт', 'зубчик', 'пучок', 'щепотка', 'ст.л.', 'ч.л.']

export const DISH_CATEGORIES = [
  { value: 'SOUP',    label: 'Суп'      },
  { value: 'SALAD',   label: 'Салат'    },
  { value: 'MAIN',    label: 'Основное' },
  { value: 'SIDE',    label: 'Гарнир'   },
  { value: 'DESSERT', label: 'Десерт'   },
  { value: 'DRINK',   label: 'Напиток'  },
  { value: 'BAKERY',  label: 'Выпечка'  },
  { value: 'SAUCE',   label: 'Соус'     },
]

export const MEAL_TIMES = [
  { value: 'BREAKFAST', label: 'Утро'    },
  { value: 'LUNCH',     label: 'Обед'    },
  { value: 'DINNER',    label: 'Вечер'   },
  { value: 'SNACK',     label: 'Перекус' },
  { value: 'ANYTIME',   label: 'Любое'   },
]

export const DIFFICULTIES = [
  { value: 'easy',   label: 'Легко'  },
  { value: 'medium', label: 'Средне' },
  { value: 'hard',   label: 'Сложно' },
]

export const CUISINES = [
  'Русская', 'Итальянская', 'Азиатская', 'Средиземноморская',
  'Греческая', 'Французская', 'Мексиканская', 'Японская',
  'Индийская', 'Европейская', 'Американская',
]

export const ING_CATEGORIES = [
  { value: 'dairy',     label: 'Молочное' },
  { value: 'meat',      label: 'Мясо'     },
  { value: 'fish',      label: 'Рыба'     },
  { value: 'vegetable', label: 'Овощи'    },
  { value: 'fruit',     label: 'Фрукты'   },
  { value: 'grain',     label: 'Злаки'    },
  { value: 'legume',    label: 'Бобовые'  },
  { value: 'egg',       label: 'Яйца'     },
  { value: 'bread',     label: 'Хлеб'     },
  { value: 'oil',       label: 'Масла'    },
  { value: 'sauce',     label: 'Соусы'    },
  { value: 'spice',     label: 'Специи'   },
  { value: 'herb',      label: 'Зелень'   },
  { value: 'nut',       label: 'Орехи'    },
  { value: 'sweetener', label: 'Сладкое'  },
  { value: 'canned',    label: 'Консервы' },
  { value: 'other',     label: 'Другое'   },
]

export const VISIBILITY_OPTIONS = [
  { value: 'PRIVATE',    label: 'Личный',          desc: 'Только вы'                        },
  { value: 'PUBLIC',     label: 'Публичный',       desc: 'Все пользователи'                  },
  { value: 'FAMILY',     label: 'Семья',           desc: 'Только участники семейной группы' },
  { value: 'ALL_GROUPS', label: 'Все мои группы',  desc: 'Участники всех ваших групп'       },
]

export const PLAN_MEAL_TYPES = [
  { value: 'BREAKFAST', label: '🌅 Завтрак'      },
  { value: 'LUNCH',     label: '☀️ Обед'          },
  { value: 'DINNER',    label: '🌙 Ужин'          },
  { value: 'SNACK',     label: '🍎 Перекус'       },
  { value: 'ANYTIME',   label: '🍽 Когда угодно'  },
]
