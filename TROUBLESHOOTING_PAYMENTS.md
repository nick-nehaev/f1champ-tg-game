# Отладка платежей Telegram Stars

## Частые проблемы и решения

### 1. "Payment cancelled" / Долгая загрузка

**Возможные причины:**

#### A. BOT_TOKEN не установлен в Vercel
**Как проверить:**
1. Откройте ваш проект на [Vercel](https://vercel.com)
2. Settings → Environment Variables
3. Убедитесь, что переменная `BOT_TOKEN` существует
4. Значение должно быть вашим токеном от @BotFather (формат: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

**Как исправить:**
```bash
# В Vercel Dashboard
Settings → Environment Variables → Add
Name: BOT_TOKEN
Value: ваш_токен_от_BotFather
Environment: Production, Preview, Development
```

#### B. Telegram Stars не включены для бота
**Как проверить:**
1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте `/mybots`
3. Выберите вашего бота
4. Выберите "Payments"
5. Должна быть опция "Telegram Stars" с галочкой

**Как исправить:**
1. [@BotFather](https://t.me/BotFather) → `/mybots` → ваш бот
2. "Payments" → "Telegram Stars"
3. Нажмите кнопку для включения

#### C. Ошибка в формате запроса к Telegram API
**Как проверить:**
1. Откройте консоль браузера (F12)
2. Попробуйте сделать платёж
3. Посмотрите на логи:
   - `Creating invoice for X stars, user: ...`
   - `Invoice created: ...` или `Server error: ...`

**Типичные ошибки от Telegram:**
- `Bad Request: CURRENCY_TOTAL_AMOUNT_INVALID` - неверная сумма
- `Bad Request: BOT_PAYMENT_DISABLED` - платежи не включены для бота
- `Unauthorized` - неверный BOT_TOKEN
- `Bad Request: provider token is invalid` - для XTR provider_token должен быть пустой строкой

### 2. Проверка логов Vercel

**Как смотреть логи:**
1. Откройте ваш проект на [Vercel](https://vercel.com)
2. Перейдите на вкладку "Logs" или "Deployments" → выберите deployment → "Functions"
3. Найдите функцию `api/create-invoice`
4. Посмотрите логи выполнения

**Что искать в логах:**
```
✓ Received payment request
✓ Request data: { userId: 123..., stars: 10, hasInitData: true }
✓ Package selected: { title: '...', ... }
✓ Sending request to Telegram API...
✓ Invoice data: { ... }
✓ Telegram API response: { ok: true, result: '...' }
✓ Invoice created successfully
```

**Если видите ошибку:**
```
✗ Telegram API returned error: { ... }
```
Значит проблема в запросе к Telegram или настройках бота.

### 3. Пошаговая диагностика

#### Шаг 1: Проверьте что API работает
Откройте в браузере: `https://your-app.vercel.app/api/create-invoice`

Должны увидеть: `{"error":"Method not allowed"}` - это нормально, значит API доступен.

#### Шаг 2: Проверьте BOT_TOKEN напрямую
Откройте в браузере:
```
https://api.telegram.org/bot<ВАШ_ТОКЕН>/getMe
```

Должны увидеть информацию о боте. Если ошибка - токен неверный.

#### Шаг 3: Проверьте что бот может создавать invoice
В терминале или браузере выполните:
```bash
curl -X POST https://api.telegram.org/bot<ВАШ_ТОКЕН>/createInvoiceLink \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "description": "Test payment",
    "payload": "test",
    "provider_token": "",
    "currency": "XTR",
    "prices": [{"label": "Test", "amount": 10}]
  }'
```

**Ожидаемый результат:**
```json
{
  "ok": true,
  "result": "https://t.me/$some_invoice_link"
}
```

**Если ошибка:**
```json
{
  "ok": false,
  "error_code": 400,
  "description": "Bad Request: CURRENCY_TOTAL_AMOUNT_INVALID"
}
```
Значит проблема в формате или настройках бота.

### 4. Проверка настроек в коде

#### A. API_URL правильно установлен
В `index.html` строка 533:
```javascript
const API_URL = 'https://f1champ-tg-game.vercel.app/api';
```
Должен быть ваш URL от Vercel.

#### B. Telegram Stars доступны в вашем регионе
Telegram Stars доступны не во всех странах. Проверьте:
1. Откройте любой бот с платежами в Telegram
2. Попробуйте сделать тестовый платёж
3. Если Stars недоступны - платежи не будут работать

### 5. Тестовый режим

Для отладки можно временно упростить код:

**В `api/create-invoice.js` замените:**
```javascript
const invoiceData = {
    title: "Test Payment",
    description: "Testing Telegram Stars",
    payload: "test_123",
    provider_token: "",
    currency: "XTR",
    prices: [
        {
            label: "Test",
            amount: 1 // Минимальная сумма для теста
        }
    ]
};
```

### 6. Контрольный чек-лист

- [ ] BOT_TOKEN установлен в Vercel Environment Variables
- [ ] Telegram Stars включены в [@BotFather](https://t.me/BotFather) для вашего бота
- [ ] API_URL в index.html указывает на ваш Vercel deployment
- [ ] Vercel deployment успешно завершился (без ошибок)
- [ ] Токен бота работает (проверили через /getMe)
- [ ] Telegram Stars доступны в вашем регионе
- [ ] В консоли браузера нет ошибок CORS

### 7. Дополнительные проверки

#### Проверка через Telegram Bot API Test
Используйте Telegram Bot API Test для отладки:
```
https://api.telegram.org/bot<TOKEN>/getStarTransactions
```

#### Минимальная сумма Stars
Убедитесь что сумма >= 1 Star. Меньшие суммы могут не работать.

#### Формат payload
Payload должен быть строкой (мы используем JSON.stringify), максимум 128 байт.

## Получение помощи

Если ничего не помогло, соберите следующую информацию:

1. **Логи из Vercel** (Functions → api/create-invoice)
2. **Логи из консоли браузера** (F12 → Console)
3. **Скриншот ошибки** от Telegram
4. **Статус проверок:**
   - BOT_TOKEN установлен: ✓/✗
   - Stars включены: ✓/✗
   - /getMe работает: ✓/✗
   - Регион поддерживает Stars: ✓/✗

## Полезные ссылки

- [Telegram Bot API - Payments](https://core.telegram.org/bots/api#payments)
- [Telegram Stars Documentation](https://core.telegram.org/bots/payments#supported-currencies)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Function Logs](https://vercel.com/docs/concepts/functions/serverless-functions#logs)
