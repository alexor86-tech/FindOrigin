# Настройка Webhook для Telegram бота

## Проблема: GET 304 вместо POST запросов

Если в логах Vercel видите GET 304, это означает, что:
1. Telegram отправляет GET запросы для проверки webhook
2. Webhook может быть не настроен правильно
3. POST запросы от Telegram не доходят до сервера

## Решение

### 1. Проверьте настройку webhook в Telegram

Выполните следующие команды для проверки и настройки webhook:

```bash
# Замените YOUR_BOT_TOKEN на ваш токен бота
BOT_TOKEN="YOUR_BOT_TOKEN"
WEBHOOK_URL="https://your-domain.vercel.app/api/webhook"

# Проверить текущий webhook
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"

# Удалить старый webhook (если нужно)
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/deleteWebhook"

# Установить новый webhook
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook?url=${WEBHOOK_URL}"

# Проверить, что webhook установлен
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

### 2. Проверьте переменные окружения в Vercel

Убедитесь, что в настройках проекта Vercel установлены все необходимые переменные:

- `TELEGRAM_BOT_TOKEN` - токен бота
- `OPENAI_API_KEY` - ключ OpenAI API
- `GOOGLE_SEARCH_API_KEY` - ключ Google Search API
- `GOOGLE_SEARCH_ENGINE_ID` - ID поисковой системы

### 3. Проверьте логи в Vercel

После отправки команды `/start` боту, проверьте логи в Vercel Dashboard:
- Functions → `/api/webhook` → Logs

Вы должны увидеть:
- `Received webhook request` - когда приходит запрос
- `Webhook update` - содержимое обновления
- `Command received: /start` - когда обрабатывается команда
- `Processing message` - когда обрабатывается сообщение

### 4. Тестирование webhook

После настройки webhook, отправьте команду `/start` боту и проверьте:

1. **В логах Vercel** должны появиться записи о POST запросе
2. **Бот должен ответить** приветственным сообщением

Если бот не отвечает, проверьте:
- Правильность URL webhook (должен быть `https://your-domain.vercel.app/api/webhook`)
- Наличие переменных окружения в Vercel
- Логи на наличие ошибок

### 5. Отладка

Если проблемы сохраняются:

1. Проверьте, что webhook установлен:
```bash
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

Должен вернуться JSON с полем `url`, указывающим на ваш webhook URL.

2. Проверьте доступность webhook:
```bash
curl "https://your-domain.vercel.app/api/webhook"
```

Должен вернуться JSON: `{"status":"ok","message":"FindOrigin bot webhook is running",...}`

3. Проверьте логи в Vercel на наличие ошибок при обработке запросов.

## Важные замечания

- Webhook должен быть доступен по HTTPS
- URL должен быть публично доступным (не localhost)
- После изменения кода нужно пересобрать проект на Vercel
- Telegram может отправлять GET запросы для проверки, но обновления приходят через POST
