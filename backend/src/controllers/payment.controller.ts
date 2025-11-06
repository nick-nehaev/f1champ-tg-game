import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PlayerService } from '../services/player.service';
import { query } from '../db';
import { ApiResponse } from '@f1champ/shared';

// Цены Max валюты в Telegram Stars
const MAX_PRICES = {
  '50': 100,   // 50 Max за 100 Stars
  '120': 200,  // 120 Max за 200 Stars
  '300': 450,  // 300 Max за 450 Stars
  '650': 900,  // 650 Max за 900 Stars
  '1500': 1900 // 1500 Max за 1900 Stars
};

export class PaymentController {
  /**
   * Получить доступные пакеты Max валюты
   */
  static async getMaxPackages(req: AuthRequest, res: Response) {
    try {
      const packages = Object.entries(MAX_PRICES).map(([maxAmount, stars]) => ({
        maxAmount: parseInt(maxAmount),
        stars,
        description: `${maxAmount} Max валюты`
      }));

      const response: ApiResponse<any> = {
        success: true,
        data: packages,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error in getMaxPackages:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Создать invoice для покупки Max валюты через Telegram Stars
   */
  static async createMaxInvoice(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { maxAmount } = req.body;

      if (!MAX_PRICES[maxAmount as keyof typeof MAX_PRICES]) {
        return res.status(400).json({ error: 'Invalid package' });
      }

      const stars = MAX_PRICES[maxAmount as keyof typeof MAX_PRICES];

      // Формируем invoice для Telegram
      const invoice = {
        title: `${maxAmount} Max валюты`,
        description: `Покупка ${maxAmount} Max валюты для F1 Championship`,
        payload: JSON.stringify({
          userId: req.user.id,
          maxAmount: parseInt(maxAmount),
          type: 'max_purchase'
        }),
        currency: 'XTR', // Telegram Stars
        prices: [{
          label: `${maxAmount} Max`,
          amount: stars
        }]
      };

      const response: ApiResponse<any> = {
        success: true,
        data: invoice,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error in createMaxInvoice:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Обработка успешного платежа (webhook от Telegram)
   */
  static async handleSuccessfulPayment(req: AuthRequest, res: Response) {
    try {
      const { payload, telegramPaymentChargeId } = req.body;

      if (!payload) {
        return res.status(400).json({ error: 'Invalid payment data' });
      }

      const paymentData = JSON.parse(payload);
      const { userId, maxAmount } = paymentData;

      if (!userId || !maxAmount) {
        return res.status(400).json({ error: 'Invalid payment payload' });
      }

      // Получаем игрока
      const playerResult = await query(
        'SELECT * FROM players WHERE telegram_id = $1',
        [userId]
      );

      if (playerResult.rows.length === 0) {
        return res.status(404).json({ error: 'Player not found' });
      }

      const player = playerResult.rows[0];

      // Получаем команду
      const teamResult = await query(
        'SELECT * FROM teams WHERE player_id = $1',
        [player.id]
      );

      if (teamResult.rows.length === 0) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const team = teamResult.rows[0];

      // Добавляем Max валюту
      await query(
        'UPDATE teams SET max_currency = max_currency + $1 WHERE id = $2',
        [maxAmount, team.id]
      );

      // Записываем транзакцию
      await query(
        `INSERT INTO max_transactions (player_id, amount, type, description, telegram_payment_id)
         VALUES ($1, $2, 'purchase', $3, $4)`,
        [
          player.id,
          maxAmount,
          `Покупка через Telegram Stars`,
          telegramPaymentChargeId
        ]
      );

      const response: ApiResponse<any> = {
        success: true,
        data: { maxAdded: maxAmount },
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error in handleSuccessfulPayment:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
