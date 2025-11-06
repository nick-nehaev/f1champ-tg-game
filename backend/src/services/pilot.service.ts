import { query } from '../db';
import { Pilot } from '@f1champ/shared';
import { generateRandomPilot } from '../utils/pilot-generator';

export class PilotService {
  /**
   * Получить все доступные пилотов
   */
  static async getAllPilots(): Promise<Pilot[]> {
    const result = await query(
      'SELECT * FROM pilots ORDER BY level, cost'
    );

    return result.rows.map(this.mapRowToPilot);
  }

  /**
   * Получить пилотов команды
   */
  static async getTeamPilots(teamId: number): Promise<Pilot[]> {
    const result = await query(
      `SELECT p.* FROM pilots p
       INNER JOIN team_pilots tp ON tp.pilot_id = p.id
       WHERE tp.team_id = $1
       ORDER BY p.level DESC, p.cost DESC`,
      [teamId]
    );

    return result.rows.map(this.mapRowToPilot);
  }

  /**
   * Купить пилота
   */
  static async buyPilot(teamId: number, pilotId: number): Promise<void> {
    // Получаем пилота
    const pilotResult = await query(
      'SELECT * FROM pilots WHERE id = $1',
      [pilotId]
    );

    if (pilotResult.rows.length === 0) {
      throw new Error('Pilot not found');
    }

    const pilot = this.mapRowToPilot(pilotResult.rows[0]);

    // Проверяем, не куплен ли уже
    const ownedResult = await query(
      'SELECT * FROM team_pilots WHERE team_id = $1 AND pilot_id = $2',
      [teamId, pilotId]
    );

    if (ownedResult.rows.length > 0) {
      throw new Error('Pilot already owned');
    }

    // Получаем команду
    const teamResult = await query(
      'SELECT budget FROM teams WHERE id = $1',
      [teamId]
    );

    if (teamResult.rows.length === 0) {
      throw new Error('Team not found');
    }

    const budget = teamResult.rows[0].budget;

    // Проверяем бюджет
    if (budget < pilot.cost) {
      throw new Error('Insufficient budget');
    }

    // Покупаем пилота
    await query('BEGIN');
    try {
      // Списываем деньги
      await query(
        'UPDATE teams SET budget = budget - $1 WHERE id = $2',
        [pilot.cost, teamId]
      );

      // Добавляем пилота
      await query(
        'INSERT INTO team_pilots (team_id, pilot_id) VALUES ($1, $2)',
        [teamId, pilotId]
      );

      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Назначить пилотов в команду
   */
  static async assignPilots(
    teamId: number,
    pilot1Id: number,
    pilot2Id: number
  ): Promise<void> {
    // Проверяем, что оба пилота принадлежат команде
    const ownedResult = await query(
      `SELECT pilot_id FROM team_pilots
       WHERE team_id = $1 AND pilot_id = ANY($2)`,
      [teamId, [pilot1Id, pilot2Id]]
    );

    if (ownedResult.rows.length !== 2) {
      throw new Error('Some pilots are not owned by the team');
    }

    // Назначаем пилотов
    await query(
      'UPDATE teams SET pilot1_id = $1, pilot2_id = $2 WHERE id = $3',
      [pilot1Id, pilot2Id, teamId]
    );
  }

  /**
   * Создать нового случайного пилота
   */
  static async createRandomPilot(level: number): Promise<Pilot> {
    const pilotData = generateRandomPilot(level);

    const result = await query(
      `INSERT INTO pilots (first_name, last_name, level, skill, experience, consistency, aggression, cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        pilotData.firstName,
        pilotData.lastName,
        level,
        pilotData.skill,
        pilotData.experience,
        pilotData.consistency,
        pilotData.aggression,
        pilotData.cost,
      ]
    );

    return this.mapRowToPilot(result.rows[0]);
  }

  /**
   * Получить пилота по ID
   */
  static async getPilotById(id: number): Promise<Pilot | null> {
    const result = await query('SELECT * FROM pilots WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToPilot(result.rows[0]);
  }

  private static mapRowToPilot(row: any): Pilot {
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      level: row.level,
      skill: row.skill,
      experience: row.experience,
      consistency: row.consistency,
      aggression: row.aggression,
      cost: row.cost,
      createdAt: row.created_at,
    };
  }
}
