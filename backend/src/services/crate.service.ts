import { query } from '../db';
import {
  Crate,
  CrateType,
  CrateStatus,
  CrateReward,
  DAILY_CRATE_COOLDOWN_HOURS,
  CRATE_OPEN_TIME_SECONDS,
  MAX_CURRENCY_TO_SKIP,
} from '@f1champ/shared';
import { PilotService } from './pilot.service';

export class CrateService {
  /**
   * Получить наборы команды
   */
  static async getTeamCrates(teamId: number): Promise<Crate[]> {
    const result = await query(
      'SELECT * FROM crates WHERE team_id = $1 ORDER BY created_at DESC',
      [teamId]
    );

    return result.rows.map(this.mapRowToCrate);
  }

  /**
   * Создать ежедневный набор
   */
  static async claimDailyCrate(teamId: number): Promise<Crate> {
    // Проверяем, когда был последний клейм
    const lastClaimResult = await query(
      'SELECT last_claim_at FROM daily_crate_claims WHERE team_id = $1',
      [teamId]
    );

    if (lastClaimResult.rows.length > 0) {
      const lastClaim = new Date(lastClaimResult.rows[0].last_claim_at);
      const now = new Date();
      const hoursSinceLastClaim =
        (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

      if (hoursSinceLastClaim < DAILY_CRATE_COOLDOWN_HOURS) {
        throw new Error('Daily crate not available yet');
      }
    }

    // Создаем набор
    const lockedUntil = new Date(Date.now() + CRATE_OPEN_TIME_SECONDS * 1000);

    const result = await query(
      `INSERT INTO crates (team_id, type, status, locked_until)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [teamId, CrateType.DAILY, CrateStatus.LOCKED, lockedUntil]
    );

    // Обновляем/создаем запись о клейме
    await query(
      `INSERT INTO daily_crate_claims (team_id, last_claim_at)
       VALUES ($1, CURRENT_TIMESTAMP)
       ON CONFLICT (team_id) DO UPDATE SET last_claim_at = CURRENT_TIMESTAMP`,
      [teamId]
    );

    return this.mapRowToCrate(result.rows[0]);
  }

  /**
   * Создать призовой набор
   */
  static async createPrizeCrate(
    teamId: number,
    type: CrateType.BRONZE | CrateType.SILVER | CrateType.GOLD
  ): Promise<Crate> {
    const lockedUntil = new Date(Date.now() + CRATE_OPEN_TIME_SECONDS * 1000);

    const result = await query(
      `INSERT INTO crates (team_id, type, status, locked_until)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [teamId, type, CrateStatus.LOCKED, lockedUntil]
    );

    return this.mapRowToCrate(result.rows[0]);
  }

  /**
   * Пропустить ожидание с помощью Max валюты
   */
  static async skipCrateWait(teamId: number, crateId: number): Promise<void> {
    // Получаем набор
    const crateResult = await query(
      'SELECT * FROM crates WHERE id = $1 AND team_id = $2',
      [crateId, teamId]
    );

    if (crateResult.rows.length === 0) {
      throw new Error('Crate not found');
    }

    const crate = this.mapRowToCrate(crateResult.rows[0]);

    if (crate.status !== CrateStatus.LOCKED) {
      throw new Error('Crate is not locked');
    }

    // Получаем команду
    const teamResult = await query(
      'SELECT max_currency FROM teams WHERE id = $1',
      [teamId]
    );

    if (teamResult.rows.length === 0) {
      throw new Error('Team not found');
    }

    const maxCurrency = teamResult.rows[0].max_currency;

    if (maxCurrency < MAX_CURRENCY_TO_SKIP) {
      throw new Error('Insufficient Max currency');
    }

    // Списываем валюту и открываем набор
    await query('BEGIN');
    try {
      await query(
        'UPDATE teams SET max_currency = max_currency - $1 WHERE id = $2',
        [MAX_CURRENCY_TO_SKIP, teamId]
      );

      await query(
        "UPDATE crates SET status = $1, locked_until = NULL WHERE id = $2",
        [CrateStatus.READY, crateId]
      );

      // Записываем транзакцию
      await query(
        `INSERT INTO max_transactions (player_id, amount, type, description)
         SELECT player_id, $1, 'spend', 'Skip crate wait time'
         FROM teams WHERE id = $2`,
        [-MAX_CURRENCY_TO_SKIP, teamId]
      );

      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Проверить и обновить статусы наборов
   */
  static async updateCrateStatuses(teamId: number): Promise<void> {
    await query(
      `UPDATE crates
       SET status = $1
       WHERE team_id = $2
         AND status = $3
         AND locked_until IS NOT NULL
         AND locked_until <= CURRENT_TIMESTAMP`,
      [CrateStatus.READY, teamId, CrateStatus.LOCKED]
    );
  }

  /**
   * Открыть набор
   */
  static async openCrate(teamId: number, crateId: number): Promise<CrateReward[]> {
    // Обновляем статусы
    await this.updateCrateStatuses(teamId);

    // Получаем набор
    const crateResult = await query(
      'SELECT * FROM crates WHERE id = $1 AND team_id = $2',
      [crateId, teamId]
    );

    if (crateResult.rows.length === 0) {
      throw new Error('Crate not found');
    }

    const crate = this.mapRowToCrate(crateResult.rows[0]);

    if (crate.status !== CrateStatus.READY) {
      throw new Error('Crate is not ready to open');
    }

    // Генерируем награды
    const rewards = await this.generateRewards(teamId, crate.type);

    await query('BEGIN');
    try {
      // Сохраняем награды
      for (const reward of rewards) {
        await query(
          `INSERT INTO crate_rewards (crate_id, reward_type, reward_id, amount)
           VALUES ($1, $2, $3, $4)`,
          [crateId, reward.rewardType, reward.rewardId, reward.amount]
        );

        // Применяем награды
        await this.applyReward(teamId, reward);
      }

      // Отмечаем набор как открытый
      await query(
        'UPDATE crates SET status = $1, opened_at = CURRENT_TIMESTAMP WHERE id = $2',
        [CrateStatus.OPENED, crateId]
      );

      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

    // Получаем сохраненные награды
    const rewardsResult = await query(
      'SELECT * FROM crate_rewards WHERE crate_id = $1',
      [crateId]
    );

    return rewardsResult.rows.map(this.mapRowToCrateReward);
  }

  /**
   * Генерировать награды для набора
   */
  private static async generateRewards(
    teamId: number,
    type: CrateType
  ): Promise<Array<{ rewardType: string; rewardId?: number; amount?: number }>> {
    const rewards: Array<{
      rewardType: string;
      rewardId?: number;
      amount?: number;
    }> = [];

    const configs = {
      [CrateType.DAILY]: {
        money: { chance: 0.7, min: 500, max: 1500 },
        component: { chance: 0.25, level: [1, 2] },
        pilot: { chance: 0.04, level: [1, 2] },
        max: { chance: 0.01, amount: [1, 3] },
      },
      [CrateType.BRONZE]: {
        money: { chance: 0.5, min: 1000, max: 3000 },
        component: { chance: 0.4, level: [2, 3] },
        pilot: { chance: 0.08, level: [2, 3] },
        max: { chance: 0.02, amount: [2, 5] },
      },
      [CrateType.SILVER]: {
        money: { chance: 0.4, min: 3000, max: 6000 },
        component: { chance: 0.45, level: [3, 4] },
        pilot: { chance: 0.12, level: [3, 4] },
        max: { chance: 0.03, amount: [5, 10] },
      },
      [CrateType.GOLD]: {
        money: { chance: 0.3, min: 5000, max: 10000 },
        component: { chance: 0.5, level: [4, 5] },
        pilot: { chance: 0.17, level: [4, 5] },
        max: { chance: 0.03, amount: [10, 20] },
      },
      [CrateType.SEASON_REWARD]: {
        money: { chance: 0.2, min: 10000, max: 20000 },
        component: { chance: 0.6, level: [4, 5] },
        pilot: { chance: 0.15, level: [4, 5] },
        max: { chance: 0.05, amount: [20, 50] },
      },
    };

    const config = configs[type];
    const numRewards = type === CrateType.DAILY ? 1 : type === CrateType.SEASON_REWARD ? 5 : 2;

    for (let i = 0; i < numRewards; i++) {
      const rand = Math.random();
      let cumulative = 0;

      for (const [rewardType, settings] of Object.entries(config)) {
        cumulative += settings.chance;

        if (rand <= cumulative) {
          if (rewardType === 'money') {
            rewards.push({
              rewardType: 'money',
              amount:
                Math.floor(Math.random() * (settings.max - settings.min + 1)) +
                settings.min,
            });
          } else if (rewardType === 'component') {
            const level =
              settings.level[
                Math.floor(Math.random() * settings.level.length)
              ];
            const component = await this.getRandomComponent(level);
            rewards.push({
              rewardType: 'component',
              rewardId: component.id,
            });
          } else if (rewardType === 'pilot') {
            const level =
              settings.level[
                Math.floor(Math.random() * settings.level.length)
              ];
            const pilot = await PilotService.createRandomPilot(level);
            rewards.push({
              rewardType: 'pilot',
              rewardId: pilot.id,
            });
          } else if (rewardType === 'max') {
            const amount =
              Math.floor(
                Math.random() * (settings.amount[1] - settings.amount[0] + 1)
              ) + settings.amount[0];
            rewards.push({
              rewardType: 'max_currency',
              amount,
            });
          }
          break;
        }
      }
    }

    return rewards;
  }

  /**
   * Получить случайный компонент уровня
   */
  private static async getRandomComponent(level: number): Promise<any> {
    const result = await query(
      'SELECT * FROM car_components WHERE level = $1 ORDER BY RANDOM() LIMIT 1',
      [level]
    );

    return result.rows[0];
  }

  /**
   * Применить награду
   */
  private static async applyReward(
    teamId: number,
    reward: { rewardType: string; rewardId?: number; amount?: number }
  ): Promise<void> {
    if (reward.rewardType === 'money') {
      await query('UPDATE teams SET budget = budget + $1 WHERE id = $2', [
        reward.amount,
        teamId,
      ]);
    } else if (reward.rewardType === 'component') {
      await query(
        `INSERT INTO team_components (team_id, component_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [teamId, reward.rewardId]
      );
    } else if (reward.rewardType === 'pilot') {
      await query(
        `INSERT INTO team_pilots (team_id, pilot_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [teamId, reward.rewardId]
      );
    } else if (reward.rewardType === 'max_currency') {
      await query(
        'UPDATE teams SET max_currency = max_currency + $1 WHERE id = $2',
        [reward.amount, teamId]
      );

      await query(
        `INSERT INTO max_transactions (player_id, amount, type, description)
         SELECT player_id, $1, 'reward', 'Crate reward'
         FROM teams WHERE id = $2`,
        [reward.amount, teamId]
      );
    }
  }

  /**
   * Проверить доступность ежедневного набора
   */
  static async canClaimDailyCrate(teamId: number): Promise<boolean> {
    const result = await query(
      'SELECT last_claim_at FROM daily_crate_claims WHERE team_id = $1',
      [teamId]
    );

    if (result.rows.length === 0) {
      return true;
    }

    const lastClaim = new Date(result.rows[0].last_claim_at);
    const now = new Date();
    const hoursSinceLastClaim =
      (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);

    return hoursSinceLastClaim >= DAILY_CRATE_COOLDOWN_HOURS;
  }

  private static mapRowToCrate(row: any): Crate {
    return {
      id: row.id,
      teamId: row.team_id,
      type: row.type,
      status: row.status,
      lockedUntil: row.locked_until ? new Date(row.locked_until) : undefined,
      createdAt: new Date(row.created_at),
      openedAt: row.opened_at ? new Date(row.opened_at) : undefined,
    };
  }

  private static mapRowToCrateReward(row: any): CrateReward {
    return {
      id: row.id,
      crateId: row.crate_id,
      rewardType: row.reward_type,
      rewardId: row.reward_id,
      amount: row.amount,
      createdAt: new Date(row.created_at),
    };
  }
}
