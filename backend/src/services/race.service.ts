import { query } from '../db';
import {
  Race,
  RaceResult,
  RaceStatus,
  WeatherCondition,
  StandingsEntry,
  RACE_POINTS,
  FASTEST_LAP_POINTS,
  CrateType,
} from '@f1champ/shared';
import { CarService } from './car.service';
import { PilotService } from './pilot.service';
import { QualificationService } from './qualification.service';
import { CrateService } from './crate.service';
import { RaceSimulationService } from './race-simulation.service';

export class RaceService {
  /**
   * Получить активный сезон
   */
  static async getActiveSeason() {
    const result = await query(
      'SELECT * FROM seasons WHERE is_active = true LIMIT 1'
    );
    return result.rows[0] || null;
  }

  /**
   * Получить все гонки сезона
   */
  static async getSeasonRaces(seasonId: number): Promise<Race[]> {
    const result = await query(
      'SELECT * FROM races WHERE season_id = $1 ORDER BY scheduled_date',
      [seasonId]
    );

    return result.rows.map(this.mapRowToRace);
  }

  /**
   * Получить следующую гонку
   */
  static async getNextRace(): Promise<Race | null> {
    const season = await this.getActiveSeason();
    if (!season) return null;

    const result = await query(
      `SELECT * FROM races
       WHERE season_id = $1 AND status = $2
       ORDER BY scheduled_date LIMIT 1`,
      [season.id, RaceStatus.SCHEDULED]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToRace(result.rows[0]);
  }

  /**
   * Создать новую гонку
   */
  static async createRace(
    seasonId: number,
    name: string,
    track: string,
    scheduledDate: Date
  ): Promise<Race> {
    const weather = this.randomWeather();

    const result = await query(
      `INSERT INTO races (season_id, name, track, scheduled_date, weather)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [seasonId, name, track, scheduledDate, weather]
    );

    return this.mapRowToRace(result.rows[0]);
  }

  /**
   * Провести гонку с детальной симуляцией
   */
  static async runRace(raceId: number): Promise<RaceResult[]> {
    // Получаем информацию о гонке
    const raceResult = await query('SELECT * FROM races WHERE id = $1', [raceId]);
    if (raceResult.rows.length === 0) {
      throw new Error('Race not found');
    }

    const race = this.mapRowToRace(raceResult.rows[0]);

    // Обновляем статус гонки
    await query(
      "UPDATE races SET status = $1 WHERE id = $2",
      [RaceStatus.IN_PROGRESS, raceId]
    );

    // Запускаем детальную симуляцию
    const simulationResult = await RaceSimulationService.runDetailedRace(raceId, race.track);

    // Сохраняем результаты из симуляции
    const results: RaceResult[] = [];

    // Определяем fastest lap из lap data
    const allLaps = simulationResult.lapData.filter((ld) => !ld.isInPit);
    const fastestLapData = allLaps.reduce((min, ld) =>
      ld.lapTime < min.lapTime ? ld : min
    );

    for (const finalResult of simulationResult.finalResults) {
      const fastestLap = fastestLapData.teamId === finalResult.teamId && finalResult.position <= 10;

      const dbResult = await query(
        `INSERT INTO race_results (race_id, team_id, position, points, fastest_lap, dnf, dnf_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          raceId,
          finalResult.teamId,
          finalResult.position,
          finalResult.points,
          fastestLap,
          finalResult.dnf,
          finalResult.dnfReason
        ]
      );

      results.push(this.mapRowToRaceResult(dbResult.rows[0]));

      // Выдаем призовые кейсы за топ-3
      if (!finalResult.dnf) {
        try {
          if (finalResult.position === 1) {
            await CrateService.createPrizeCrate(finalResult.teamId, CrateType.GOLD);
          } else if (finalResult.position === 2) {
            await CrateService.createPrizeCrate(finalResult.teamId, CrateType.SILVER);
          } else if (finalResult.position === 3) {
            await CrateService.createPrizeCrate(finalResult.teamId, CrateType.BRONZE);
          }
        } catch (error) {
          console.error('Error creating prize crate:', error);
        }
      }
    }

    // Обновляем статус гонки
    await query(
      "UPDATE races SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2",
      [RaceStatus.COMPLETED, raceId]
    );

    return results;
  }

  /**
   * Получить результаты гонки
   */
  static async getRaceResults(raceId: number): Promise<RaceResult[]> {
    const result = await query(
      'SELECT * FROM race_results WHERE race_id = $1 ORDER BY position',
      [raceId]
    );

    return result.rows.map(this.mapRowToRaceResult);
  }

  /**
   * Получить таблицу чемпионата
   */
  static async getStandings(seasonId: number): Promise<StandingsEntry[]> {
    const result = await query(
      `SELECT
         t.id as team_id,
         t.name as team_name,
         t.color as team_color,
         p.username as player_username,
         COALESCE(SUM(rr.points), 0) as total_points,
         COUNT(CASE WHEN rr.position = 1 THEN 1 END) as wins,
         COUNT(CASE WHEN rr.position <= 3 THEN 1 END) as podiums,
         COUNT(CASE WHEN rr.fastest_lap = true THEN 1 END) as fastest_laps,
         COUNT(rr.id) as races
       FROM teams t
       INNER JOIN players p ON p.id = t.player_id
       LEFT JOIN race_results rr ON rr.team_id = t.id
       LEFT JOIN races r ON r.id = rr.race_id AND r.season_id = $1
       GROUP BY t.id, t.name, t.color, p.username
       ORDER BY total_points DESC, wins DESC, podiums DESC`,
      [seasonId]
    );

    return result.rows.map((row: any, index: number) => ({
      teamId: row.team_id,
      teamName: row.team_name,
      teamColor: row.team_color,
      playerUsername: row.player_username,
      totalPoints: parseInt(row.total_points),
      wins: parseInt(row.wins),
      podiums: parseInt(row.podiums),
      fastestLaps: parseInt(row.fastest_laps),
      races: parseInt(row.races),
      position: index + 1,
    }));
  }

  private static randomWeather(): WeatherCondition {
    const rand = Math.random();
    if (rand < 0.5) return WeatherCondition.SUNNY;
    if (rand < 0.75) return WeatherCondition.CLOUDY;
    if (rand < 0.92) return WeatherCondition.RAINY;
    return WeatherCondition.STORMY;
  }

  private static mapRowToRace(row: any): Race {
    return {
      id: row.id,
      seasonId: row.season_id,
      name: row.name,
      track: row.track,
      scheduledDate: row.scheduled_date,
      status: row.status,
      weather: row.weather,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    };
  }

  private static mapRowToRaceResult(row: any): RaceResult {
    return {
      id: row.id,
      raceId: row.race_id,
      teamId: row.team_id,
      position: row.position,
      points: row.points,
      fastestLap: row.fastest_lap,
      dnf: row.dnf,
      dnfReason: row.dnf_reason,
      createdAt: row.created_at,
    };
  }
}
