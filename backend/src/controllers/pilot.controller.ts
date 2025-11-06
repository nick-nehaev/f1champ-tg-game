import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PlayerService } from '../services/player.service';
import { PilotService } from '../services/pilot.service';
import { ApiResponse } from '@f1champ/shared';

export class PilotController {
  static async getAllPilots(req: AuthRequest, res: Response) {
    try {
      const pilots = await PilotService.getAllPilots();
      res.json({ success: true, data: pilots });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getTeamPilots(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);
      if (!team) return res.status(404).json({ error: 'Team not found' });

      const pilots = await PilotService.getTeamPilots(team.id);
      res.json({ success: true, data: pilots });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async buyPilot(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { pilotId } = req.body;
      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);
      if (!team) return res.status(404).json({ error: 'Team not found' });

      await PilotService.buyPilot(team.id, pilotId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async assignPilots(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { pilot1Id, pilot2Id } = req.body;
      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);
      if (!team) return res.status(404).json({ error: 'Team not found' });

      await PilotService.assignPilots(team.id, pilot1Id, pilot2Id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
