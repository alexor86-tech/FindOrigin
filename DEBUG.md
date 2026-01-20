# Отладка проблемы с ботом

## Webhook настроен правильно ✅

Ваш webhook настроен на: `https://find-origin-eight.vercel.app/api/webhook`

## Что проверить дальше

### 1. Проверьте переменные окружения в Vercel

Убедитесь, что в настройках проекта Vercel установлены все переменные:

1. Откройте Vercel Dashboard
2. Перейдите в Settings → Environment Variables
3. Проверьте наличие:
   - `TELEGRAM_BOT_TOKEN` - токен вашего бота
   - `OPENAI_API_KEY` - ключ OpenAI API
   - `GOOGLE_SEARCH_API_KEY` - ключ Google Search API
   - `GOOGLE_SEARCH_ENGINE_ID` - ID поисковой системы

**Важно:** После добавления/изменения переменных окружения нужно пересобрать проект!

### 2. Проверьте логи в Vercel

После отправки команды `/start` боту:

1. Откройте Vercel Dashboard
2. Перейдите в **Deployments** → выберите последний деплой
3. Откройте **Functions** → `/api/webhook` → **Logs**

Вы должны увидеть логи в таком порядке:

```
Received webhook request: { method: 'POST', url: '...' }
Webhook update: { "update_id": ..., "message": { ... } }
Processing message: { chatId: ..., messageText: '/start' }
Command received: /start
Handling /start command for chat: ...
Sending message to Telegram: { chatId: ..., textLength: ... }
Message sent successfully: { chatId: ..., messageId: ... }
```

### 3. Возможные проблемы и решения

#### Проблема: В логах нет POST запросов
**Решение:** 
- Убедитесь, что webhook установлен правильно (вы уже проверили - ✅)
- Попробуйте удалить и заново установить webhook:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://find-origin-eight.vercel.app/api/webhook"
```

#### Проблема: В логах есть ошибка "TELEGRAM_BOT_TOKEN is not set"
**Решение:**
- Добавьте переменную `TELEGRAM_BOT_TOKEN` в Vercel
- Пересоберите проект

#### Проблема: В логах есть ошибка "Telegram API error: 401"
**Решение:**
- Проверьте правильность токена бота
- Убедитесь, что токен указан без лишних пробелов

#### Проблема: В логах есть ошибка "Telegram API error: 400"
**Решение:**
- Проверьте формат данных, которые отправляются в Telegram API
- Убедитесь, что chatId является числом

### 4. Тестирование

1. Отправьте команду `/start` боту в Telegram
2. Подождите несколько секунд
3. Проверьте логи в Vercel
4. Если есть ошибки - они будут видны в логах с детальным описанием

### 5. Проверка доступности webhook

Выполните команду для проверки:
```bash
curl "https://find-origin-eight.vercel.app/api/webhook"
```

Должен вернуться JSON:
```json
{
  "status": "ok",
  "message": "FindOrigin bot webhook is running",
  "timestamp": "..."
}
```

### 6. Проверка получения обновлений

Проверьте, есть ли pending updates:
```bash
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

Если `pending_update_count` > 0, значит есть необработанные обновления. Попробуйте:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/getUpdates"
```

Это покажет последние обновления и поможет понять, доходят ли они до бота.

## Следующие шаги

1. ✅ Webhook настроен правильно
2. ⏳ Проверьте переменные окружения в Vercel
3. ⏳ Отправьте `/start` боту и проверьте логи
4. ⏳ Если есть ошибки - исправьте их согласно логам
