# Коммит: Группы — фронт + бэк (incoming/pending invites)

Ветка: `main`. Затрагивает и backend, и frontend → на сервере нужен `pm2 restart mealbot-backend` И rebuild фронта.

## Что сделано

### Бэкенд (2 новых эндпоинта)

**`backend/src/routes/invites.js`:**

- **`GET /api/invites/incoming`** — мои pending приглашения по email. Возвращает `[{ token, groupId, groupName, groupType, membersCount, invitedById, invitedByName, invitedAt, expiresAt }]`. Email-матчинг case-insensitive.
- **`GET /api/groups/:id/invites`** — pending приглашения группы, доступ для **всех участников** (не только owner). Возвращает `[{ token, email, invitedById, invitedByName, invitedAt, expiresAt }]`. Используется в GroupDetailPage чтобы показать pending-rows рядом с участниками.

Оба роута расположены **перед** `GET /api/invites/:token` — чтобы express не интерпретировал `incoming` как параметр `:token`.

`POST /api/invites/:token/decline` **не делали** — отклонение через существующий `DELETE /api/groups/:id/invites/:token` (revokeInvite).

### Фронтенд API

**`frontend/src/api/index.js`:**
- `getIncomingInvites()` → `GET /invites/incoming`
- `getGroupInvites(groupId)` → `GET /groups/:id/invites`

### GroupsPage

Полностью переписана по `context/design/groups-v2.jsx`:
- Состояния: **guest** / **empty** / **list**
- Секция «Приглашения» сверху (если есть incoming) — карточки с `Принять` / `✕ Отклонить`
- Секция «Мои группы» — карточки с TypeBadge (FAMILY/REGULAR), AvatarStack, счётчиком блюд
- Owner-метка (Crown) рядом с названием группы
- FAB «+ Создать группу»
- Чип «FRIENDS» из артефакта → **REGULAR** (соответствует бэку)

### GroupDetailPage (без табов)

Полностью переписана. Раньше была с табами «Блюда / Участники», теперь всё одной простынёй:
- **Hero** — TypeBadge, название, описание, дата создания, метрики (блюд, участников)
- **Секция «Участники»** — `MemberRow` + `PendingRow` (для pending-инвайтов; крестик отозвать доступен owner'у и тому кто пригласил)
- **Кнопка «Пригласить»** в углу секции — скроллит к invite-блоку
- **InviteBlock** — joinCode (только для REGULAR, с кнопкой `Копировать`, для owner — `Сгенерировать новый код`) + email-форма (для FAMILY доступна только owner'у — бэк это и так enforce'ит)
- **Секция «Блюда группы»** (если есть) — список DishCard + кнопка «Добавить» → `/dishes/new` с groupId
- **Danger zone** внизу — для owner: «Удалить группу навсегда»; для member: «Выйти из группы»
- Меню участника (для owner): три точки → «Удалить из группы» с tap-outside

### GroupFormPage

Переписана без артефакта (по паттернам других редизайн-страниц):
- AvatarUploader (загрузка фото группы — необязательно)
- Тип группы (только при создании): radio-cards `Семейная (Home-icon)` / `Обычная (Heart-icon)` с описанием
- Pill-input «Название» (required, ошибка с AlertCircle)
- Textarea «Описание» (rounded-2xl, не pill)
- Submit «Создать группу» / «Сохранить изменения»
- Layout сам рисует back-header «Новая группа» / «Редактирование группы»

### Контекст

- `CLAUDE.md` — обновлён список готовых страниц редизайна (+Groups, GroupDetail, GroupForm)
- `context/TASKS.md` — добавлены endpoints incoming/pending в раздел Бэкенд, добавлены 3 страницы Groups в Phase A, поправлено устаревшее «REGULAR группы временно отключены» (на самом деле работают)

## Файлы

```
modified:   backend/src/routes/invites.js
modified:   frontend/src/api/index.js
modified:   frontend/src/pages/GroupsPage.jsx
modified:   frontend/src/pages/GroupDetailPage.jsx
modified:   frontend/src/pages/GroupFormPage.jsx
modified:   CLAUDE.md
modified:   context/TASKS.md
modified:   COMMIT_INSTRUCTIONS.md
new file:   context/design/groups-v2.jsx        (артефакт-источник)
```

Сборка фронта: 1850 модулей, без ошибок.
Бэкенд: `node -c backend/src/routes/invites.js` — синтаксис ок.

## Команды

```bash
cd <путь-к-mealbot>
git status                       # ожидается список выше
git branch --show-current        # main

git add backend/src/routes/invites.js \
        frontend/src/api/index.js \
        frontend/src/pages/GroupsPage.jsx \
        frontend/src/pages/GroupDetailPage.jsx \
        frontend/src/pages/GroupFormPage.jsx \
        CLAUDE.md \
        context/TASKS.md \
        context/design/groups-v2.jsx \
        context/design/brief-dish-form.md \
        COMMIT_INSTRUCTIONS.md

git commit -m "feat(groups): редизайн Groups/Detail/Form + incoming/pending invites API

Бэк:
- GET /api/invites/incoming — мои pending инвайты по email
- GET /api/groups/:id/invites — pending группы (для всех участников)

GroupsPage:
- секция «Приглашения» сверху с Принять/Отклонить
- секция «Мои группы» с TypeBadge, AvatarStack, owner-Crown
- empty с CTA «+ Создать группу», FAB

GroupDetailPage: убраны табы. Hero (TypeBadge + метрики),
Участники с pending-rows, InviteBlock (joinCode + email-форма,
без Telegram-share/QR), Danger zone.

GroupFormPage: radio-cards FAMILY/REGULAR, pill-инпуты,
аватар группы.

Контекст: TASKS.md и CLAUDE.md актуализированы (REGULAR
больше не помечены как временно отключённые)."

git push origin main
```

## На сервере

Backend изменения → нужен restart pm2:

```bash
ssh root@194.87.130.215 "cd /var/www/mealbot && git pull && pm2 restart mealbot-backend && cd frontend && npm run build 2>&1 | tail -10"
```

После рестарта проверь логи:

```bash
ssh root@194.87.130.215 "pm2 logs mealbot-backend --lines 20 --nostream"
```

## Что проверить после деплоя

### Endpoints (curl или DevTools)
- `GET /api/invites/incoming` — для залогиненного: массив pending инвайтов на твой email
- `GET /api/groups/<id>/invites` — для участника: массив pending инвайтов группы

### `/groups`
- Не залогинен → GuestBlock «Готовьте вместе»
- Залогинен, нет групп и нет приглашений → empty со средним кружком и кнопкой «+ Создать группу»
- Если у тебя есть pending invite (попроси кого-то пригласить твой email) → сверху секция «Приглашения · 1»
- Кнопка «Принять» → toast «Вы вступили в …», invite пропадает, группа появляется в списке
- Кнопка «✕» → confirm → toast «Приглашение отклонено», invite пропадает
- Карточка группы: TypeBadge (FAMILY-accent / REGULAR-sage), название, count участников + блюд, AvatarStack
- Owner-Crown рядом с названием если ты owner
- Тап карточки → `/groups/<id>`
- FAB «+ Создать группу» → `/groups/new`

### `/groups/<id>` (как owner FAMILY)
- Hero: TypeBadge, название, описание (если есть), 2 метрики (блюд, участников)
- Секция «Участники»: ты с пометкой «Это вы» сверху (с Crown если owner), потом другие
- Если есть pending → ниже список pending-rows с email и «ожидает» — ты можешь отозвать (✕)
- Меню «...» возле другого участника → «Удалить из группы»
- InviteBlock (id="invite-block"):
  - Для FAMILY: только email-форма (joinCode не показывается)
  - Для REGULAR: joinCode (с Copy-кнопкой) + ссылка «Сгенерировать новый код» + email-форма
- Email-форма: ввести → «Отправить» → toast → email появляется в pending выше
- Если есть блюда группы → секция «Блюда группы» с DishCard'ами и кнопкой «Добавить»
- Danger zone (внизу, отделено линией):
  - Owner → «Удалить группу навсегда» (red)
  - Member → «Выйти из группы» (red)

### `/groups/new` и `/groups/<id>/edit`
- Layout рисует back-header «Новая группа» / «Редактирование группы»
- AvatarUploader — Camera-иконка, кнопка «Заменить фото» / «Удалить»
- Только при создании: radio-cards Семейная (Home) / Обычная (Heart), активная подсвечена accent или sage tint
- Pill-input «Название» (с подсчётом max 60), AlertCircle при ошибке
- Textarea «Описание» (rounded-2xl, max 300)
- Submit full-width primary
- После создания → `/groups/<новый id>`

### Edge cases
- FAMILY-член (не owner) → не видит email-форму (текст «Только владелец…»), но видит joinCode и pending-список
- Если pending-инвайт отправлен мне самим → могу отозвать
- Если pending-инвайт от другого участника → могу отозвать только если я owner
