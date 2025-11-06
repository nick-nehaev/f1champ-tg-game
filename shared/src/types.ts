// Типы игроков и команд
export interface Player {
  id: number;
  telegramId: number;
  username: string;
  firstName?: string;
  lastName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: number;
  playerId: number;
  name: string;
  color: string;
  budget: number;
  maxCurrency: number; // Донатная валюта
  pilot1Id?: number;
  pilot2Id?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Типы компонентов машины
export enum ComponentType {
  ENGINE = 'engine',
  CHASSIS = 'chassis',
  AERODYNAMICS = 'aerodynamics',
  TIRES = 'tires',
  ELECTRONICS = 'electronics'
}

export interface CarComponent {
  id: number;
  type: ComponentType;
  name: string;
  level: number;
  power: number; // Мощность (для двигателя)
  reliability: number; // Надежность
  handling: number; // Управляемость (для шасси)
  speed: number; // Скорость (для аэродинамики)
  grip: number; // Сцепление (для шин)
  stability: number; // Стабильность (для электроники)
  cost: number;
}

export interface Car {
  id: number;
  teamId: number;
  engineId?: number;
  chassisId?: number;
  aerodynamicsId?: number;
  tiresId?: number;
  electronicsId?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Расчет общей мощности машины
export interface CarStats {
  totalPower: number;
  totalReliability: number;
  totalHandling: number;
  totalSpeed: number;
  totalGrip: number;
  totalStability: number;
  overallRating: number;
}

// Типы гонок и сезонов
export interface Season {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
}

export interface Race {
  id: number;
  seasonId: number;
  name: string;
  track: string;
  scheduledDate: Date;
  status: RaceStatus;
  weather: WeatherCondition;
  createdAt: Date;
  completedAt?: Date;
}

export enum RaceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum WeatherCondition {
  SUNNY = 'sunny',
  CLOUDY = 'cloudy',
  RAINY = 'rainy',
  STORMY = 'stormy'
}

export interface RaceResult {
  id: number;
  raceId: number;
  teamId: number;
  position: number;
  points: number;
  fastestLap: boolean;
  dnf: boolean; // Did Not Finish
  dnfReason?: string;
  createdAt: Date;
}

// Таблица чемпионата
export interface StandingsEntry {
  teamId: number;
  teamName: string;
  teamColor: string;
  playerUsername: string;
  totalPoints: number;
  wins: number;
  podiums: number;
  fastestLaps: number;
  races: number;
  position: number;
}

// API запросы и ответы
export interface CreateTeamRequest {
  name: string;
  color: string;
}

export interface UpdateCarRequest {
  engineId?: number;
  chassisId?: number;
  aerodynamicsId?: number;
  tiresId?: number;
  electronicsId?: number;
}

export interface BuyComponentRequest {
  componentId: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Telegram WebApp данные
export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

export interface TelegramWebAppInitData {
  user?: TelegramUser;
  auth_date: number;
  hash: string;
}

// Пилоты
export interface Pilot {
  id: number;
  firstName: string;
  lastName: string;
  level: number; // 1-5
  skill: number; // Навык пилота (влияет на результаты)
  experience: number; // Опыт
  consistency: number; // Стабильность
  aggression: number; // Агрессивность
  cost: number;
  createdAt: Date;
}

// Квалификация
export interface Qualification {
  id: number;
  raceId: number;
  teamId: number;
  position: number;
  lapTime: number; // в миллисекундах
  createdAt: Date;
}

// Наборы/Кейсы
export enum CrateType {
  DAILY = 'daily',
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  SEASON_REWARD = 'season_reward'
}

export enum CrateStatus {
  LOCKED = 'locked', // Заблокирован (нужно время или Max)
  READY = 'ready',   // Готов к открытию
  OPENED = 'opened'  // Открыт
}

export interface Crate {
  id: number;
  teamId: number;
  type: CrateType;
  status: CrateStatus;
  lockedUntil?: Date; // Когда можно открыть
  createdAt: Date;
  openedAt?: Date;
}

export interface CrateReward {
  id: number;
  crateId: number;
  rewardType: 'component' | 'pilot' | 'money' | 'max_currency';
  rewardId?: number; // ID компонента или пилота
  amount?: number; // Для денег или Max валюты
  createdAt: Date;
}

// Реферальная система
export interface Referral {
  id: number;
  referrerId: number; // Кто пригласил
  referredId: number; // Кого пригласили
  reward: number; // Награда за приглашение
  createdAt: Date;
}

// Транзакции Max валюты
export interface MaxTransaction {
  id: number;
  playerId: number;
  amount: number;
  type: 'purchase' | 'reward' | 'spend';
  description: string;
  telegramPaymentId?: string; // ID платежа через Telegram Stars
  createdAt: Date;
}

// Константы игры
export const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
export const FASTEST_LAP_POINTS = 1;
export const INITIAL_BUDGET = 10000;
export const INITIAL_MAX_CURRENCY = 50;
export const RACE_INTERVAL_DAYS = 2;
export const SEASON_DURATION_DAYS = 30;

// Константы наборов
export const DAILY_CRATE_COOLDOWN_HOURS = 24;
export const CRATE_OPEN_TIME_SECONDS = 10;
export const MAX_CURRENCY_TO_SKIP = 10;

// Награды за реферала
export const REFERRAL_REWARD_MONEY = 5000;
export const REFERRAL_REWARD_MAX = 25;
