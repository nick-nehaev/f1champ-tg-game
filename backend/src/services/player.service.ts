import { query } from '../db';
import { Player, Team, INITIAL_BUDGET } from '@f1champ/shared';

export class PlayerService {
  /**
   * Получить или создать игрока по Telegram ID
   */
  static async getOrCreatePlayer(telegramData: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
  }): Promise<Player> {
    // Проверяем, существует ли игрок
    let result = await query(
      'SELECT * FROM players WHERE telegram_id = $1',
      [telegramData.id]
    );

    if (result.rows.length > 0) {
      return this.mapRowToPlayer(result.rows[0]);
    }

    // Создаем нового игрока
    result = await query(
      `INSERT INTO players (telegram_id, username, first_name, last_name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        telegramData.id,
        telegramData.username,
        telegramData.first_name,
        telegramData.last_name,
      ]
    );

    return this.mapRowToPlayer(result.rows[0]);
  }

  /**
   * Получить команду игрока
   */
  static async getPlayerTeam(playerId: number): Promise<Team | null> {
    const result = await query(
      'SELECT * FROM teams WHERE player_id = $1',
      [playerId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToTeam(result.rows[0]);
  }

  /**
   * Создать команду для игрока
   */
  static async createTeam(
    playerId: number,
    name: string,
    color: string
  ): Promise<Team> {
    // Проверяем, есть ли уже команда
    const existing = await this.getPlayerTeam(playerId);
    if (existing) {
      throw new Error('Player already has a team');
    }

    // Создаем команду
    const result = await query(
      `INSERT INTO teams (player_id, name, color, budget)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [playerId, name, color, INITIAL_BUDGET]
    );

    const team = this.mapRowToTeam(result.rows[0]);

    // Создаем машину с базовыми компонентами
    await this.createInitialCar(team.id);

    return team;
  }

  /**
   * Создать начальную машину с базовыми компонентами
   */
  private static async createInitialCar(teamId: number): Promise<void> {
    // Получаем базовые компоненты (level 1, cost 0)
    const components = await query(
      `SELECT id, type FROM car_components WHERE level = 1 AND cost = 0`
    );

    const componentMap: Record<string, number> = {};
    for (const comp of components.rows) {
      componentMap[comp.type] = comp.id;
    }

    // Создаем машину
    await query(
      `INSERT INTO cars (team_id, engine_id, chassis_id, aerodynamics_id, tires_id, electronics_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        teamId,
        componentMap.engine,
        componentMap.chassis,
        componentMap.aerodynamics,
        componentMap.tires,
        componentMap.electronics,
      ]
    );

    // Добавляем базовые компоненты в инвентарь команды
    for (const compId of Object.values(componentMap)) {
      await query(
        `INSERT INTO team_components (team_id, component_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [teamId, compId]
      );
    }
  }

  private static mapRowToPlayer(row: any): Player {
    return {
      id: row.id,
      telegramId: row.telegram_id,
      username: row.username,
      firstName: row.first_name,
      lastName: row.last_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapRowToTeam(row: any): Team {
    return {
      id: row.id,
      playerId: row.player_id,
      name: row.name,
      color: row.color,
      budget: row.budget,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
