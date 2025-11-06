import { query } from './index';
import { ComponentType } from '@f1champ/shared';

// Начальные компоненты для игры
const seedComponents = async () => {
  console.log('Seeding car components...');

  const components = [
    // Двигатели
    { type: ComponentType.ENGINE, name: 'Базовый двигатель', level: 1, power: 50, reliability: 60, cost: 0 },
    { type: ComponentType.ENGINE, name: 'Улучшенный двигатель', level: 2, power: 70, reliability: 70, cost: 2000 },
    { type: ComponentType.ENGINE, name: 'Спортивный двигатель', level: 3, power: 90, reliability: 75, cost: 4000 },
    { type: ComponentType.ENGINE, name: 'Гоночный двигатель', level: 4, power: 110, reliability: 80, cost: 7000 },
    { type: ComponentType.ENGINE, name: 'Турбо двигатель', level: 5, power: 130, reliability: 85, cost: 12000 },

    // Шасси
    { type: ComponentType.CHASSIS, name: 'Стандартное шасси', level: 1, handling: 50, reliability: 60, cost: 0 },
    { type: ComponentType.CHASSIS, name: 'Легкое шасси', level: 2, handling: 70, reliability: 65, cost: 2000 },
    { type: ComponentType.CHASSIS, name: 'Усиленное шасси', level: 3, handling: 85, reliability: 75, cost: 4000 },
    { type: ComponentType.CHASSIS, name: 'Карбоновое шасси', level: 4, handling: 100, reliability: 80, cost: 7000 },
    { type: ComponentType.CHASSIS, name: 'Титановое шасси', level: 5, handling: 120, reliability: 90, cost: 12000 },

    // Аэродинамика
    { type: ComponentType.AERODYNAMICS, name: 'Базовая аэродинамика', level: 1, speed: 50, reliability: 70, cost: 0 },
    { type: ComponentType.AERODYNAMICS, name: 'Улучшенная аэродинамика', level: 2, speed: 70, reliability: 75, cost: 1500 },
    { type: ComponentType.AERODYNAMICS, name: 'Активная аэродинамика', level: 3, speed: 90, reliability: 80, cost: 3500 },
    { type: ComponentType.AERODYNAMICS, name: 'DRS система', level: 4, speed: 110, reliability: 85, cost: 6000 },
    { type: ComponentType.AERODYNAMICS, name: 'Адаптивная аэродинамика', level: 5, speed: 130, reliability: 90, cost: 10000 },

    // Шины
    { type: ComponentType.TIRES, name: 'Стандартные шины', level: 1, grip: 50, reliability: 50, cost: 0 },
    { type: ComponentType.TIRES, name: 'Мягкие шины', level: 2, grip: 70, reliability: 60, cost: 1000 },
    { type: ComponentType.TIRES, name: 'Средние шины', level: 3, grip: 80, reliability: 75, cost: 2500 },
    { type: ComponentType.TIRES, name: 'Жесткие шины', level: 4, grip: 90, reliability: 85, cost: 5000 },
    { type: ComponentType.TIRES, name: 'Гиперсофт шины', level: 5, grip: 110, reliability: 70, cost: 8000 },

    // Электроника
    { type: ComponentType.ELECTRONICS, name: 'Базовая электроника', level: 1, stability: 50, reliability: 60, cost: 0 },
    { type: ComponentType.ELECTRONICS, name: 'Улучшенная электроника', level: 2, stability: 70, reliability: 70, cost: 1500 },
    { type: ComponentType.ELECTRONICS, name: 'Система контроля тяги', level: 3, stability: 90, reliability: 80, cost: 3500 },
    { type: ComponentType.ELECTRONICS, name: 'Адаптивная подвеска', level: 4, stability: 110, reliability: 85, cost: 6000 },
    { type: ComponentType.ELECTRONICS, name: 'AI-ассистент', level: 5, stability: 130, reliability: 90, cost: 10000 },
  ];

  for (const component of components) {
    await query(
      `INSERT INTO car_components (type, name, level, power, reliability, handling, speed, grip, stability, cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT DO NOTHING`,
      [
        component.type,
        component.name,
        component.level,
        component.power,
        component.reliability,
        component.handling || 0,
        component.speed || 0,
        component.grip || 0,
        component.stability || 0,
        component.cost,
      ]
    );
  }

  console.log('Car components seeded successfully!');
};

// Создание первого сезона
const seedSeason = async () => {
  console.log('Creating initial season...');

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 30); // Сезон длится 30 дней

  await query(
    `INSERT INTO seasons (name, start_date, end_date, is_active)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT DO NOTHING`,
    [`Сезон ${startDate.getFullYear()}`, startDate, endDate, true]
  );

  console.log('Initial season created!');
};

export const seedDatabase = async () => {
  try {
    await seedComponents();
    await seedSeason();
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Если запускается напрямую
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seeding complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
