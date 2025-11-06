import { query } from '../db';
import { Referral, REFERRAL_REWARD_MONEY, REFERRAL_REWARD_MAX } from '@f1champ/shared';

export class ReferralService {
  /**
   * Получить рефералов игрока
   */
  static async getPlayerReferrals(playerId: number): Promise<Referral[]> {
    const result = await query(
      'SELECT * FROM referrals WHERE referrer_id = $1 ORDER BY created_at DESC',
      [playerId]
    );

    return result.rows.map(this.mapRowToReferral);
  }

  /**
   * Создать реферальную связь
   */
  static async createReferral(
    referrerId: number,
    referredId: number
  ): Promise<void> {
    // Проверяем, что пользователь не приглашает сам себя
    if (referrerId === referredId) {
      throw new Error('Cannot refer yourself');
    }

    // Проверяем, что приглашенный еще не был приглашен
    const existingResult = await query(
      'SELECT * FROM referrals WHERE referred_id = $1',
      [referredId]
    );

    if (existingResult.rows.length > 0) {
      throw new Error('User already referred');
    }

    await query('BEGIN');
    try {
      // Создаем запись о реферале
      await query(
        'INSERT INTO referrals (referrer_id, referred_id, reward_given) VALUES ($1, $2, $3)',
        [referrerId, referredId, true]
      );

      // Даем награду рефереру
      await query(
        `UPDATE teams
         SET budget = budget + $1, max_currency = max_currency + $2
         WHERE player_id = $3`,
        [REFERRAL_REWARD_MONEY, REFERRAL_REWARD_MAX, referrerId]
      );

      // Записываем транзакцию Max валюты
      await query(
        `INSERT INTO max_transactions (player_id, amount, type, description)
         VALUES ($1, $2, 'reward', 'Referral reward')`,
        [referrerId, REFERRAL_REWARD_MAX]
      );

      // Даем бонус приглашенному
      await query(
        'UPDATE teams SET budget = budget + $1 WHERE player_id = $2',
        [1000, referredId] // Маленький бонус приглашенному
      );

      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Получить реферальный код игрока (telegram_id)
   */
  static async getReferralCode(playerId: number): Promise<string> {
    const result = await query(
      'SELECT telegram_id FROM players WHERE id = $1',
      [playerId]
    );

    if (result.rows.length === 0) {
      throw new Error('Player not found');
    }

    return result.rows[0].telegram_id.toString();
  }

  /**
   * Получить количество рефералов
   */
  static async getReferralCount(playerId: number): Promise<number> {
    const result = await query(
      'SELECT COUNT(*) as count FROM referrals WHERE referrer_id = $1',
      [playerId]
    );

    return parseInt(result.rows[0].count);
  }

  private static mapRowToReferral(row: any): Referral {
    return {
      id: row.id,
      referrerId: row.referrer_id,
      referredId: row.referred_id,
      reward: REFERRAL_REWARD_MONEY,
      createdAt: new Date(row.created_at),
    };
  }
}
