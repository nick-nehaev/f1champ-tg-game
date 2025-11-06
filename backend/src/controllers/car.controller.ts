import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PlayerService } from '../services/player.service';
import { CarService } from '../services/car.service';
import { ApiResponse } from '@f1champ/shared';

export class CarController {
  /**
   * Получить машину команды
   */
  static async getCar(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const car = await CarService.getTeamCar(team.id);
      const stats = await CarService.calculateCarStats(team.id);

      const response: ApiResponse<any> = {
        success: true,
        data: { car, stats },
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getCar:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Получить все доступные компоненты
   */
  static async getAllComponents(req: AuthRequest, res: Response) {
    try {
      const components = await CarService.getAllComponents();

      const response: ApiResponse<any> = {
        success: true,
        data: components,
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getAllComponents:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Получить компоненты команды
   */
  static async getTeamComponents(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const components = await CarService.getTeamComponents(team.id);

      const response: ApiResponse<any> = {
        success: true,
        data: components,
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getTeamComponents:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Купить компонент
   */
  static async buyComponent(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { componentId } = req.body;

      if (!componentId) {
        return res.status(400).json({ error: 'Component ID is required' });
      }

      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      await CarService.buyComponent(team.id, componentId);

      const response: ApiResponse<any> = {
        success: true,
        data: { message: 'Component purchased successfully' },
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error in buyComponent:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Обновить машину
   */
  static async updateCar(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { engineId, chassisId, aerodynamicsId, tiresId, electronicsId } =
        req.body;

      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);

      if (!team) {
        return res.status(404).json({ error: 'Team not found' });
      }

      const car = await CarService.updateCar(team.id, {
        engineId,
        chassisId,
        aerodynamicsId,
        tiresId,
        electronicsId,
      });

      const response: ApiResponse<any> = {
        success: true,
        data: car,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error in updateCar:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
