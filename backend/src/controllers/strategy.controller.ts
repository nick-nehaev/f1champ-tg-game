import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { StrategyService } from '../services/strategy.service';
import { PlayerService } from '../services/player.service';
import { ApiResponse, PitStop } from '@f1champ/shared';

export class StrategyController {
  /**
   * Установить стратегию для гонки
   */
  static async setStrategy(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { raceId } = req.params;
      const { pitStops } = req.body;

      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);

      if (!team) {
        return res.status(400).json({ error: 'Team not found' });
      }

      // TODO: Получить количество кругов для гонки
      const totalLaps = 50; // Пока захардкодим

      if (!StrategyService.validateStrategy(pitStops, totalLaps)) {
        return res.status(400).json({ error: 'Invalid strategy' });
      }

      const strategy = await StrategyService.setStrategy(
        parseInt(raceId),
        team.id,
        pitStops
      );

      const response: ApiResponse<any> = {
        success: true,
        data: strategy,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error in setStrategy:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Получить стратегию для гонки
   */
  static async getStrategy(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { raceId } = req.params;

      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);

      if (!team) {
        return res.status(400).json({ error: 'Team not found' });
      }

      const strategy = await StrategyService.getStrategy(
        parseInt(raceId),
        team.id
      );

      const response: ApiResponse<any> = {
        success: true,
        data: strategy,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error in getStrategy:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
