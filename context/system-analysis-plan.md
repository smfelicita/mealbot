# План анализа нагрузки и затрат

Цель: не делать анализ сейчас, а определить **как** анализировать каждую систему.
Каждый блок — самостоятельный анализ, запускается по необходимости или перед масштабированием.

---

## 1. VPS — CPU, RAM, диск

**Когда делать:** при жалобах на тормоза, перед ростом нагрузки, раз в месяц.

**Что собирать:**
```bash
# Общая картина
top -bn1 | head -20
free -h
df -h

# PM2 — потребление по процессам
pm2 status
pm2 monit

# Пики за последние часы (если установлен sysstat)
sar -u 1 5       # CPU
sar -r 1 5       # RAM

# Кто ест больше всего
ps aux --sort=-%cpu | head -10
ps aux --sort=-%mem | head -10
```

**На что смотреть:**
- CPU > 70% в покое → проблема
- RAM > 80% → риск swap
- Диск > 80% → чистить логи / старые сборки

---

## 2. PostgreSQL (Supabase) — соединения и запросы

**Когда делать:** при ошибках БД, при росте числа пользователей.

**Что собирать:**

В Supabase Dashboard → **Reports** → Database:
- Active connections (лимит Session Pooler — 200)
- Query performance (slow queries)
- Cache hit rate (должен быть > 95%)

Или через прямой SQL (подключиться через psql / DBeaver):
```sql
-- Активные соединения
SELECT count(*), state FROM pg_stat_activity GROUP BY state;

-- Самые медленные запросы
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Таблицы без индексов с seq scan
SELECT relname, seq_scan, idx_scan
FROM pg_stat_user_tables
ORDER BY seq_scan DESC
LIMIT 10;

-- Размер таблиц
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

**На что смотреть:**
- `seq_scan` высокий на большой таблице → нужен индекс
- `mean_exec_time` > 100ms → оптимизировать запрос
- Соединений > 150 → пора смотреть на connection pooling

---

## 3. Claude API — токены и стоимость

**Когда делать:** перед включением ИИ-помощника для пользователей, раз в неделю после включения.

**Что собирать:**

В Anthropic Console → **Usage**:
- Токены за период (input / output отдельно)
- Стоимость по дням
- Запросы по моделям

Локально — добавить логирование в `backend/src/routes/chat.js`:
```js
logger.info({
  action: 'ai_request',
  model: response.model,
  inputTokens: response.usage.input_tokens,
  outputTokens: response.usage.output_tokens,
  userId: req.userId,
  requestId: req.requestId,
})
```

Затем агрегировать из PM2 логов:
```bash
# Сколько токенов за сегодня
pm2 logs mealbot-backend --lines 5000 | grep '"action":"ai_request"' | \
  node -e "
    const lines = require('fs').readFileSync('/dev/stdin','utf8').split('\n').filter(Boolean)
    let inp=0, out=0
    lines.forEach(l => { try { const d=JSON.parse(l.match(/\{.*\}/)[0]); inp+=d.inputTokens||0; out+=d.outputTokens||0 } catch{} })
    console.log('Input:', inp, 'Output:', out, 'Est. cost $:', ((inp*3+out*15)/1e6).toFixed(4))
  "
```

**Ориентиры по стоимости (claude-sonnet-4-6):**
| Токены | Примерная стоимость |
|---|---|
| 1M input | $3 |
| 1M output | $15 |
| Средний чат-запрос | ~800 input + ~300 output ≈ $0.007 |
| 1000 запросов/день | ~$7/день |

**На что смотреть:**
- Средний размер контекста на запрос (растёт → обрезать историю)
- Output / Input ratio (> 0.5 → ИИ много пишет, можно ограничить max_tokens)
- Аномальные пики (один пользователь делает 100+ запросов)

---

## 4. Backend API — запросы и ошибки

**Когда делать:** при жалобах, раз в неделю.

**Что собирать:**
```bash
# Последние ошибки 5xx
pm2 logs mealbot-backend --lines 2000 | grep '"level":50'

# Топ эндпоинтов по количеству запросов
pm2 logs mealbot-backend --lines 5000 | grep '"method"' | \
  grep -oP '"path":"[^"]*"' | sort | uniq -c | sort -rn | head -20

# Медленные запросы (если логируем duration)
pm2 logs mealbot-backend --lines 5000 | grep '"duration"' | \
  node -e "
    const lines = require('fs').readFileSync('/dev/stdin','utf8').split('\n')
    lines.forEach(l => { try { const d=JSON.parse(l.match(/\{.*\}/)[0]); if(d.duration>500) console.log(d.duration+'ms', d.method, d.path) } catch{} })
  " | sort -rn | head -20

# Rate limit срабатывания
pm2 logs mealbot-backend --lines 5000 | grep '429'
```

**На что смотреть:**
- 5xx > 1% запросов → критично
- Запросы > 500ms → оптимизировать
- Частые 429 → пересмотреть лимиты или добавить кэш

---

## 5. Frontend — размер бандла и загрузка

**Когда делать:** после крупных изменений в зависимостях, перед релизом.

**Что собирать:**
```bash
cd frontend
npm run build 2>&1 | grep -E "dist|kB|gzip"

# Детальный анализ бандла (если нужно)
npx vite-bundle-visualizer
```

**На что смотреть:**
- Общий бандл > 500 kB gzip → искать что можно lazy-load
- Один чанк > 200 kB → разбить на части
- Новые зависимости > 50 kB → найти альтернативу

---

## Порядок запуска анализов

| Приоритет | Анализ | Когда |
|---|---|---|
| 1 | Claude API — токены и стоимость | Перед включением ИИ для пользователей |
| 2 | VPS — CPU/RAM | При первых признаках тормозов |
| 3 | Backend API — ошибки и медленные запросы | Раз в неделю после запуска |
| 4 | PostgreSQL — соединения и slow queries | При росте > 100 активных пользователей |
| 5 | Frontend — бандл | После крупных обновлений зависимостей |
