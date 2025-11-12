# Отладка платежей Telegram Stars

## Что проверить в логах

После попытки оплаты проверьте логи в двух местах:

### 1. Логи браузера (F12 → Console)

Должны появиться следующие сообщения:

```
Creating invoice for X stars, user: [userId]
Invoice created: {...}
Invoice link: https://t.me/$...
Invoice link type: string
Invoice link length: [число]
Opening invoice with Telegram WebApp...
Invoice link starts with: https://t.me/$...
tg.openInvoice is available, calling it now...
Payment callback triggered!
Payment status: cancelled/paid/failed
```

**Что смотреть:**
- ✅ Invoice link должен начинаться с `https://t.me/$`
- ✅ `tg.openInvoice is available` - метод доступен
- ❌ Если статус `cancelled` - проблема на стороне Telegram или бота

### 2. Логи Vercel (Dashboard → Logs → Functions)

Должны появиться:

```
Received payment request
Request data: {...}
Package selected: {...}
Bot token (first 10 chars): [первые 10 символов]
Sending request to Telegram API...
Invoice data: {...}
Telegram API response status: 200
Telegram API response: { "ok": true, "result": "..." }
Invoice created successfully
Invoice link: https://t.me/$...
```

**Что смотреть:**
- ✅ Bot token не пустой (первые 10 символов должны быть видны)
- ✅ Telegram API response должен иметь `"ok": true`
- ❌ Если `"ok": false` - смотрите `description` и `error_code`

## Типичные проблемы

### Проблема: "Payment cancelled" сразу после открытия

**Возможные причины:**

1. **Telegram Stars не активированы для бота**
   - Откройте @BotFather
   - Выберите ваш бот
   - Bot Settings → Payments
   - Убедитесь что Stars включены

2. **Недостаточная версия Telegram**
   - Stars работают только в Telegram версии 7.0+
   - Обновите приложение

3. **Регион не поддерживает Stars**
   - Stars доступны не во всех странах
   - Проверьте: попробуйте купить Stars в другом боте

4. **Проблемы с ботом**
   - Убедитесь что бот активен (@BotFather → /mybots)
   - Проверьте токен через: `https://api.telegram.org/bot<YOUR_TOKEN>/getMe`
   - Должен вернуть `{"ok":true,"result":{...}}`

## Тестирование бота напрямую

Проверьте, что ваш бот работает:

### Шаг 1: Проверка токена
```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getMe
```

Должен вернуть:
```json
{
  "ok": true,
  "result": {
    "id": 123456789,
    "is_bot": true,
    "first_name": "YourBot",
    ...
  }
}
```

### Шаг 2: Тест создания invoice напрямую
```bash
curl -X POST https://api.telegram.org/bot<YOUR_BOT_TOKEN>/createInvoiceLink \
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

Должен вернуть:
```json
{
  "ok": true,
  "result": "https://t.me/$..."
}
```

**Если получили ошибку:**
- `"description": "Bad Request: CURRENCY_TOTAL_AMOUNT_INVALID"` - проблема с суммой
- `"description": "Bad Request: PAYMENT_PROVIDER_INVALID"` - Stars не активированы
- `"description": "Unauthorized"` - неверный Bot Token

## Минимальный тест в браузере

Откройте консоль браузера в игре и выполните:

```javascript
// Проверка что Telegram WebApp загружен
console.log('Telegram WebApp version:', window.Telegram.WebApp.version);
console.log('User ID:', window.Telegram.WebApp.initDataUnsafe?.user?.id);

// Проверка доступности openInvoice
console.log('openInvoice available:', typeof window.Telegram.WebApp.openInvoice);

// Если openInvoice недоступен - проверьте версию Telegram
```

## Что делать дальше

1. **Соберите все логи** из браузера и Vercel
2. **Проверьте токен бота** через curl команду выше
3. **Убедитесь что Stars активированы** в @BotFather
4. **Проверьте версию Telegram** - должна быть 7.0+
5. **Попробуйте тестовый invoice** через curl

Если все проверки пройдены, но оплата не работает - проблема может быть в региональных ограничениях Telegram Stars.
