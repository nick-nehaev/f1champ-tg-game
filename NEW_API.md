# Новые API Endpoints

## Система стратегии гонок

### Установить стратегию для гонки
```
POST /api/strategy/:raceId
```

**Body:**
```json
{
  "pitStops": [
    {
      "lap": 15,
      "tireType": "soft"
    },
    {
      "lap": 30,
      "tireType": "medium"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "raceId": 1,
    "teamId": 1,
    "pitStops": [...],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### Получить стратегию команды
```
GET /api/strategy/:raceId
```

## Визуализация гонок

### Получить lap data для гонки
```
GET /api/race/:raceId/lap-data
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "lap": 1,
      "teamId": 1,
      "position": 3,
      "lapTime": 92000,
      "tireType": "medium",
      "tireAge": 1,
      "isInPit": false,
      "totalTime": 92000
    },
    ...
  ]
}
```

### Получить визуализацию для конкретного круга
```
GET /api/race/:raceId/visualization/:lap
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalLaps": 50,
    "currentLap": 15,
    "positions": [
      {
        "teamId": 1,
        "teamName": "Ferrari",
        "teamColor": "#FF0000",
        "position": 1,
        "progress": 0.5,
        "isInPit": false,
        "tireType": "soft",
        "lapTime": 91234
      },
      ...
    ]
  }
}
```

## Покупаемые наборы

### Купить набор за обычную валюту
```
POST /api/crates/purchase
```

**Body:**
```json
{
  "crateType": "basic"  // или "standard"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "teamId": 1,
    "type": "basic",
    "status": "locked",
    "lockedUntil": "2025-01-01T12:00:00Z",
    ...
  }
}
```

## Система крафта

### Скрафтить компонент
```
POST /api/crafting/craft
```

**Body:**
```json
{
  "componentIds": [1, 2, 3, ... 20]  // ID 20 одинаковых компонентов
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "newComponent": {
      "id": 456,
      "type": "engine",
      "level": 2,
      ...
    },
    "consumedComponents": [1, 2, 3, ... 20]
  }
}
```

### Получить доступные для крафта группы
```
GET /api/crafting/available
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "type": "engine",
      "level": 1,
      "count": 25,
      "possibleCrafts": 1,
      "resultLevel": 2
    },
    ...
  ]
}
```

## Платежи (Telegram Stars)

### Получить доступные пакеты Max валюты
```
GET /api/payment/max-packages
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "maxAmount": 50,
      "stars": 100,
      "description": "50 Max валюты"
    },
    {
      "maxAmount": 120,
      "stars": 200,
      "description": "120 Max валюты"
    },
    ...
  ]
}
```

### Создать invoice для покупки
```
POST /api/payment/create-invoice
```

**Body:**
```json
{
  "maxAmount": "50"  // или "120", "300", "650", "1500"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "50 Max валюты",
    "description": "Покупка 50 Max валюты для F1 Championship",
    "payload": "{\"userId\":123,\"maxAmount\":50,\"type\":\"max_purchase\"}",
    "currency": "XTR",
    "prices": [{
      "label": "50 Max",
      "amount": 100
    }]
  }
}
```

### Webhook для обработки платежа
```
POST /api/payment/webhook
```

**Body:**
```json
{
  "payload": "{\"userId\":123,\"maxAmount\":50,\"type\":\"max_purchase\"}",
  "telegramPaymentChargeId": "charge_id_123"
}
```

## Схемы трасс

Доступные трассы в `TRACKS` (из shared):
- **Монако** - 50 кругов
- **Сильверстоун** - 45 кругов
- **Монца** - 48 кругов
- **Судзука** - 44 круга
- **Спа-Франкоршам** - 40 кругов

## Характеристики шин

Из `TIRE_CHARACTERISTICS`:

| Тип шин      | Скорость | Износ  | Оптимально кругов |
|--------------|----------|--------|-------------------|
| Soft         | 1.1x     | 0.05   | 15                |
| Medium       | 1.0x     | 0.03   | 25                |
| Hard         | 0.95x    | 0.02   | 35                |
| Wet          | 0.85x    | 0.01   | 50                |
| Intermediate | 0.9x     | 0.015  | 40                |

**Время питстопа:** 25 секунд (25000 мс)

## Примеры использования

### Установить агрессивную стратегию
```javascript
// 3 питстопа на мягких шинах
await fetch('/api/strategy/1', {
  method: 'POST',
  body: JSON.stringify({
    pitStops: [
      { lap: 12, tireType: 'soft' },
      { lap: 24, tireType: 'soft' },
      { lap: 36, tireType: 'soft' }
    ]
  })
});
```

### Консервативная стратегия
```javascript
// 1 питстоп на жестких шинах
await fetch('/api/strategy/1', {
  method: 'POST',
  body: JSON.stringify({
    pitStops: [
      { lap: 25, tireType: 'hard' }
    ]
  })
});
```
