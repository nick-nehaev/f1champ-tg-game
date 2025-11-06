import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PlayerService } from '../services/player.service';
import { ReferralService } from '../services/referral.service';
import { ApiResponse } from '@f1champ/shared';

export class ReferralController {
  static async getReferrals(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

      const player = await PlayerService.getOrCreatePlayer(req.user);
      const referrals = await ReferralService.getPlayerReferrals(player.id);
      const count = await ReferralService.getReferralCount(player.id);
      const code = await ReferralService.getReferralCode(player.id);

      res.json({ success: true, data: { referrals, count, code } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
