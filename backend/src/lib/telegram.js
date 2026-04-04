/**
 * Отправка сообщений через Telegram Bot API (используется для уведомлений)
 */

async function sendTelegramMessage(telegramId, text) {
  if (!telegramId || !process.env.TELEGRAM_BOT_TOKEN) return
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: telegramId, text, parse_mode: 'Markdown' }),
    })
  } catch (e) {
    console.error('[tg notify]', e.message)
  }
}

module.exports = { sendTelegramMessage }
