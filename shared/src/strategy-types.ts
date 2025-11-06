// Типы для системы стратегии гонок

export enum TireType {
  SOFT = 'soft',       // Мягкие - быстрые, но быстро изнашиваются
  MEDIUM = 'medium',   // Средние - баланс
  HARD = 'hard',       // Жесткие - медленные, но долговечные
  WET = 'wet',         // Дождевые
  INTERMEDIATE = 'intermediate' // Промежуточные
}

export interface PitStop {
  lap: number;        // На каком круге остановка
  tireType: TireType; // Какие шины установить
}

export interface RaceStrategy {
  id: number;
  raceId: number;
  teamId: number;
  pitStops: PitStop[]; // Массив питстопов
  createdAt: Date;
  updatedAt: Date;
}

// Покупаемые наборы

export enum PurchasableCrateType {
  BASIC = 'basic',           // Базовый набор - 500$
  STANDARD = 'standard'      // Стандартный набор - 1500$
}

export interface PurchasableCrate {
  type: PurchasableCrateType;
  cost: number;
  rewardCount: number;
  description: string;
}

export const PURCHASABLE_CRATES: Record<PurchasableCrateType, PurchasableCrate> = {
  [PurchasableCrateType.BASIC]: {
    type: PurchasableCrateType.BASIC,
    cost: 500,
    rewardCount: 1,
    description: 'Базовый набор с низкокачественными предметами'
  },
  [PurchasableCrateType.STANDARD]: {
    type: PurchasableCrateType.STANDARD,
    cost: 1500,
    rewardCount: 2,
    description: 'Стандартный набор с предметами среднего качества'
  }
};

// Система крафта

export interface CraftingRecipe {
  requiredCount: number; // Сколько одинаковых предметов нужно
  requiredLevel: number; // Какого уровня предметы
  resultLevel: number;   // Какой уровень получится
}

export const CRAFTING_RECIPE: CraftingRecipe = {
  requiredCount: 20,
  requiredLevel: 1, // любой уровень
  resultLevel: 1    // на 1 выше
};

export interface CraftRequest {
  componentIds: number[]; // ID компонентов для крафта
}

export interface CraftResult {
  newComponent: any; // Новый компонент
  consumedComponents: number[]; // Использованные компоненты
}

// Визуализация гонки

export interface LapData {
  lap: number;
  teamId: number;
  position: number;
  lapTime: number; // в миллисекундах
  tireType: TireType;
  tireAge: number; // количество кругов на этих шинах
  isInPit: boolean;
  pitTime?: number; // время в пит-лейн
  totalTime: number; // общее время гонки
}

export interface RaceSimulationResult {
  raceId: number;
  trackName: string;
  totalLaps: number;
  lapData: LapData[]; // Все данные по кругам
  finalResults: {
    teamId: number;
    position: number;
    totalTime: number;
    points: number;
    dnf: boolean;
    dnfReason?: string;
  }[];
}

export interface RaceVisualizationData {
  totalLaps: number;
  currentLap: number;
  positions: {
    teamId: number;
    teamName: string;
    teamColor: string;
    position: number;
    progress: number; // 0-1, прогресс по кругу
    isInPit: boolean;
    tireType: TireType;
    lapTime?: number;
  }[];
}

// Характеристики шин
export interface TireCharacteristics {
  speed: number;      // множитель скорости (0.9 - 1.1)
  degradation: number; // скорость износа за круг
  optimalLaps: number; // оптимальное количество кругов
}

export const TIRE_CHARACTERISTICS: Record<TireType, TireCharacteristics> = {
  [TireType.SOFT]: {
    speed: 1.1,
    degradation: 0.05,
    optimalLaps: 15
  },
  [TireType.MEDIUM]: {
    speed: 1.0,
    degradation: 0.03,
    optimalLaps: 25
  },
  [TireType.HARD]: {
    speed: 0.95,
    degradation: 0.02,
    optimalLaps: 35
  },
  [TireType.WET]: {
    speed: 0.85,
    degradation: 0.01,
    optimalLaps: 50
  },
  [TireType.INTERMEDIATE]: {
    speed: 0.9,
    degradation: 0.015,
    optimalLaps: 40
  }
};

export const PIT_STOP_TIME = 25000; // 25 секунд в миллисекундах

// Схемы трасс (упрощенные координаты для визуализации)

export interface TrackPoint {
  x: number; // 0-100
  y: number; // 0-100
}

export interface Track {
  name: string;
  points: TrackPoint[]; // Точки трассы по порядку
  pitLaneEntry: number; // Индекс точки входа в пит-лейн
  pitLaneExit: number;  // Индекс точки выхода из пит-лейн
  totalLaps: number;
}

// Упрощенные схемы трасс
export const TRACKS: Record<string, Track> = {
  'Монако': {
    name: 'Монако',
    totalLaps: 50,
    pitLaneEntry: 75,
    pitLaneExit: 5,
    points: [
      { x: 50, y: 10 }, { x: 70, y: 15 }, { x: 85, y: 25 }, { x: 90, y: 40 },
      { x: 85, y: 55 }, { x: 70, y: 65 }, { x: 55, y: 70 }, { x: 40, y: 70 },
      { x: 25, y: 65 }, { x: 15, y: 50 }, { x: 15, y: 35 }, { x: 25, y: 20 },
      { x: 40, y: 15 }
    ]
  },
  'Сильверстоун': {
    name: 'Сильверстоун',
    totalLaps: 45,
    pitLaneEntry: 70,
    pitLaneExit: 10,
    points: [
      { x: 50, y: 10 }, { x: 75, y: 15 }, { x: 90, y: 30 }, { x: 85, y: 50 },
      { x: 65, y: 65 }, { x: 45, y: 75 }, { x: 25, y: 70 }, { x: 10, y: 55 },
      { x: 10, y: 35 }, { x: 20, y: 20 }, { x: 35, y: 12 }
    ]
  },
  'Монца': {
    name: 'Монца',
    totalLaps: 48,
    pitLaneEntry: 80,
    pitLaneExit: 5,
    points: [
      { x: 50, y: 15 }, { x: 75, y: 20 }, { x: 85, y: 35 }, { x: 80, y: 55 },
      { x: 60, y: 70 }, { x: 40, y: 75 }, { x: 20, y: 65 }, { x: 15, y: 45 },
      { x: 25, y: 25 }, { x: 40, y: 18 }
    ]
  },
  'Судзука': {
    name: 'Судзука',
    totalLaps: 44,
    pitLaneEntry: 65,
    pitLaneExit: 15,
    points: [
      { x: 50, y: 10 }, { x: 70, y: 15 }, { x: 85, y: 30 }, { x: 88, y: 50 },
      { x: 75, y: 68 }, { x: 55, y: 75 }, { x: 35, y: 72 }, { x: 20, y: 60 },
      { x: 12, y: 40 }, { x: 18, y: 22 }, { x: 35, y: 12 }
    ]
  },
  'Спа-Франкоршам': {
    name: 'Спа-Франкоршам',
    totalLaps: 40,
    pitLaneEntry: 85,
    pitLaneExit: 10,
    points: [
      { x: 50, y: 12 }, { x: 72, y: 18 }, { x: 88, y: 32 }, { x: 90, y: 52 },
      { x: 78, y: 70 }, { x: 58, y: 78 }, { x: 38, y: 75 }, { x: 22, y: 62 },
      { x: 12, y: 42 }, { x: 15, y: 25 }, { x: 30, y: 15 }
    ]
  }
};
