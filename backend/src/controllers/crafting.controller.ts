import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CraftingService } from '../services/crafting.service';
import { PlayerService } from '../services/player.service';
import { ApiResponse } from '@f1champ/shared';

export class CraftingController {
  /**
   * Крафт компонента
   */
  static async craftComponent(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { componentIds } = req.body;

      if (!componentIds || !Array.isArray(componentIds)) {
        return res
          .status(400)
          .json({ error: 'componentIds must be an array' });
      }

      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);

      if (!team) {
        return res.status(400).json({ error: 'Team not found' });
      }

      const result = await CraftingService.craftComponent(
        team.id,
        componentIds
      );

      const response: ApiResponse<any> = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error in craftComponent:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * Получить доступные для крафта группы
   */
  static async getAvailableCrafts(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);

      if (!team) {
        return res.status(400).json({ error: 'Team not found' });
      }

      const crafts = await CraftingService.getAvailableCrafts(team.id);

      const response: ApiResponse<any> = {
        success: true,
        data: crafts,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error in getAvailableCrafts:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
