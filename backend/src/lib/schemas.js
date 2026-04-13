const { z } = require('zod')

// ─── Общие переиспользуемые части ────────────────────────────────────────────

const DISH_CATEGORIES = ['SOUP', 'SALAD', 'MAIN', 'SIDE', 'DESSERT', 'DRINK', 'BAKERY', 'SAUCE']
const MEAL_TYPES      = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'ANYTIME']
const DISH_VISIBILITY = ['PRIVATE', 'PUBLIC', 'FAMILY', 'ALL_GROUPS']
const DIFFICULTIES    = ['easy', 'medium', 'hard']

// ─── Groups ───────────────────────────────────────────────────────────────────

const groupCreate = z.object({
  name:        z.string({ required_error: 'Укажите название' })
               .trim().min(1, 'Название не может быть пустым').max(100, 'Название не более 100 символов'),
  description: z.string().trim().max(500, 'Описание не более 500 символов').optional().nullable(),
  avatarUrl:   z.string().url('Некорректный URL аватара').optional().nullable().or(z.literal('')),
  type:        z.enum(['FAMILY', 'REGULAR']).default('FAMILY'),
})

const groupUpdate = z.object({
  name:        z.string().trim().min(1, 'Название не может быть пустым').max(100, 'Название не более 100 символов').optional(),
  description: z.string().trim().max(500, 'Описание не более 500 символов').optional().nullable(),
  avatarUrl:   z.string().url('Некорректный URL аватара').optional().nullable().or(z.literal('')),
})

// ─── Dishes ───────────────────────────────────────────────────────────────────

const ingredientInput = z.object({
  id:          z.string().min(1),
  amount:      z.string().max(50).optional().nullable(),
  amountValue: z.number().positive().optional().nullable(),
  unit:        z.string().max(20).optional().nullable(),
  toTaste:     z.boolean().optional(),
  optional:    z.boolean().optional(),
})

const dishCreate = z.object({
  nameRu:      z.string({ required_error: 'Укажите название' })
               .trim().min(1, 'Название не может быть пустым').max(200, 'Название не более 200 символов'),
  description: z.string().trim().max(2000, 'Описание не более 2000 символов').optional().nullable(),
  categories:  z.array(z.enum(DISH_CATEGORIES, { message: 'Неверная категория' }))
               .min(1, 'Укажите хотя бы одну категорию').max(5),
  mealTime:    z.array(z.enum(MEAL_TYPES, { message: 'Неверное время приёма пищи' }))
               .min(1, 'Укажите время приёма пищи').max(5),
  visibility:  z.enum(DISH_VISIBILITY, { message: 'Неверная видимость' }).default('PRIVATE'),
  cuisine:     z.string().trim().max(100).optional().nullable(),
  tags:        z.array(z.string().trim().max(50)).max(20).optional(),
  cookTime:    z.number().int().min(1).max(1440).optional().nullable(),
  difficulty:  z.enum(DIFFICULTIES, { message: 'Неверная сложность' }).optional().nullable()
               .or(z.literal('').transform(() => null)),
  calories:    z.number().int().min(0).max(10000).optional().nullable(),
  imageUrl:    z.string().url('Некорректный URL изображения').optional().nullable().or(z.literal('')),
  images:      z.array(z.string().url()).max(10).optional(),
  videoUrl:    z.string().url('Некорректный URL видео').optional().nullable().or(z.literal('')),
  recipe:      z.string().trim().max(20000, 'Рецепт не более 20 000 символов').optional().nullable(),
  ingredients: z.array(ingredientInput).max(50).optional(),
})

const dishUpdate = dishCreate.partial()

const dishBulk = z.object({
  names: z.array(
    z.string().trim().min(1, 'Название не может быть пустым').max(200)
  ).min(1, 'Укажите хотя бы одно название').max(50, 'Не более 50 блюд за раз'),
})

// ─── Invites ─────────────────────────────────────────────────────────────────

const inviteCreate = z.object({
  email: z.string({ required_error: 'Укажите email' })
         .trim().email('Некорректный email').max(255),
})

// ─── Auth ─────────────────────────────────────────────────────────────────────

const authRegister = z.object({
  email:    z.string({ required_error: 'Укажите email' }).trim().email('Некорректный email').max(255),
  password: z.string({ required_error: 'Укажите пароль' }).min(6, 'Пароль не менее 6 символов').max(100),
  name:     z.string().trim().min(1).max(100).optional(),
})

const authLogin = z.object({
  email:    z.string({ required_error: 'Укажите email' }).trim().email('Некорректный email').max(255),
  password: z.string({ required_error: 'Укажите пароль' }).min(1, 'Укажите пароль').max(100),
})

// ─── Comments ─────────────────────────────────────────────────────────────────

const commentCreate = z.object({
  dishId:  z.string({ required_error: 'Укажите dishId' }).min(1),
  content: z.string({ required_error: 'Укажите текст комментария' })
           .trim().min(1, 'Комментарий не может быть пустым').max(1000, 'Не более 1000 символов'),
})

// ─── Fridge ───────────────────────────────────────────────────────────────────

const fridgeItemAdd = z.object({
  ingredientId:  z.string({ required_error: 'ingredientId обязателен' }).min(1),
  expiresAt:     z.string().datetime({ offset: true }).optional().nullable().or(z.literal('')),
  quantityValue: z.number().positive('Количество должно быть положительным').optional().nullable(),
  quantityUnit:  z.string().trim().max(20).optional().nullable(),
})

const fridgeBulk = z.object({
  ingredientIds: z.array(z.string().min(1)).min(1, 'Укажите хотя бы один продукт').max(100),
})

const fridgePatch = z.object({
  quantityValue: z.number().positive('Количество должно быть положительным').optional().nullable(),
  quantityUnit:  z.string().trim().max(20).optional().nullable(),
})

// ─── Meal Plans ───────────────────────────────────────────────────────────────

const mealPlanCreate = z.object({
  dishId:   z.string({ required_error: 'dishId обязателен' }).min(1),
  mealType: z.enum(MEAL_TYPES, { message: 'Неверный тип приёма пищи' }).default('ANYTIME'),
  date:     z.string().datetime({ offset: true }).optional().nullable().or(z.literal('')),
  note:     z.string().trim().max(500, 'Заметка не более 500 символов').optional().nullable(),
  shared:   z.boolean().optional().default(false),
})

module.exports = {
  groupCreate,
  groupUpdate,
  dishCreate,
  dishUpdate,
  dishBulk,
  inviteCreate,
  commentCreate,
  authRegister,
  authLogin,
  fridgeItemAdd,
  fridgeBulk,
  fridgePatch,
  mealPlanCreate,
}
