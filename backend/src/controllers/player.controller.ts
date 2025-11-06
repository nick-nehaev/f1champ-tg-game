import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PlayerService } from '../services/player.service';
import { ApiResponse } from '@f1champ/shared';

export class PlayerController {
  /**
   * Получить информацию об игроке
   */
  static async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);

      const response: ApiResponse<{ player: any; team: any }> = {
        success: true,
        data: { player, team },
      };

      res.json(response);
    } catch (error) {
      console.error('Error in getMe:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }

  /**
   * Создать команду
   */
  static async createTeam(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const { name, color, referralCode } = req.body;

      if (!name || !color) {
        return res.status(400).json({ error: 'Name and color are required' });
      }

      const player = await PlayerService.getOrCreatePlayer(req.user);

      // Если есть реферальный код, находим реферера
      let referrerId: number | undefined;
      if (referralCode) {
        const referrerResult = await import('../db').then((db) =>
          db.query('SELECT id FROM players WHERE telegram_id = $1', [
            parseInt(referralCode),
          ])
        );
        if (referrerResult.rows.length > 0) {
          referrerId = referrerResult.rows[0].id;
        }
      }

      const team = await PlayerService.createTeam(
        player.id,
        name,
        color,
        referrerId
      );

      const response: ApiResponse<any> = {
        success: true,
        data: team,
      };

      res.json(response);
    } catch (error: any) {
      console.error('Error in createTeam:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
