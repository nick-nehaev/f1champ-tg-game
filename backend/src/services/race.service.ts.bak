import { query } from '../db';
import {
  Race,
  RaceResult,
  RaceStatus,
  WeatherCondition,
  StandingsEntry,
  RACE_POINTS,
  FASTEST_LAP_POINTS,
} from '@f1champ/shared';
import { CarService } from './car.service';

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
   * Провести гонку
   */
  static async runRace(raceId: number): Promise<RaceResult[]> {
    // Обновляем статус гонки
    await query(
      "UPDATE races SET status = $1 WHERE id = $2",
      [RaceStatus.IN_PROGRESS, raceId]
    );

    // Получаем все команды
    const teamsResult = await query('SELECT id FROM teams');
    const teams = teamsResult.rows;

    if (teams.length === 0) {
      throw new Error('No teams to race');
    }

    // Рассчитываем результаты для каждой команды
    const raceResults: Array<{
      teamId: number;
      score: number;
      dnf: boolean;
      dnfReason?: string;
    }> = [];

    for (const team of teams) {
      const stats = await CarService.calculateCarStats(team.id);

      // Случайность: 70% зависит от характеристик, 30% от случайности
      const randomFactor = Math.random() * 0.3;
      const performanceFactor = (stats.overallRating / 650) * 0.7; // 650 - максимальная сумма всех характеристик
      const totalScore = (performanceFactor + randomFactor) * 1000;

      // Шанс DNF зависит от надежности (чем выше, тем меньше шанс)
      const reliabilityFactor = stats.totalReliability / 450; // 450 - максимальная надежность
      const dnfChance = Math.max(0.05, 0.3 - reliabilityFactor * 0.25); // от 5% до 30%

      const dnf = Math.random() < dnfChance;
      const dnfReasons = [
        'Отказ двигателя',
        'Проблемы с электроникой',
        'Повреждение шасси',
        'Проблемы с трансмиссией',
        'Авария',
      ];

      raceResults.push({
        teamId: team.id,
        score: dnf ? 0 : totalScore,
        dnf,
        dnfReason: dnf ? dnfReasons[Math.floor(Math.random() * dnfReasons.length)] : undefined,
      });
    }

    // Сортируем по очкам
    raceResults.sort((a, b) => b.score - a.score);

    // Определяем fastest lap (случайно среди топ-5)
    const fastestLapIndex = Math.floor(Math.random() * Math.min(5, raceResults.length));

    // Сохраняем результаты
    const results: RaceResult[] = [];

    for (let i = 0; i < raceResults.length; i++) {
      const result = raceResults[i];
      const position = i + 1;
      const points = result.dnf ? 0 : (RACE_POINTS[i] || 0);
      const fastestLap = i === fastestLapIndex && !result.dnf;
      const totalPoints = points + (fastestLap ? FASTEST_LAP_POINTS : 0);

      const dbResult = await query(
        `INSERT INTO race_results (race_id, team_id, position, points, fastest_lap, dnf, dnf_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [raceId, result.teamId, position, totalPoints, fastestLap, result.dnf, result.dnfReason]
      );

      results.push(this.mapRowToRaceResult(dbResult.rows[0]));
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

    return result.rows.map((row, index) => ({
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
