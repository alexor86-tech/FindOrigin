# FindOrigin

Telegram-бот для поиска источников информации в текстах и Telegram-постах.

## Описание

FindOrigin — это Telegram-бот, который получает текст или ссылку на пост и пытается найти источник этой информации. Бот использует Google Search API для поиска источников и OpenAI GPT-4o-mini для анализа релевантности найденных источников, сравнивая смысл текста, а не буквальные совпадения.

## Технологии

- **Next.js 15** - React фреймворк с App Router
- **TypeScript** - Типизированный JavaScript
- **Vercel** - Платформа для деплоя
- **Telegram Bot API** - API для работы с Telegram
- **Telegram Mini App** - UI-слой для бота
- **@twa-dev/sdk** - SDK для работы с Telegram Web App API
- **Google Custom Search API** - Поиск источников информации
- **OpenAI GPT-4o-mini** - AI-анализ релевантности источников

## Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd FindOrigin
```

2. Установите зависимости:
```bash
npm install
```

3. Создайте файл `.env.local` на основе `.env.local.example`:
```bash
cp .env.local.example .env.local
```

4. Заполните переменные окружения в `.env.local`:
   - `TELEGRAM_BOT_TOKEN` - Получите токен бота у [@BotFather](https://t.me/BotFather)
   - `OPENAI_API_KEY` - API ключ OpenAI (получите на [platform.openai.com](https://platform.openai.com/api-keys))
   - `GOOGLE_SEARCH_API_KEY` - API ключ Google Custom Search
   - `GOOGLE_SEARCH_ENGINE_ID` - ID поисковой системы Google Custom Search

## Настройка API

### OpenAI API

1. Перейдите на [OpenAI Platform](https://platform.openai.com/)
2. Зарегистрируйтесь или войдите в аккаунт
3. Перейдите в раздел [API Keys](https://platform.openai.com/api-keys)
4. Создайте новый API ключ
5. Скопируйте ключ в `.env.local` как `OPENAI_API_KEY`

### Google Custom Search API

1. Перейдите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Custom Search API
4. Создайте API ключ в разделе "Credentials"
5. Перейдите на [Google Custom Search](https://programmablesearchengine.google.com/)
6. Создайте новую поисковую систему
7. Скопируйте Search Engine ID

## Запуск

### Локальная разработка

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:3000`

### Продакшн

```bash
npm run build
npm start
```

## Настройка Webhook для Telegram

После деплоя на Vercel:

1. Получите URL вашего webhook: `https://your-domain.vercel.app/api/webhook`
2. Установите webhook через Telegram Bot API:
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-domain.vercel.app/api/webhook"
```

Или используйте браузер:
```
https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-domain.vercel.app/api/webhook
```

## Настройка Telegram Mini App

После деплоя на Vercel:

1. Получите URL вашего Mini App: `https://your-domain.vercel.app/tma`
2. Откройте [@BotFather](https://t.me/BotFather) в Telegram
3. Отправьте команду `/newapp` или выберите вашего бота и нажмите "Edit Bot" → "Bot Settings" → "Menu Button"
4. Укажите:
   - **Title**: FindOrigin
   - **Description**: Найти источники информации
   - **Photo**: (опционально) загрузите иконку
   - **Web App URL**: `https://your-domain.vercel.app/tma`
5. Сохраните настройки

Теперь пользователи смогут открыть Mini App через кнопку меню в вашем боте.

## Использование

### Через Telegram Bot

1. Найдите вашего бота в Telegram
2. Отправьте команду `/start` для начала работы
3. Отправьте текст с информацией или ссылку на Telegram-пост
4. Бот проанализирует текст и вернет список найденных источников

### Через Telegram Mini App

1. Найдите вашего бота в Telegram
2. Откройте Mini App через кнопку меню или команду
3. Введите текст или ссылку на Telegram-пост в поле ввода
4. Нажмите "Найти источники"
5. Просмотрите результаты с оценкой уверенности

### Команды

- `/start` - Начать работу с ботом
- `/help` - Показать справку по использованию

## Структура проекта

```
FindOrigin/
├── app/
│   ├── api/
│   │   ├── tma/
│   │   │   └── route.ts           # API endpoint для Telegram Mini App
│   │   └── webhook/
│   │       └── route.ts           # Webhook endpoint для Telegram
│   ├── tma/
│   │   └── page.tsx                # Страница Telegram Mini App
│   ├── layout.tsx                  # Корневой layout
│   └── page.tsx                    # Главная страница
├── lib/
│   ├── ai/
│   │   └── openai.ts              # OpenAI API для анализа релевантности
│   ├── telegram/
│   │   ├── api.ts                 # Telegram Bot API клиент
│   │   ├── commands.ts            # Обработчики команд
│   │   ├── processor.ts           # Логика обработки сообщений
│   │   └── types.ts               # TypeScript типы для Telegram
│   ├── text/
│   │   └── extractor.ts           # Извлечение текста из сообщений
│   └── search/
│       └── google.ts              # Google Custom Search API
├── .env.local.example              # Пример файла с переменными окружения
├── package.json                    # Зависимости проекта
├── tsconfig.json                   # Конфигурация TypeScript
├── next.config.js                  # Конфигурация Next.js
└── vercel.json                     # Конфигурация Vercel
```

## Особенности реализации

### Этап 1-2: Настройка проекта и Webhook
- ✅ Next.js проект с TypeScript
- ✅ Webhook endpoint для приема обновлений от Telegram
- ✅ Быстрый возврат 200 OK для webhook
- ✅ Асинхронная обработка сообщений

### Этап 3: Извлечение текста
- ✅ Обработка текстовых сообщений
- ✅ Определение и обработка ссылок на Telegram-посты
- ✅ Валидация входных данных

### Этап 4: Извлечение ключевой информации
- ❌ Убрано (предварительный анализ текста удален)

### Этап 5: Поиск источников
- ✅ Интеграция Google Custom Search API
- ✅ Поиск по исходному тексту (без предварительного анализа)
- ✅ Поддержка пагинации для получения большего количества результатов
- ✅ Обработка и дедупликация результатов

### Этап 6: AI-анализ
- ✅ Интеграция OpenAI GPT-4o-mini для сравнения смысла
- ✅ Система оценки уверенности (0-100%)
- ✅ Ранжирование результатов по релевантности
- ✅ Выбор топ-3 наиболее релевантных источников
- ✅ Объяснение релевантности для каждого источника

### Telegram Mini App
- ✅ UI-слой для бота с современным интерфейсом
- ✅ Интеграция с Telegram Web App API
- ✅ Адаптивный дизайн для мобильных устройств
- ✅ Отображение результатов поиска с оценкой уверенности
- ✅ Поддержка тем Telegram (светлая/темная)

## Ограничения

1. **Telegram-посты**: Telegram Bot API не позволяет напрямую получать посты из каналов. Для полной поддержки требуется использование Telegram Client API или web scraping.

2. **Google Custom Search API**: Имеет ограничения на количество бесплатных запросов (100 запросов в день).

3. **OpenAI API**: Использует модель GPT-4o-mini, которая имеет ограничения на количество токенов. Анализируется до 10 результатов поиска за раз.

4. **Стоимость**: Использование OpenAI API платное. Стоимость зависит от количества запросов и используемых токенов.

## Разработка

### Добавление новых функций

1. Парсинг сущностей можно улучшить, используя библиотеки NLP (например, `compromise` или `natural`)
2. Для извлечения текста из Telegram-постов можно использовать Telegram Client API (MTProto)
3. AI-анализ можно добавить через OpenAI API или Anthropic Claude API

## Лицензия

См. файл [LICENSE](LICENSE)
