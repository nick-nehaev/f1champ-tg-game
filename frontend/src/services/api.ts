import { ApiResponse, CreateTeamRequest, UpdateCarRequest } from '@f1champ/shared';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Получаем initData от Telegram WebApp
const getInitData = () => {
  if (window.Telegram?.WebApp?.initData) {
    return window.Telegram.WebApp.initData;
  }
  return '';
};

// Базовая функция для API запросов
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-Telegram-Init-Data': getInitData(),
    ...options?.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

// Player API
export const playerAPI = {
  async getMe() {
    return fetchAPI<{ player: any; team: any }>('/player/me');
  },

  async createTeam(data: CreateTeamRequest) {
    return fetchAPI<any>('/player/team', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Car API
export const carAPI = {
  async getCar() {
    return fetchAPI<{ car: any; stats: any }>('/car');
  },

  async getAllComponents() {
    return fetchAPI<any[]>('/car/components');
  },

  async getTeamComponents() {
    return fetchAPI<any[]>('/car/team-components');
  },

  async buyComponent(componentId: number) {
    return fetchAPI<any>('/car/buy', {
      method: 'POST',
      body: JSON.stringify({ componentId }),
    });
  },

  async updateCar(data: UpdateCarRequest) {
    return fetchAPI<any>('/car', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Race API
export const raceAPI = {
  async getActiveSeason() {
    return fetchAPI<any>('/race/season');
  },

  async getSeasonRaces() {
    return fetchAPI<any[]>('/race/races');
  },

  async getNextRace() {
    return fetchAPI<any>('/race/next');
  },

  async getRaceResults(raceId: number) {
    return fetchAPI<any[]>(`/race/${raceId}/results`);
  },

  async getStandings() {
    return fetchAPI<any[]>('/race/standings');
  },
};
