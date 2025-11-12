# Как проверить и вывести Telegram Stars

## Автоматическое зачисление Stars

**Важно:** При использовании валюты XTR (Telegram Stars), все оплаченные Stars **автоматически зачисляются на баланс владельца бота** после успешной оплаты. Никаких дополнительных настроек не требуется!

## Проверка баланса Stars

### Способ 1: Через Telegram приложение

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/mybots`
3. Выберите вашего бота
4. Нажмите "Bot Settings"
5. Выберите "Telegram Stars Balance"
6. Вы увидите:
   - Текущий баланс Stars
   - Историю транзакций
   - Возможность вывести Stars

### Способ 2: Через Bot API

Вы можете проверить баланс программно через API:

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getStarTransactions"
```

Пример ответа:
```json
{
  "ok": true,
  "result": {
    "transactions": [
      {
        "id": "...",
        "source": {
          "type": "user",
          "user": {
            "id": 12345678,
            "is_bot": false,
            "first_name": "John"
          }
        },
        "date": 1234567890,
        "amount": 10
      }
    ]
  }
}
```

## Вывод Stars

### Через @BotFather

1. Откройте [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/mybots`
3. Выберите вашего бота
4. Выберите "Bot Settings" → "Telegram Stars Balance"
5. Нажмите "Withdraw" (Вывести)
6. Следуйте инструкциям для вывода Stars на ваш личный аккаунт Telegram

### Условия вывода

- Минимальная сумма для вывода может различаться
- Stars выводятся на ваш личный аккаунт Telegram
- Из Stars можно оплачивать другие сервисы в Telegram
- Telegram берет небольшую комиссию при выводе (обычно 0-10%)

## Отслеживание платежей в реальном времени

Для получения уведомлений о каждом платеже, вы можете настроить webhook:

### 1. Создайте endpoint для webhook

Создайте файл `api/webhook.js` в вашем проекте:

```javascript
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const update = req.body;

    // Обработка успешного платежа
    if (update.pre_checkout_query) {
        // Всегда одобряем платеж
        await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/answerPreCheckoutQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pre_checkout_query_id: update.pre_checkout_query.id,
                ok: true
            })
        });
    }

    // Платеж успешно завершен
    if (update.message?.successful_payment) {
        const payment = update.message.successful_payment;
        console.log('Payment received:', {
            userId: update.message.from.id,
            amount: payment.total_amount,
            currency: payment.currency,
            payload: payment.invoice_payload
        });

        // Здесь можно сохранить информацию о платеже в БД
        // или отправить уведомление пользователю
    }

    res.status(200).json({ ok: true });
}
```

### 2. Настройте webhook в Telegram

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-vercel-app.vercel.app/api/webhook"
  }'
```

## Мониторинг доходов

### Простая статистика через Bot API

Создайте скрипт для получения статистики:

```javascript
const BOT_TOKEN = 'your_bot_token';

async function getStarStats() {
    const response = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getStarTransactions`
    );
    const data = await response.json();

    if (data.ok) {
        const transactions = data.result.transactions;
        const total = transactions.reduce((sum, t) => sum + t.amount, 0);

        console.log('Всего Stars получено:', total);
        console.log('Количество транзакций:', transactions.length);

        // Группировка по пользователям
        const byUser = {};
        transactions.forEach(t => {
            const userId = t.source?.user?.id;
            if (userId) {
                byUser[userId] = (byUser[userId] || 0) + t.amount;
            }
        });

        console.log('По пользователям:', byUser);
    }
}

getStarStats();
```

## Важные замечания

### ✅ Что происходит автоматически:
- Stars зачисляются на баланс бота после успешной оплаты
- История всех транзакций сохраняется в Telegram
- Вы получаете уведомления о платежах (если настроен webhook)

### ❌ Что НЕ происходит автоматически:
- Сохранение информации о покупках в БД (нужно настраивать webhook)
- Отправка чеков пользователям (делается вручную или через webhook)
- Детальная аналитика (требует интеграции с вашей системой)

### 🔐 Безопасность

1. **Валидация платежей**: Всегда проверяйте `pre_checkout_query` перед одобрением
2. **Payload**: Используйте payload для передачи информации о заказе
3. **Webhook**: Валидируйте все входящие запросы на webhook endpoint
4. **BOT_TOKEN**: Никогда не публикуйте токен бота в публичных репозиториях

## FAQ

**Q: Когда Stars поступят на баланс?**
A: Сразу после успешной оплаты пользователем. Обычно моментально.

**Q: Могу ли я вернуть Stars пользователю?**
A: Да, через метод `refundStarPayment` в Bot API.

**Q: Есть ли лимиты на получение Stars?**
A: Telegram может устанавливать лимиты для новых ботов. Они увеличиваются со временем и активностью.

**Q: Можно ли конвертировать Stars в деньги?**
A: Напрямую нельзя, но Stars можно использовать для оплаты других сервисов в Telegram или передать другим пользователям.

**Q: Берет ли Telegram комиссию?**
A: При получении Stars комиссии нет. Комиссия может взиматься при выводе.

## Полезные ссылки

- [Telegram Bot API - Payments](https://core.telegram.org/bots/api#payments)
- [Telegram Stars Documentation](https://core.telegram.org/bots/payments)
- [getStarTransactions API](https://core.telegram.org/bots/api#getstartransactions)
- [refundStarPayment API](https://core.telegram.org/bots/api#refundstarpayment)
