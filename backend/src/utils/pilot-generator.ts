// Генератор случайных имен пилотов

const FIRST_NAMES = [
  'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
  'Thomas', 'Charles', 'Christopher', 'Daniel', 'Matthew', 'Anthony', 'Donald',
  'Mark', 'Paul', 'Steven', 'Andrew', 'Kenneth', 'George', 'Joshua', 'Kevin',
  'Brian', 'Edward', 'Ronald', 'Timothy', 'Jason', 'Jeffrey', 'Ryan', 'Jacob',
  'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott',
  'Brandon', 'Frank', 'Benjamin', 'Gregory', 'Raymond', 'Samuel', 'Patrick',
  'Alexander', 'Jack', 'Dennis', 'Jerry', 'Tyler', 'Aaron', 'Henry', 'Douglas',
  'Peter', 'Kyle', 'Noah', 'Ethan', 'Jeremy', 'Walter', 'Christian', 'Keith',
  'Roger', 'Terry', 'Austin', 'Sean', 'Gerald', 'Carl', 'Harold', 'Dylan',
  'Arthur', 'Lawrence', 'Jordan', 'Jesse', 'Bryan', 'Billy', 'Bruce', 'Albert',
  'Willie', 'Gabriel', 'Logan', 'Alan', 'Juan', 'Wayne', 'Roy', 'Ralph',
  'Eugene', 'Randy', 'Vincent', 'Russell', 'Louis', 'Philip', 'Bobby', 'Johnny',
  'Bradley', 'Dale', 'Martin', 'Carlos', 'Marcus', 'Victor', 'Oscar', 'Leonard'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill',
  'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell',
  'Mitchell', 'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz',
  'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales',
  'Murphy', 'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson',
  'Bailey', 'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
  'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
  'Long', 'Ross', 'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell'
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
