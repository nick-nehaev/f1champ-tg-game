import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PlayerService } from '../services/player.service';
import { CrateService } from '../services/crate.service';
import { ApiResponse } from '@f1champ/shared';

export class CrateController {
  static async getTeamCrates(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);
      if (!team) return res.status(404).json({ error: 'Team not found' });

      const crates = await CrateService.getTeamCrates(team.id);
      res.json({ success: true, data: crates });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async claimDailyCrate(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);
      if (!team) return res.status(404).json({ error: 'Team not found' });

      const crate = await CrateService.claimDailyCrate(team.id);
      res.json({ success: true, data: crate });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async canClaimDaily(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);
      if (!team) return res.status(404).json({ error: 'Team not found' });

      const canClaim = await CrateService.canClaimDailyCrate(team.id);
      res.json({ success: true, data: { canClaim } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async skipWait(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { crateId } = req.body;
      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);
      if (!team) return res.status(404).json({ error: 'Team not found' });

      await CrateService.skipCrateWait(team.id, crateId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  static async openCrate(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const { crateId } = req.body;
      const player = await PlayerService.getOrCreatePlayer(req.user);
      const team = await PlayerService.getPlayerTeam(player.id);
      if (!team) return res.status(404).json({ error: 'Team not found' });

      const rewards = await CrateService.openCrate(team.id, crateId);
      res.json({ success: true, data: rewards });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
}
