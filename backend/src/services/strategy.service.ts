import pool from '../db';
import { RaceStrategy, PitStop } from '@f1champ/shared';

export class StrategyService {
  /**
   * Создать или обновить стратегию для гонки
   */
  static async setStrategy(
    raceId: number,
    teamId: number,
    pitStops: PitStop[]
  ): Promise<RaceStrategy> {
    const query = `
      INSERT INTO race_strategies (race_id, team_id, pit_stops)
      VALUES ($1, $2, $3)
      ON CONFLICT (race_id, team_id)
      DO UPDATE SET pit_stops = $3, updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await pool.query(query, [
      raceId,
      teamId,
      JSON.stringify(pitStops),
    ]);

    const row = result.rows[0];
    return {
      id: row.id,
      raceId: row.race_id,
      teamId: row.team_id,
      pitStops: JSON.parse(row.pit_stops),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Получить стратегию команды для гонки
   */
  static async getStrategy(
    raceId: number,
    teamId: number
  ): Promise<RaceStrategy | null> {
    const query = `
      SELECT * FROM race_strategies
      WHERE race_id = $1 AND team_id = $2
    `;

    const result = await pool.query(query, [raceId, teamId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      raceId: row.race_id,
      teamId: row.team_id,
      pitStops: JSON.parse(row.pit_stops),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Получить все стратегии для гонки
   */
  static async getRaceStrategies(raceId: number): Promise<RaceStrategy[]> {
    const query = `
      SELECT * FROM race_strategies
      WHERE race_id = $1
    `;

    const result = await pool.query(query, [raceId]);

    return result.rows.map((row: any) => ({
      id: row.id,
      raceId: row.race_id,
      teamId: row.team_id,
      pitStops: JSON.parse(row.pit_stops),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  /**
   * Создать стратегию по умолчанию для команды
   * 1 питстоп на середине гонки со средними шинами
   */
  static async createDefaultStrategy(
    raceId: number,
    teamId: number,
    totalLaps: number
  ): Promise<RaceStrategy> {
    const defaultPitStops: PitStop[] = [
      {
        lap: Math.floor(totalLaps / 2),
        tireType: 'medium' as any,
      },
    ];

    return this.setStrategy(raceId, teamId, defaultPitStops);
  }

  /**
   * Валидация стратегии
   */
  static validateStrategy(pitStops: PitStop[], totalLaps: number): boolean {
    if (!pitStops || pitStops.length === 0) {
      return false;
    }

    // Проверяем, что все питстопы в пределах гонки
    for (const stop of pitStops) {
      if (stop.lap < 1 || stop.lap > totalLaps) {
        return false;
      }
    }

    // Проверяем, что питстопы отсортированы по кругам
    for (let i = 1; i < pitStops.length; i++) {
      if (pitStops[i].lap <= pitStops[i - 1].lap) {
        return false;
      }
    }

    return true;
  }
}
