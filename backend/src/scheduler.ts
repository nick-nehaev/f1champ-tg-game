import cron from 'node-cron';
import { RaceService } from './services/race.service';
import { CrateService } from './services/crate.service';
import { query } from './db';
import { RACE_INTERVAL_DAYS, CrateType } from '@f1champ/shared';

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
        console.log('No active season');
        // Создаем новый сезон
        await this.createNewSeason();
        return;
      }

      const endDate = new Date(season.end_date);
      const now = new Date();

      if (now > endDate) {
        console.log('Season ended, finalizing and starting new season');

        // Получаем топ-5 команд сезона
        const standings = await RaceService.getStandings(season.id);

        // Выдаем призовые кейсы за сезон
        for (let i = 0; i < Math.min(5, standings.length); i++) {
          const standing = standings[i];

          try {
            // Топ-3 получают особые награды
            if (i < 3) {
              await CrateService.createPrizeCrate(
                standing.teamId,
                CrateType.SEASON_REWARD
              );
            }

            // Все топ-5 получают золотые кейсы
            await CrateService.createPrizeCrate(
              standing.teamId,
              CrateType.GOLD
            );
          } catch (error) {
            console.error(`Error giving season rewards to team ${standing.teamId}:`, error);
          }
        }

        // Завершаем текущий сезон
        await query('UPDATE seasons SET is_active = false WHERE id = $1', [season.id]);

        // Создаем новый сезон
        await this.createNewSeason();
      }
    } catch (error) {
      console.error('Error checking season end:', error);
    }
  }

  /**
   * Создать новый сезон
   */
  private static async createNewSeason() {
    try {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 30); // 30 дней

      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      const seasonName = `Сезон ${year}-${month.toString().padStart(2, '0')}`;

      await query(
        `INSERT INTO seasons (name, start_date, end_date, is_active)
         VALUES ($1, $2, $3, true)`,
        [seasonName, now, endDate]
      );

      console.log(`New season created: ${seasonName}`);
    } catch (error) {
      console.error('Error creating new season:', error);
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
