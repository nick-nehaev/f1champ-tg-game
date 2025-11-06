// Генератор случайных имен пилотов

const FIRST_NAMES = [
  'Alex', 'Max', 'Lewis', 'Sebastian', 'Fernando', 'Charles', 'Lando', 'Carlos',
  'George', 'Daniel', 'Sergio', 'Pierre', 'Esteban', 'Lance', 'Yuki', 'Zhou',
  'Kevin', 'Nico', 'Valtteri', 'Oscar', 'Logan', 'Nyck', 'Antonio', 'Mick',
  'Jack', 'Robert', 'Felipe', 'Jenson', 'Kimi', 'Mark', 'David', 'Michael',
  'Ralf', 'Rubens', 'Juan', 'Damon', 'Jacques', 'Mika', 'Nigel', 'Alain',
  'Ayrton', 'Nelson', 'Emerson', 'Mario', 'Ronnie', 'James', 'Graham', 'Jim',
  'Jackie', 'Niki', 'Clay', 'Phil', 'Bruce', 'Dan', 'Riccardo', 'Giancarlo',
  'Andrea', 'Jarno', 'Heinz', 'Wolfgang', 'Hans', 'Jochen', 'Gerhard', 'Stefan'
];

const LAST_NAMES = [
  'Hamilton', 'Verstappen', 'Leclerc', 'Norris', 'Sainz', 'Russell', 'Ricciardo',
  'Perez', 'Gasly', 'Ocon', 'Stroll', 'Tsunoda', 'Guanyu', 'Magnussen', 'Hulkenberg',
  'Bottas', 'Piastri', 'Sargeant', 'De Vries', 'Giovinazzi', 'Schumacher', 'Alonso',
  'Vettel', 'Raikkonen', 'Webber', 'Coulthard', 'Button', 'Barrichello', 'Montoya',
  'Hill', 'Villeneuve', 'Hakkinen', 'Mansell', 'Prost', 'Senna', 'Piquet', 'Fittipaldi',
  'Andretti', 'Peterson', 'Hunt', 'Stewart', 'Lauda', 'Regazzoni', 'Hill', 'McLaren',
  'Moss', 'Fangio', 'Clark', 'Rindt', 'Ickx', 'Surtees', 'Brabham', 'Ascari',
  'Nuvolari', 'Rossi', 'Trulli', 'Fisichella', 'Harald', 'Wolf', 'Stuck', 'Mass',
  'Reutemann', 'Jones', 'Rosberg', 'Berger', 'Patrese', 'Brundle', 'Herbert'
];

export function generateRandomPilot(level: number): {
  firstName: string;
  lastName: string;
  skill: number;
  experience: number;
  consistency: number;
  aggression: number;
  cost: number;
} {
  // Случайные имя и фамилия
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];

  // Базовые характеристики зависят от уровня
  const baseStats = {
    1: { min: 30, max: 50, cost: 0 },
    2: { min: 50, max: 70, cost: 3000 },
    3: { min: 65, max: 85, cost: 6000 },
    4: { min: 80, max: 95, cost: 10000 },
    5: { min: 90, max: 100, cost: 15000 },
  }[level] || { min: 30, max: 50, cost: 0 };

  // Генерируем случайные характеристики в пределах уровня
  const randomStat = () =>
    Math.floor(Math.random() * (baseStats.max - baseStats.min + 1)) + baseStats.min;

  return {
    firstName,
    lastName,
    skill: randomStat(),
    experience: randomStat(),
    consistency: randomStat(),
    aggression: randomStat(),
    cost: baseStats.cost,
  };
}

export function generatePilotPool(count: number = 50): Array<ReturnType<typeof generateRandomPilot> & { level: number }> {
  const pilots: Array<ReturnType<typeof generateRandomPilot> & { level: number }> = [];
  const usedNames = new Set<string>();

  while (pilots.length < count) {
    // Распределение по уровням: больше низких, меньше высоких
    const rand = Math.random();
    let level: number;
    if (rand < 0.4) level = 1;
    else if (rand < 0.7) level = 2;
    else if (rand < 0.85) level = 3;
    else if (rand < 0.95) level = 4;
    else level = 5;

    const pilot = generateRandomPilot(level);
    const fullName = `${pilot.firstName} ${pilot.lastName}`;

    // Избегаем дубликатов имен
    if (!usedNames.has(fullName)) {
      usedNames.add(fullName);
      pilots.push({ ...pilot, level });
    }
  }

  return pilots;
}
