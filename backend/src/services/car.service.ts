import { query } from '../db';
import { Car, CarComponent, CarStats } from '@f1champ/shared';

export class CarService {
  /**
   * Получить машину команды
   */
  static async getTeamCar(teamId: number): Promise<Car | null> {
    const result = await query(
      'SELECT * FROM cars WHERE team_id = $1',
      [teamId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToCar(result.rows[0]);
  }

  /**
   * Получить все доступные компоненты
   */
  static async getAllComponents(): Promise<CarComponent[]> {
    const result = await query(
      'SELECT * FROM car_components ORDER BY type, level'
    );

    return result.rows.map(this.mapRowToComponent);
  }

  /**
   * Получить компоненты команды (купленные)
   */
  static async getTeamComponents(teamId: number): Promise<CarComponent[]> {
    const result = await query(
      `SELECT c.* FROM car_components c
       INNER JOIN team_components tc ON tc.component_id = c.id
       WHERE tc.team_id = $1
       ORDER BY c.type, c.level`,
      [teamId]
    );

    return result.rows.map(this.mapRowToComponent);
  }

  /**
   * Купить компонент
   */
  static async buyComponent(
    teamId: number,
    componentId: number
  ): Promise<void> {
    // Получаем компонент
    const compResult = await query(
      'SELECT * FROM car_components WHERE id = $1',
      [componentId]
    );

    if (compResult.rows.length === 0) {
      throw new Error('Component not found');
    }

    const component = this.mapRowToComponent(compResult.rows[0]);

    // Проверяем, не куплен ли уже
    const ownedResult = await query(
      'SELECT * FROM team_components WHERE team_id = $1 AND component_id = $2',
      [teamId, componentId]
    );

    if (ownedResult.rows.length > 0) {
      throw new Error('Component already owned');
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
    if (budget < component.cost) {
      throw new Error('Insufficient budget');
    }

    // Покупаем компонент
    await query('BEGIN');
    try {
      // Списываем деньги
      await query(
        'UPDATE teams SET budget = budget - $1 WHERE id = $2',
        [component.cost, teamId]
      );

      // Добавляем компонент
      await query(
        'INSERT INTO team_components (team_id, component_id) VALUES ($1, $2)',
        [teamId, componentId]
      );

      await query('COMMIT');
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  }

  /**
   * Обновить компоненты машины
   */
  static async updateCar(
    teamId: number,
    components: {
      engineId?: number;
      chassisId?: number;
      aerodynamicsId?: number;
      tiresId?: number;
      electronicsId?: number;
    }
  ): Promise<Car> {
    // Проверяем, что все компоненты принадлежат команде
    const componentIds = Object.values(components).filter(
      (id) => id !== undefined
    );

    if (componentIds.length > 0) {
      const ownedResult = await query(
        `SELECT component_id FROM team_components
         WHERE team_id = $1 AND component_id = ANY($2)`,
        [teamId, componentIds]
      );

      if (ownedResult.rows.length !== componentIds.length) {
        throw new Error('Some components are not owned by the team');
      }
    }

    // Обновляем машину
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (components.engineId !== undefined) {
      updates.push(`engine_id = $${paramIndex++}`);
      values.push(components.engineId);
    }
    if (components.chassisId !== undefined) {
      updates.push(`chassis_id = $${paramIndex++}`);
      values.push(components.chassisId);
    }
    if (components.aerodynamicsId !== undefined) {
      updates.push(`aerodynamics_id = $${paramIndex++}`);
      values.push(components.aerodynamicsId);
    }
    if (components.tiresId !== undefined) {
      updates.push(`tires_id = $${paramIndex++}`);
      values.push(components.tiresId);
    }
    if (components.electronicsId !== undefined) {
      updates.push(`electronics_id = $${paramIndex++}`);
      values.push(components.electronicsId);
    }

    values.push(teamId);

    const result = await query(
      `UPDATE cars SET ${updates.join(', ')}
       WHERE team_id = $${paramIndex}
       RETURNING *`,
      values
    );

    return this.mapRowToCar(result.rows[0]);
  }

  /**
   * Рассчитать характеристики машины
   */
  static async calculateCarStats(teamId: number): Promise<CarStats> {
    const car = await this.getTeamCar(teamId);
    if (!car) {
      throw new Error('Car not found');
    }

    // Получаем все установленные компоненты
    const componentIds = [
      car.engineId,
      car.chassisId,
      car.aerodynamicsId,
      car.tiresId,
      car.electronicsId,
    ].filter((id) => id !== null && id !== undefined);

    if (componentIds.length === 0) {
      return {
        totalPower: 0,
        totalReliability: 0,
        totalHandling: 0,
        totalSpeed: 0,
        totalGrip: 0,
        totalStability: 0,
        overallRating: 0,
      };
    }

    const result = await query(
      `SELECT * FROM car_components WHERE id = ANY($1)`,
      [componentIds]
    );

    const components = result.rows.map(this.mapRowToComponent);

    // Суммируем характеристики
    const stats: CarStats = {
      totalPower: 0,
      totalReliability: 0,
      totalHandling: 0,
      totalSpeed: 0,
      totalGrip: 0,
      totalStability: 0,
      overallRating: 0,
    };

    for (const comp of components) {
      stats.totalPower += comp.power;
      stats.totalReliability += comp.reliability;
      stats.totalHandling += comp.handling;
      stats.totalSpeed += comp.speed;
      stats.totalGrip += comp.grip;
      stats.totalStability += comp.stability;
    }

    // Общий рейтинг - средневзвешенная характеристик
    stats.overallRating = Math.round(
      (stats.totalPower +
        stats.totalReliability +
        stats.totalHandling +
        stats.totalSpeed +
        stats.totalGrip +
        stats.totalStability) /
        6
    );

    return stats;
  }

  private static mapRowToCar(row: any): Car {
    return {
      id: row.id,
      teamId: row.team_id,
      engineId: row.engine_id,
      chassisId: row.chassis_id,
      aerodynamicsId: row.aerodynamics_id,
      tiresId: row.tires_id,
      electronicsId: row.electronics_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private static mapRowToComponent(row: any): CarComponent {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      level: row.level,
      power: row.power,
      reliability: row.reliability,
      handling: row.handling,
      speed: row.speed,
      grip: row.grip,
      stability: row.stability,
      cost: row.cost,
    };
  }
}
