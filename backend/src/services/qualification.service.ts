import { query } from '../db';
import { Qualification } from '@f1champ/shared';
import { CarService } from './car.service';
import { PilotService } from './pilot.service';

export class QualificationService {
  /**
   * Провести квалификацию
   */
  static async runQualification(raceId: number): Promise<Qualification[]> {
    // Получаем все команды
    const teamsResult = await query('SELECT id, pilot1_id, pilot2_id FROM teams');
    const teams = teamsResult.rows;

    if (teams.length === 0) {
      throw new Error('No teams to qualify');
    }

    // Рассчитываем время круга для каждой команды
    const qualificationResults: Array<{
      teamId: number;
      lapTime: number;
    }> = [];

    for (const team of teams) {
      const stats = await CarService.calculateCarStats(team.id);

      // Учитываем пилотов
      let pilotBonus = 0;
      if (team.pilot1_id) {
        const pilot1 = await PilotService.getPilotById(team.pilot1_id);
        if (pilot1) {
          pilotBonus += pilot1.skill * 0.3 + pilot1.experience * 0.2;
        }
      }
      if (team.pilot2_id) {
        const pilot2 = await PilotService.getPilotById(team.pilot2_id);
        if (pilot2) {
          pilotBonus += pilot2.skill * 0.3 + pilot2.experience * 0.2;
        }
      }

      // Средний бонус от пилотов
      if (pilotBonus > 0) {
        pilotBonus = pilotBonus / (team.pilot1_id && team.pilot2_id ? 2 : 1);
      }

      // Рассчитываем базовое время (в миллисекундах)
      // Идеальное время ~80000мс (1:20.000), худшее ~95000мс (1:35.000)
      const baseTime = 95000;
      const performanceFactor = stats.overallRating / 650; // 0 до ~1
      const pilotFactor = pilotBonus / 100; // 0 до ~1
      const randomFactor = (Math.random() * 0.1) - 0.05; // -5% до +5%

      const timeReduction = (performanceFactor * 0.6 + pilotFactor * 0.3) * 15000; // до 15 секунд
      const lapTime = Math.round(baseTime - timeReduction + (baseTime * randomFactor));

      qualificationResults.push({
        teamId: team.id,
        lapTime,
      });
    }

    // Сортируем по времени (меньше = лучше)
    qualificationResults.sort((a, b) => a.lapTime - b.lapTime);

    // Сохраняем результаты
    const results: Qualification[] = [];

    for (let i = 0; i < qualificationResults.length; i++) {
      const result = qualificationResults[i];
      const position = i + 1;

      const dbResult = await query(
        `INSERT INTO qualifications (race_id, team_id, position, lap_time)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [raceId, result.teamId, position, result.lapTime]
      );

      results.push(this.mapRowToQualification(dbResult.rows[0]));
    }

    return results;
  }

  /**
   * Получить результаты квалификации
   */
  static async getQualificationResults(raceId: number): Promise<Qualification[]> {
    const result = await query(
      'SELECT * FROM qualifications WHERE race_id = $1 ORDER BY position',
      [raceId]
    );

    return result.rows.map(this.mapRowToQualification);
  }

  private static mapRowToQualification(row: any): Qualification {
    return {
      id: row.id,
      raceId: row.race_id,
      teamId: row.team_id,
      position: row.position,
      lapTime: row.lap_time,
      createdAt: new Date(row.created_at),
    };
  }
}
