import { Router } from 'express';
import { PlayerController } from '../controllers/player.controller';
import { CarController } from '../controllers/car.controller';
import { RaceController } from '../controllers/race.controller';
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

// Race routes
router.get('/race/season', RaceController.getActiveSeason);
router.get('/race/races', RaceController.getSeasonRaces);
router.get('/race/next', RaceController.getNextRace);
router.get('/race/:raceId/results', RaceController.getRaceResults);
router.get('/race/standings', RaceController.getStandings);
router.post('/race/:raceId/run', RaceController.runRace); // только для разработки

export default router;
