import pool from '../db';
import {
  TireType,
  TIRE_CHARACTERISTICS,
  PIT_STOP_TIME,
  LapData,
  RaceSimulationResult,
  TRACKS,
  RACE_POINTS,
  FASTEST_LAP_POINTS,
} from '@f1champ/shared';
import { CarService } from './car.service';
import { PilotService } from './pilot.service';
import { QualificationService } from './qualification.service';
import { StrategyService } from './strategy.service';

interface TeamRaceState {
  teamId: number;
  teamName: string;
  teamColor: string;
  currentTire: TireType;
  tireAge: number;
  totalTime: number; // в миллисекундах
  baseLapTime: number; // базовое время круга
  dnf: boolean;
  dnfReason?: string;
  pitStops: Array<{ lap: number; tireType: TireType }>;
  completedPitStops: number;
}

export class RaceSimulationService {
  /**
   * Запустить детальную симуляцию гонки
   */
  static async runDetailedRace(raceId: number, trackName: string): Promise<RaceSimulationResult> {
    const track = TRACKS[trackName];
    if (!track) {
      throw new Error(`Track ${trackName} not found`);
    }

    const totalLaps = track.totalLaps;

    // Получаем квалификацию
    let qualificationResults = await QualificationService.getQualificationResults(raceId);
    if (qualificationResults.length === 0) {
      qualificationResults = await QualificationService.runQualification(raceId);
    }

    // Получаем все команды
    const teamsResult = await pool.query(
      'SELECT id, name, color, pilot1_id, pilot2_id FROM teams'
    );
    const teams = teamsResult.rows;

    if (teams.length === 0) {
      throw new Error('No teams to race');
    }

    // Инициализируем состояние каждой команды
    const teamStates: TeamRaceState[] = [];

    for (const team of teams) {
      // Получаем стратегию или создаем дефолтную
      let strategy = await StrategyService.getStrategy(raceId, team.id);
      if (!strategy) {
        strategy = await StrategyService.createDefaultStrategy(raceId, team.id, totalLaps);
      }

      // Вычисляем базовое время круга
      const baseLapTime = await this.calculateBaseLapTime(
        team.id,
        team.pilot1_id,
        team.pilot2_id,
        raceId,
        teams.length
      );

      teamStates.push({
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        currentTire: strategy.pitStops[0]?.tireType || TireType.MEDIUM,
        tireAge: 0,
        totalTime: 0,
        baseLapTime,
        dnf: false,
        pitStops: strategy.pitStops,
        completedPitStops: 0,
      });
    }

    // Симулируем гонку круг за кругом
    const allLapData: LapData[] = [];

    for (let lap = 1; lap <= totalLaps; lap++) {
      const lapData = await this.simulateLap(lap, teamStates);
      allLapData.push(...lapData);

      // Проверяем и выполняем питстопы
      for (const state of teamStates) {
        if (state.dnf) continue;

        const nextPitStop = state.pitStops[state.completedPitStops];
        if (nextPitStop && nextPitStop.lap === lap) {
          // Питстоп!
          state.totalTime += PIT_STOP_TIME;
          state.currentTire = nextPitStop.tireType;
          state.tireAge = 0;
          state.completedPitStops++;

          // Обновляем lap data для этой команды
          const teamLapData = allLapData.find(
            (ld) => ld.teamId === state.teamId && ld.lap === lap
          );
          if (teamLapData) {
            teamLapData.isInPit = true;
            teamLapData.pitTime = PIT_STOP_TIME;
            teamLapData.totalTime = state.totalTime;
          }
        }
      }
    }

    // Сортируем финальные результаты
    const finishedTeams = teamStates
      .filter((s) => !s.dnf)
      .sort((a, b) => a.totalTime - b.totalTime);

    const dnfTeams = teamStates.filter((s) => s.dnf);

    // Определяем fastest lap
    const fastestLap = allLapData
      .filter((ld) => !ld.isInPit)
      .reduce((min, ld) => (ld.lapTime < min.lapTime ? ld : min));

    // Формируем финальные результаты
    const finalResults = [
      ...finishedTeams.map((state, index) => ({
        teamId: state.teamId,
        position: index + 1,
        totalTime: state.totalTime,
        points: (RACE_POINTS[index] || 0) +
                (fastestLap.teamId === state.teamId && index < 10 ? FASTEST_LAP_POINTS : 0),
        dnf: false,
      })),
      ...dnfTeams.map((state, index) => ({
        teamId: state.teamId,
        position: finishedTeams.length + index + 1,
        totalTime: state.totalTime,
        points: 0,
        dnf: true,
        dnfReason: state.dnfReason,
      })),
    ];

    // Сохраняем lap data в базу данных
    await this.saveLapData(raceId, allLapData);

    return {
      raceId,
      trackName,
      totalLaps,
      lapData: allLapData,
      finalResults,
    };
  }

  /**
   * Симулировать один круг для всех команд
   */
  private static async simulateLap(
    lap: number,
    teamStates: TeamRaceState[]
  ): Promise<LapData[]> {
    const lapData: LapData[] = [];

    for (const state of teamStates) {
      if (state.dnf) {
        continue;
      }

      // Вычисляем время круга
      const lapTime = this.calculateLapTime(state);

      // Проверяем DNF
      if (this.checkDNF(state)) {
        state.dnf = true;
        state.dnfReason = this.getRandomDNFReason();
        continue;
      }

      state.totalTime += lapTime;
      state.tireAge++;

      lapData.push({
        lap,
        teamId: state.teamId,
        position: 0, // будет обновлено после сортировки
        lapTime,
        tireType: state.currentTire,
        tireAge: state.tireAge,
        isInPit: false,
        totalTime: state.totalTime,
      });
    }

    // Сортируем по общему времени и присваиваем позиции
    const activeLapData = lapData.filter((ld) => !teamStates.find(s => s.teamId === ld.teamId)?.dnf);
    activeLapData.sort((a, b) => a.totalTime - b.totalTime);

    activeLapData.forEach((ld, index) => {
      ld.position = index + 1;
    });

    return lapData;
  }

  /**
   * Вычислить время круга с учетом износа шин и стратегии
   */
  private static calculateLapTime(state: TeamRaceState): number {
    const tireChar = TIRE_CHARACTERISTICS[state.currentTire];

    // Базовое время * модификатор шин
    let lapTime = state.baseLapTime * (1 / tireChar.speed);

    // Штраф за износ шин
    const wearPenalty = Math.max(
      0,
      (state.tireAge - tireChar.optimalLaps) * tireChar.degradation * 1000
    );

    lapTime += wearPenalty;

    // Небольшая случайность (±2%)
    const randomFactor = 0.98 + Math.random() * 0.04;
    lapTime *= randomFactor;

    return Math.round(lapTime);
  }

  /**
   * Вычислить базовое время круга команды
   */
  private static async calculateBaseLapTime(
    teamId: number,
    pilot1Id: number | null,
    pilot2Id: number | null,
    raceId: number,
    totalTeams: number
  ): Promise<number> {
    // Базовое время круга: 90 секунд = 90000 мс
    const baseTime = 90000;

    // Влияние машины (50%)
    const carStats = await CarService.calculateCarStats(teamId);
    const carFactor = (carStats.overallRating / 650) * 0.5;

    // Влияние пилотов (30%)
    let pilotBonus = 0;
    if (pilot1Id) {
      const pilot1 = await PilotService.getPilotById(pilot1Id);
      if (pilot1) {
        pilotBonus += pilot1.skill * 0.4 + pilot1.experience * 0.3;
      }
    }
    if (pilot2Id) {
      const pilot2 = await PilotService.getPilotById(pilot2Id);
      if (pilot2) {
        pilotBonus += pilot2.skill * 0.4 + pilot2.experience * 0.3;
      }
    }
    if (pilotBonus > 0 && pilot1Id && pilot2Id) {
      pilotBonus /= 2;
    }
    const pilotFactor = (pilotBonus / 100) * 0.3;

    // Влияние квалификации (10%)
    const qualResults = await QualificationService.getQualificationResults(raceId);
    const qualPosition = qualResults.find((q) => q.teamId === teamId)?.position || totalTeams;
    const gridBonus = (totalTeams - qualPosition) * 10;
    const gridFactor = (gridBonus / (totalTeams * 10)) * 0.1;

    // Итоговый коэффициент (чем выше, тем быстрее = меньше время)
    const totalFactor = carFactor + pilotFactor + gridFactor;

    // Время круга: базовое время * (1 - фактор)
    // Максимум -40% от базового времени
    const lapTime = baseTime * (1 - Math.min(0.4, totalFactor));

    return Math.round(lapTime);
  }

  /**
   * Проверить вероятность DNF
   */
  private static checkDNF(state: TeamRaceState): boolean {
    // Базовый шанс DNF: 3% за гонку
    // Распределяем на все круги
    const dnfChancePerLap = 0.03 / 50;

    // Увеличиваем шанс если шины сильно изношены
    const tireChar = TIRE_CHARACTERISTICS[state.currentTire];
    const tireOveruse = Math.max(0, state.tireAge - tireChar.optimalLaps * 1.5);
    const tireRisk = tireOveruse * 0.001;

    return Math.random() < dnfChancePerLap + tireRisk;
  }

  /**
   * Получить случайную причину DNF
   */
  private static getRandomDNFReason(): string {
    const reasons = [
      'Отказ двигателя',
      'Проблемы с электроникой',
      'Повреждение шасси',
      'Проблемы с трансмиссией',
      'Авария',
      'Ошибка пилота',
      'Отказ тормозов',
    ];

    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  /**
   * Сохранить lap data в базу данных
   */
  private static async saveLapData(raceId: number, lapData: LapData[]): Promise<void> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Удаляем старые данные если они есть
      await client.query('DELETE FROM lap_data WHERE race_id = $1', [raceId]);

      // Вставляем новые данные
      for (const ld of lapData) {
        await client.query(
          `INSERT INTO lap_data (
            race_id, team_id, lap, position, lap_time,
            tire_type, tire_age, is_in_pit, pit_time, total_time
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            raceId,
            ld.teamId,
            ld.lap,
            ld.position,
            ld.lapTime,
            ld.tireType,
            ld.tireAge,
            ld.isInPit,
            ld.pitTime,
            ld.totalTime,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Получить lap data для гонки
   */
  static async getLapData(raceId: number): Promise<LapData[]> {
    const result = await pool.query(
      'SELECT * FROM lap_data WHERE race_id = $1 ORDER BY lap, position',
      [raceId]
    );

    return result.rows.map((row: any) => ({
      lap: row.lap,
      teamId: row.team_id,
      position: row.position,
      lapTime: row.lap_time,
      tireType: row.tire_type as TireType,
      tireAge: row.tire_age,
      isInPit: row.is_in_pit,
      pitTime: row.pit_time,
      totalTime: parseInt(row.total_time),
    }));
  }

  /**
   * Получить данные визуализации для конкретного круга
   */
  static async getVisualizationForLap(raceId: number, lap: number): Promise<any> {
    const result = await pool.query(
      `SELECT ld.*, t.name as team_name, t.color as team_color
       FROM lap_data ld
       JOIN teams t ON t.id = ld.team_id
       WHERE ld.race_id = $1 AND ld.lap = $2
       ORDER BY ld.position`,
      [raceId, lap]
    );

    const raceResult = await pool.query(
      'SELECT * FROM races WHERE id = $1',
      [raceId]
    );

    const trackName = raceResult.rows[0]?.track || 'Монако';
    const track = TRACKS[trackName];

    return {
      totalLaps: track?.totalLaps || 50,
      currentLap: lap,
      positions: result.rows.map((row: any) => ({
        teamId: row.team_id,
        teamName: row.team_name,
        teamColor: row.team_color,
        position: row.position,
        progress: 0, // Может быть вычислен для анимации
        isInPit: row.is_in_pit,
        tireType: row.tire_type,
        lapTime: row.lap_time,
      })),
    };
  }
}
