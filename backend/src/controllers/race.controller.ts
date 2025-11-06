import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { RaceService } from '../services/race.service';
import { RaceSimulationService } from '../services/race-simulation.service';
import { ApiResponse } from '@f1champ/shared';

export class RaceController {
  /**
   * Получить активный сезон
   */
  static async getActiveSeason(req: AuthRequest, res: Response) {
    try {
      const season = await RaceService.getActiveSeason();

      const response: ApiResponse<any> = {
        success: true,
        data: season,
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getActiveSeason:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Получить гонки сезона
   */
  static async getSeasonRaces(req: AuthRequest, res: Response) {
    try {
      const season = await RaceService.getActiveSeason();
      if (!season) {
        return res.status(404).json({ error: 'No active season' });
      }

      const races = await RaceService.getSeasonRaces(season.id);

      const response: ApiResponse<any> = {
        success: true,
        data: races,
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getSeasonRaces:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Получить следующую гонку
   */
  static async getNextRace(req: AuthRequest, res: Response) {
    try {
      const race = await RaceService.getNextRace();

      const response: ApiResponse<any> = {
        success: true,
        data: race,
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getNextRace:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Получить результаты гонки
   */
  static async getRaceResults(req: AuthRequest, res: Response) {
    try {
      const { raceId } = req.params;
      const results = await RaceService.getRaceResults(parseInt(raceId));

      const response: ApiResponse<any> = {
        success: true,
        data: results,
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getRaceResults:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Получить таблицу чемпионата
   */
  static async getStandings(req: AuthRequest, res: Response) {
    try {
      const season = await RaceService.getActiveSeason();
      if (!season) {
        return res.status(404).json({ error: 'No active season' });
      }

      const standings = await RaceService.getStandings(season.id);

      const response: ApiResponse<any> = {
        success: true,
        data: standings,
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getStandings:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Запустить гонку (только для разработки/тестирования)
   */
  static async runRace(req: AuthRequest, res: Response) {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({ error: 'Not allowed in production' });
      }

      const { raceId } = req.params;
      const results = await RaceService.runRace(parseInt(raceId));

      const response: ApiResponse<any> = {
        success: true,
        data: results,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error in runRace:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Получить lap data для гонки (для визуализации)
   */
  static async getLapData(req: AuthRequest, res: Response) {
    try {
      const { raceId } = req.params;
      const lapData = await RaceSimulationService.getLapData(parseInt(raceId));

      const response: ApiResponse<any> = {
        success: true,
        data: lapData,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error in getLapData:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Получить данные визуализации для конкретного круга
   */
  static async getVisualizationForLap(req: AuthRequest, res: Response) {
    try {
      const { raceId, lap } = req.params;
      const visualization = await RaceSimulationService.getVisualizationForLap(
        parseInt(raceId),
        parseInt(lap)
      );

      const response: ApiResponse<any> = {
        success: true,
        data: visualization,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error in getVisualizationForLap:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
