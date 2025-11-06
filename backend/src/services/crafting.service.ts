import pool from '../db';
import { CRAFTING_RECIPE } from '@f1champ/shared';

export class CraftingService {
  /**
   * Крафт компонента из 20 одинаковых компонентов
   */
  static async craftComponent(
    teamId: number,
    componentIds: number[]
  ): Promise<any> {
    // Проверяем количество компонентов
    if (componentIds.length !== CRAFTING_RECIPE.requiredCount) {
      throw new Error(
        `Требуется ${CRAFTING_RECIPE.requiredCount} компонентов для крафта`
      );
    }

    // Получаем все компоненты команды
    const query = `
      SELECT tc.id, tc.component_id, c.type, c.level
      FROM team_components tc
      JOIN components c ON c.id = tc.component_id
      WHERE tc.team_id = $1 AND tc.id = ANY($2)
    `;

    const result = await pool.query(query, [teamId, componentIds]);

    if (result.rows.length !== CRAFTING_RECIPE.requiredCount) {
      throw new Error('Некоторые компоненты не найдены');
    }

    // Проверяем, что все компоненты одинакового типа и уровня
    const firstComponent = result.rows[0];
    const type = firstComponent.type;
    const level = firstComponent.level;

    for (const row of result.rows) {
      if (row.type !== type || row.level !== level) {
        throw new Error(
          'Все компоненты должны быть одинакового типа и уровня'
        );
      }
    }

    // Проверяем максимальный уровень
    if (level >= 5) {
      throw new Error('Нельзя улучшить компоненты максимального уровня');
    }

    // Начинаем транзакцию
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Удаляем использованные компоненты
      const deleteQuery = `
        DELETE FROM team_components
        WHERE id = ANY($1)
      `;
      await client.query(deleteQuery, [componentIds]);

      // Получаем компонент следующего уровня того же типа
      const nextLevelQuery = `
        SELECT id FROM components
        WHERE type = $1 AND level = $2
        LIMIT 1
      `;
      const nextLevelResult = await client.query(nextLevelQuery, [
        type,
        level + 1,
      ]);

      if (nextLevelResult.rows.length === 0) {
        throw new Error('Компонент следующего уровня не найден');
      }

      const newComponentId = nextLevelResult.rows[0].id;

      // Добавляем новый компонент команде
      const insertQuery = `
        INSERT INTO team_components (team_id, component_id)
        VALUES ($1, $2)
        RETURNING *
      `;
      const insertResult = await client.query(insertQuery, [
        teamId,
        newComponentId,
      ]);

      // Получаем полную информацию о новом компоненте
      const newComponentQuery = `
        SELECT tc.*, c.type, c.level, c.stats, c.cost
        FROM team_components tc
        JOIN components c ON c.id = tc.component_id
        WHERE tc.id = $1
      `;
      const newComponentResult = await client.query(newComponentQuery, [
        insertResult.rows[0].id,
      ]);

      await client.query('COMMIT');

      return {
        newComponent: newComponentResult.rows[0],
        consumedComponents: componentIds,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Проверить возможность крафта
   */
  static async canCraft(
    teamId: number,
    componentType: string,
    level: number
  ): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM team_components tc
      JOIN components c ON c.id = tc.component_id
      WHERE tc.team_id = $1 AND c.type = $2 AND c.level = $3
    `;

    const result = await pool.query(query, [teamId, componentType, level]);
    const count = parseInt(result.rows[0].count);

    return count >= CRAFTING_RECIPE.requiredCount && level < 5;
  }

  /**
   * Получить доступные для крафта группы компонентов
   */
  static async getAvailableCrafts(teamId: number): Promise<any[]> {
    const query = `
      SELECT c.type, c.level, COUNT(*) as count
      FROM team_components tc
      JOIN components c ON c.id = tc.component_id
      WHERE tc.team_id = $1 AND c.level < 5
      GROUP BY c.type, c.level
      HAVING COUNT(*) >= $2
    `;

    const result = await pool.query(query, [
      teamId,
      CRAFTING_RECIPE.requiredCount,
    ]);

    return result.rows.map((row: any) => ({
      type: row.type,
      level: parseInt(row.level),
      count: parseInt(row.count),
      possibleCrafts: Math.floor(
        parseInt(row.count) / CRAFTING_RECIPE.requiredCount
      ),
      resultLevel: parseInt(row.level) + 1,
    }));
  }
}
