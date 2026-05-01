# TON FlashBet — Ставки на ВСЁ

Моментальные ставки на любые события через Telegram и TON блокчейн. Без смарт-контрактов, только Python и бесплатные API.

## Ключевые особенности

- 🎲 Ставки на что угодно: Курсы криптовалют, погода, новости, личные споры — любые события.
- ⚡ Моментальные расчеты: Прямо в Telegram, без выхода из чата.
- 🔐 Безопасность через голосование: Система защиты от подтасовок с использованием репутации, стейка и случайных аудиторов.
- 💰 Прозрачная казна: Баланс проекта и все транзакции открыты для всех пользователей.
- 👥 Реферальная система: Приглашай друзей, получай бонусы за их активность.
- 📱 Telegram Mini App (TMA): Удобный интерфейс с тремя вкладками (Ставки, Создать, Профиль), тёмной темой и живыми графиками цен.
- 🔥 Оракул цен: Автоматическая проверка результатов ставок на курсы криптовалют через CoinGecko API.
- 📈 Торговля вероятностями: Как на Polymarket — покупай доли ставок, влияй на рыночные вероятности.
- 💎 Подключение TON кошелька: Авторизация через TON Connect, отображение баланса в профиле.

## Технологии

- **Backend**: Python (Telegram Bot API, Flask для TMA)
- **Blockchain**: TON (The Open Network)
- **APIs**: CoinGecko, TON Center
- **UI**: HTML5, CSS3, JavaScript (Telegram Mini App SDK)

## Структура проекта

```
ton-flashbet/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── app.py
│   │   ├── config.py
│   │   └── handlers.py
│   ├── requirements.txt
│   └── .env (not in git, see instructions)
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── js/
│   │   │   └── app.js
│   │   └── images/
│   └── templates/
│       └── (if any, currently using static index.html)
├── render.yaml
├── .env (example, not committed)
└── README.md
```

## Локальная установка и запуск

### Предварительные требования

- Python 3.8+
- pip
- Git
- [ngrok](https://ngrok.com/) (for local webhook testing) or use a service like [Render](https://render.com) for deployment.

### Шаги

1. Клонируйте репозиторий:
   ```bash
   git clone https://github.com/ignat-101/ton-flashbet.git
   cd ton-flashbet
   ```

2. Создайте виртуальное окружение и активируйте его:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Установите зависимости:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Создайте файл `.env` в корне проекта (или в `backend/`?) и заполните его своими значениями:
   ```bash
   cp backend/.env.example backend/.env   # If you have an example, otherwise create manually
   ```
   Затем отредактируйте `backend/.env`:
   ```env
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
   TELEGRAM_WEBHOOK_URL=https://your-ngrok-url.ngrok.io/webhook  # For local testing with ngrok
   TON_CENTER_API_KEY=your_ton_center_api_key_here
   ADMIN_WALLET_ADDRESS=UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0
   TELEGRAM_STARS_PROVIDER_TOKEN=your_telegram_stars_provider_token_here
   FLASK_ENV=development
   FLASK_DEBUG=True
   ```

5. Для локального тестирования вебхука Telegram запустите ngrok (или аналогичный):
   ```bash
   ngrok http 5000
   ```
   Затем обновите `TELEGRAM_WEBHOOK_URL` в `.env` на URL, предоставленный ngrok (например, `https://abc123.ngrok.io/webhook`).

6. Запустите сервер:
   ```bash
   cd backend
   python app.py
   ```
   Сервер будет доступен по адресу `http://localhost:5000`.

7. Установите вебхук для вашего бота Telegram (вы можете сделать это через Telegram Bot API или вручную через браузер):
   ```
   https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook?url=<YOUR_NGROK_URL>/webhook
   ```
   Замените `<YOUR_TELEGRAM_BOT_TOKEN>` и `<YOUR_NGROK_URL>` на ваши значения.

8. Теперь вы можете взаимодействовать с ботом в Telegram, отправив команду `/start`.

## Развертывание на Render

1. Fork или импортируйте этот репозиторий в свой аккаунт на [Render](https://render.com).

2. Создайте новый веб-сервис:
   - **Environment**: Python
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `gunicorn backend.app:app`

3. Добавьте следующие переменные окружения в разделе Environment:
   - `TELEGRAM_BOT_TOKEN`: ваш токен бота Telegram
   - `TELEGRAM_WEBHOOK_URL`: URL вашего сервиса на Render + `/webhook` (например, `https://ton-flashbet.onrender.com/webhook`)
   - `TON_CENTER_API_KEY`: ваш API ключ от TON Center
   - `ADMIN_WALLET_ADDRESS`: `UQCfdyrb0Fj8lA32OfizTwGY829tTzihsEYl1FrpBzeVKdi0` (как указано в задании)
   - `TELEGRAM_STARS_PROVIDER_TOKEN`: ваш токен провайдера для Telegram Stars (если планируете использовать)
   - `FLASK_ENV`: `production`

4. Render автоматически установит зависимости и запустит сервер.

5. После деплоя установите вебхук для вашего бота Telegram, используя URL вашего сервиса на Render:
   ```
   https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook?url=<YOUR_RENDER_URL>/webhook
   ```

## Важные замечания

- Файл `.env` не должен попадать в репозиторий. Убедитесь, что он добавлен в `.gitignore`.
- Для продакшена рекомендуется использовать более надежную базу данных (например, PostgreSQL) вместо SQLite, которая используется по умолчанию.
- Реализация голосования и оракула пока не включена в этот базовый шаблон и требует дополнительной работы.

## Лицензия

Этот проект лицензирован под лицензией MIT - см. файл [LICENSE](LICENSE) для подробностей.

## Контакты

Если у вас есть вопросы или предложения, пожалуйста, создавайте issue в этом репозитории.