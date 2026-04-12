// Фабрика middleware — валидирует req.body через Zod-схему.
// При ошибке возвращает 400 с первым понятным сообщением.
module.exports = function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const msg = result.error.errors[0]?.message || 'Неверные данные'
      return res.status(400).json({ error: msg })
    }
    req.body = result.data  // используем очищенные данные (strip unknown fields)
    next()
  }
}
