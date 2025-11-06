import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface AuthRequest extends Request {
  user?: TelegramUser;
}

/**
 * Проверяет подлинность данных от Telegram WebApp
 */
export const verifyTelegramWebAppData = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const initData = req.headers['x-telegram-init-data'] as string;

    if (!initData) {
      return res.status(401).json({ error: 'No Telegram data provided' });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not set');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Парсим данные
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    if (!hash) {
      return res.status(401).json({ error: 'Invalid Telegram data' });
    }

    // Проверяем подпись
    const dataCheckString = Array.from(urlParams.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Проверяем время (данные должны быть свежими - не старше 1 часа)
    const authDate = parseInt(urlParams.get('auth_date') || '0');
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - authDate > 3600) {
      return res.status(401).json({ error: 'Data is too old' });
    }

    // Извлекаем данные пользователя
    const userJson = urlParams.get('user');
    if (!userJson) {
      return res.status(401).json({ error: 'No user data' });
    }

    const user: TelegramUser = JSON.parse(userJson);
    req.user = user;

    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Для разработки - пропускает аутентификацию
 */
export const devAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (process.env.NODE_ENV === 'development') {
    // Тестовый пользователь для разработки
    req.user = {
      id: 123456789,
      first_name: 'Test',
      last_name: 'User',
      username: 'testuser',
    };
    next();
  } else {
    verifyTelegramWebAppData(req, res, next);
  }
};
