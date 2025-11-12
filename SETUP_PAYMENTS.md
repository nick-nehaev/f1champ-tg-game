# Настройка платежей Telegram Stars

Это пошаговая инструкция для настройки донатов через Telegram Stars в вашей игре.

## Шаг 1: Создание бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Введите имя бота (например: "Match3 Game")
4. Введите username бота (например: "match3game_bot")
5. Сохраните токен бота - он понадобится позже

## Шаг 2: Настройка WebApp

1. В [@BotFather](https://t.me/BotFather) отправьте `/mybots`
2. Выберите вашего бота
3. Выберите "Bot Settings" → "Menu Button"
4. Выберите "Configure menu button"
5. Введите текст кнопки (например: "🎮 Играть")
6. Введите URL вашего приложения (после деплоя на GitHub Pages или Vercel)

## Шаг 3: Включение Telegram Stars для бота

1. В [@BotFather](https://t.me/BotFather) отправьте `/mybots`
2. Выберите вашего бота
3. Выберите "Payments" → "Telegram Stars"
4. Подтвердите включение Telegram Stars

**Важно:** Telegram Stars доступны не во всех странах. Проверьте доступность в вашем регионе.

## Шаг 4: Деплой игры на GitHub Pages

1. Создайте новый репозиторий на GitHub
2. Загрузите файл `index.html` в корень репозитория
3. Зайдите в Settings → Pages
4. В разделе "Source" выберите "Deploy from a branch"
5. Выберите ветку `main` и папку `/root`
6. Сохраните настройки
7. Ваша игра будет доступна по адресу: `https://username.github.io/repository-name/`

## Шаг 5: Деплой API на Vercel

1. Установите Vercel CLI (опционально):
   ```bash
   npm i -g vercel
   ```

2. Зарегистрируйтесь на [Vercel](https://vercel.com) (можно через GitHub)

3. Создайте новый проект:
   - Импортируйте ваш GitHub репозиторий
   - Или используйте CLI: `vercel`

4. Добавьте переменную окружения:
   - Зайдите в настройки проекта на Vercel
   - Перейдите в "Settings" → "Environment Variables"
   - Добавьте переменную:
     - Name: `BOT_TOKEN`
     - Value: ваш токен от BotFather
     - Environment: Production, Preview, Development

5. Выполните деплой:
   ```bash
   vercel --prod
   ```

6. После деплоя получите URL вашего API (например: `https://your-app.vercel.app`)

## Шаг 6: Обновление API URL в игре

1. Откройте `index.html`
2. Найдите строку:
   ```javascript
   const API_URL = 'https://your-vercel-app.vercel.app/api';
   ```
3. Замените URL на ваш Vercel URL
4. Закоммитьте изменения в GitHub

## Шаг 7: Обновление URL WebApp в боте

1. Вернитесь к [@BotFather](https://t.me/BotFather)
2. Отправьте `/mybots`
3. Выберите вашего бота
4. "Bot Settings" → "Menu Button" → "Edit menu button URL"
5. Введите URL с GitHub Pages: `https://username.github.io/repository-name/`

## Шаг 8: Тестирование

1. Откройте вашего бота в Telegram
2. Нажмите на кнопку меню (внизу, рядом с полем ввода)
3. Игра должна открыться
4. Нажмите "⭐ Поддержать"
5. Выберите сумму доната
6. Проверьте, что открывается форма оплаты Telegram Stars

## Важные замечания

### Безопасность

В production обязательно раскомментируйте валидацию в `api/create-invoice.js`:

```javascript
if (!validateTelegramWebAppData(initData, BOT_TOKEN)) {
    return res.status(403).json({ error: 'Invalid Telegram data' });
}
```

Это защитит ваш API от несанкционированных запросов.

### Обработка успешных платежей

Текущая реализация добавляет бонусы сразу на клиенте. Для более надежной системы:

1. Настройте webhook для получения уведомлений о платежах
2. Храните покупки в базе данных
3. Проверяйте статус покупок на сервере

### Тестирование платежей

В тестовом режиме Telegram не списывает реальные Stars. Для тестирования:
- Используйте тестовые аккаунты
- Проверьте все суммы донатов
- Убедитесь, что бонусы начисляются корректно

## Альтернативные варианты деплоя

### Cloudflare Pages (вместо GitHub Pages)

1. Зарегистрируйтесь на [Cloudflare](https://cloudflare.com)
2. Перейдите в Pages
3. Подключите GitHub репозиторий
4. Deploy настроится автоматически

### Netlify (вместо GitHub Pages)

1. Зарегистрируйтесь на [Netlify](https://netlify.com)
2. Подключите GitHub репозиторий
3. Deploy настроится автоматически

### Railway/Render (вместо Vercel)

Обе платформы поддерживают serverless functions и могут быть использованы вместо Vercel.

## Поддержка

Если возникли проблемы:
1. Проверьте, что токен бота правильно настроен в Vercel
2. Убедитесь, что Telegram Stars включены для вашего бота
3. Проверьте консоль браузера на ошибки
4. Проверьте логи Vercel Functions

## Полезные ссылки

- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Telegram WebApp](https://core.telegram.org/bots/webapps)
- [Telegram Stars Documentation](https://core.telegram.org/bots/payments)
- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
