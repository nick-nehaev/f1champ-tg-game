import cron from 'node-cron';
import { RaceService } from './services/race.service';
import { RACE_INTERVAL_DAYS } from '@f1champ/shared';

/**
 * Планировщик задач для автоматического проведения гонок
 */
export class Scheduler {
  /**
   * Запустить планировщик
   */
  static start() {
    // Проверяем каждый час, нужно ли провести гонку
    cron.schedule('0 * * * *', async () => {
      console.log('Checking for races to run...');
      await this.checkAndRunRaces();
    });

    // Проверяем каждый день, нужно ли создать новую гонку
    cron.schedule('0 0 * * *', async () => {
      console.log('Checking for new races to schedule...');
      await this.scheduleNextRace();
    });

    // Проверяем каждый день, не закончился ли сезон
    cron.schedule('0 1 * * *', async () => {
      console.log('Checking for season end...');
      await this.checkSeasonEnd();
    });

    console.log('Scheduler started');
  }

  /**
   * Проверить и запустить запланированные гонки
   */
  private static async checkAndRunRaces() {
    try {
      const nextRace = await RaceService.getNextRace();

      if (!nextRace) {
        console.log('No scheduled races found');
        return;
      }

      const now = new Date();
      const scheduledDate = new Date(nextRace.scheduledDate);

      // Если время гонки прошло, запускаем её
      if (scheduledDate <= now) {
        console.log(`Running race: ${nextRace.name}`);
        await RaceService.runRace(nextRace.id);
        console.log(`Race ${nextRace.name} completed`);
      }
    } catch (error) {
      console.error('Error checking races:', error);
    }
  }

  /**
   * Запланировать следующую гонку
   */
  private static async scheduleNextRace() {
    try {
      const season = await RaceService.getActiveSeason();
      if (!season) {
        console.log('No active season');
        return;
      }

      const races = await RaceService.getSeasonRaces(season.id);
      const lastRace = races[races.length - 1];

      if (!lastRace) {
        // Первая гонка сезона
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + 1); // Завтра

        await RaceService.createRace(
          season.id,
          `Гонка 1`,
          this.getRandomTrack(),
          scheduledDate
        );

        console.log('First race of the season scheduled');
        return;
      }

      // Проверяем, прошла ли последняя гонка
      if (lastRace.status !== 'completed') {
        console.log('Last race not completed yet');
        return;
      }

      // Создаём следующую гонку через RACE_INTERVAL_DAYS дней
      const nextScheduledDate = new Date(lastRace.scheduledDate);
      nextScheduledDate.setDate(
        nextScheduledDate.getDate() + RACE_INTERVAL_DAYS
      );

      const seasonEndDate = new Date(season.end_date);

      // Проверяем, не выходит ли гонка за рамки сезона
      if (nextScheduledDate > seasonEndDate) {
        console.log('Next race would be after season end');
        return;
      }

      const raceNumber = races.length + 1;

      await RaceService.createRace(
        season.id,
        `Гонка ${raceNumber}`,
        this.getRandomTrack(),
        nextScheduledDate
      );

      console.log(`Race ${raceNumber} scheduled for ${nextScheduledDate}`);
    } catch (error) {
      console.error('Error scheduling race:', error);
    }
  }

  /**
   * Проверить окончание сезона
   */
  private static async checkSeasonEnd() {
    try {
      const season = await RaceService.getActiveSeason();
      if (!season) {
        return;
      }

      const endDate = new Date(season.end_date);
      const now = new Date();

      if (now > endDate) {
        console.log('Season ended, starting new season');
        // TODO: Завершить текущий сезон и создать новый
        // Можно добавить награды победителям, обнулить очки и т.д.
      }
    } catch (error) {
      console.error('Error checking season end:', error);
    }
  }

  /**
   * Получить случайную трассу
   */
  private static getRandomTrack(): string {
    const tracks = [
      'Монако',
      'Сильверстоун',
      'Спа-Франкоршам',
      'Монца',
      'Судзука',
      'Интерлагос',
      'Сингапур',
      'Абу-Даби',
      'Сочи',
      'Остин',
      'Мельбурн',
      'Шанхай',
      'Барселона',
      'Хунгароринг',
      'Баку',
    ];

    return tracks[Math.floor(Math.random() * tracks.length)];
  }
}
