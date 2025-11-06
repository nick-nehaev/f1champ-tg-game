import { Router } from 'express';
import { PlayerController } from '../controllers/player.controller';
import { CarController } from '../controllers/car.controller';
import { RaceController } from '../controllers/race.controller';
import { PilotController } from '../controllers/pilot.controller';
import { CrateController } from '../controllers/crate.controller';
import { ReferralController } from '../controllers/referral.controller';
import { StrategyController } from '../controllers/strategy.controller';
import { CraftingController } from '../controllers/crafting.controller';
import { devAuth } from '../middleware/auth';

const router = Router();

// Применяем auth middleware ко всем роутам
router.use(devAuth);

// Player routes
router.get('/player/me', PlayerController.getMe);
router.post('/player/team', PlayerController.createTeam);

// Car routes
router.get('/car', CarController.getCar);
router.get('/car/components', CarController.getAllComponents);
router.get('/car/team-components', CarController.getTeamComponents);
router.post('/car/buy', CarController.buyComponent);
router.put('/car', CarController.updateCar);

// Pilot routes
router.get('/pilots', PilotController.getAllPilots);
router.get('/pilots/team', PilotController.getTeamPilots);
router.post('/pilots/buy', PilotController.buyPilot);
router.post('/pilots/assign', PilotController.assignPilots);

// Crate routes
router.get('/crates', CrateController.getTeamCrates);
router.get('/crates/can-claim-daily', CrateController.canClaimDaily);
router.post('/crates/claim-daily', CrateController.claimDailyCrate);
router.post('/crates/skip-wait', CrateController.skipWait);
router.post('/crates/open', CrateController.openCrate);
router.post('/crates/purchase', CrateController.purchaseCrate);

// Referral routes
router.get('/referrals', ReferralController.getReferrals);

// Strategy routes
router.post('/strategy/:raceId', StrategyController.setStrategy);
router.get('/strategy/:raceId', StrategyController.getStrategy);

// Crafting routes
router.post('/crafting/craft', CraftingController.craftComponent);
router.get('/crafting/available', CraftingController.getAvailableCrafts);

// Race routes
router.get('/race/season', RaceController.getActiveSeason);
router.get('/race/races', RaceController.getSeasonRaces);
router.get('/race/next', RaceController.getNextRace);
router.get('/race/:raceId/results', RaceController.getRaceResults);
router.get('/race/standings', RaceController.getStandings);
router.post('/race/:raceId/run', RaceController.runRace); // только для разработки

export default router;
