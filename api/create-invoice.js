/**
 * Vercel Serverless Function для создания Telegram Stars Invoice
 *
 * Требуемые переменные окружения:
 * - BOT_TOKEN: токен вашего Telegram бота
 *
 * ВАЖНО: При использовании валюты XTR (Telegram Stars), все оплаченные Stars
 * автоматически зачисляются на баланс владельца бота.
 *
 * Проверить баланс Stars можно через:
 * - Telegram Bot API: getStarTransactions
 * - Telegram приложение: @BotFather -> /mybots -> ваш бот -> Bot Settings -> Telegram Stars Balance
 *
 * Вывести Stars можно через @BotFather
 */

const crypto = require('crypto');

// Проверка подписи Telegram WebApp
function validateTelegramWebAppData(initData, botToken) {
    try {
        const params = new URLSearchParams(initData);
        const hash = params.get('hash');
        params.delete('hash');

        // Сортируем параметры
        const dataCheckString = Array.from(params.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([key, value]) => `${key}=${value}`)
            .join('\n');

        // Создаем секретный ключ
        const secretKey = crypto
            .createHmac('sha256', 'WebAppData')
            .update(botToken)
            .digest();

        // Вычисляем hash
        const calculatedHash = crypto
            .createHmac('sha256', secretKey)
            .update(dataCheckString)
            .digest('hex');

        return calculatedHash === hash;
    } catch (error) {
        console.error('Validation error:', error);
        return false;
    }
}

// Описания товаров для разных сумм
const DONATION_PACKAGES = {
    10: {
        title: 'Little help',
        description: '+5 дополнительных ходов в игре',
        bonus: 5
    },
    50: {
        title: 'Поддержка разработчика',
        description: '+30 дополнительных ходов в игре',
        bonus: 30
    },
    100: {
        title: 'Большая поддержка',
        description: '+75 дополнительных ходов в игре',
        bonus: 75
    },
    250: {
        title: 'Супер поддержка!',
        description: '+200 дополнительных ходов в игре',
        bonus: 200
    }
};

export default async function handler(req, res) {
    // Разрешаем CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;

    if (!BOT_TOKEN) {
        console.error('BOT_TOKEN not configured');
        return res.status(500).json({
            error: 'Server configuration error',
            details: 'BOT_TOKEN environment variable is not set'
        });
    }

    console.log('Received payment request');

    try {
        const { userId, stars, initData } = req.body;

        console.log('Request data:', { userId, stars, hasInitData: !!initData });

        // Валидация входных данных
        if (!userId || !stars) {
            console.error('Missing required fields');
            return res.status(400).json({ error: 'Missing required fields: userId or stars' });
        }

        // Проверяем, что сумма валидна
        if (!DONATION_PACKAGES[stars]) {
            console.error('Invalid stars amount:', stars);
            return res.status(400).json({
                error: 'Invalid donation amount',
                validAmounts: Object.keys(DONATION_PACKAGES)
            });
        }

        // Валидация отключена для отладки
        // Раскомментируйте для продакшена:
        // if (!validateTelegramWebAppData(initData, BOT_TOKEN)) {
        //     return res.status(403).json({ error: 'Invalid Telegram data' });
        // }

        const packageInfo = DONATION_PACKAGES[stars];
        console.log('Package selected:', packageInfo);

        // Создаем invoice через Telegram Bot API
        const telegramApiUrl = `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`;

        const invoiceData = {
            title: packageInfo.title,
            description: packageInfo.description,
            payload: JSON.stringify({
                userId: userId,
                stars: stars,
                bonus: packageInfo.bonus,
                timestamp: Date.now()
            }),
            provider_token: '', // Для XTR (Telegram Stars) должно быть пустым
            currency: 'XTR', // Telegram Stars
            prices: [
                {
                    label: packageInfo.title,
                    amount: stars // Для XTR amount = количество звезд
                }
            ]
        };

        console.log('Sending request to Telegram API...');
        console.log('Invoice data:', JSON.stringify(invoiceData, null, 2));

        const response = await fetch(telegramApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(invoiceData)
        });

        const data = await response.json();
        console.log('Telegram API response:', JSON.stringify(data, null, 2));

        if (!data.ok) {
            console.error('Telegram API returned error:', data);
            return res.status(500).json({
                error: 'Failed to create invoice',
                telegramError: data.description,
                errorCode: data.error_code,
                fullResponse: data
            });
        }

        console.log('Invoice created successfully');

        // Возвращаем ссылку на invoice
        return res.status(200).json({
            success: true,
            invoiceLink: data.result
        });

    } catch (error) {
        console.error('Exception in handler:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
