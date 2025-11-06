import { useEffect, useState } from 'react';
import { raceAPI } from '../services/api';

export const Races = () => {
  const [races, setRaces] = useState<any[]>([]);
  const [selectedRace, setSelectedRace] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadRaces();
  }, []);

  const loadRaces = async () => {
    try {
      setLoading(true);
      const response = await raceAPI.getSeasonRaces();

      if (response.success && response.data) {
        setRaces(response.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRaceResults = async (raceId: number) => {
    try {
      const response = await raceAPI.getRaceResults(raceId);

      if (response.success && response.data) {
        setResults(response.data);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRaceClick = async (race: any) => {
    setSelectedRace(race);
    if (race.status === 'completed') {
      await loadRaceResults(race.id);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      scheduled: '📅 Запланирована',
      in_progress: '🏁 В процессе',
      completed: '✅ Завершена',
      cancelled: '❌ Отменена',
    };
    return map[status] || status;
  };

  const getWeatherEmoji = (weather: string) => {
    const map: Record<string, string> = {
      sunny: '☀️',
      cloudy: '☁️',
      rainy: '🌧️',
      stormy: '⛈️',
    };
    return map[weather] || '🌤️';
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>
        🏁 Гонки
      </h1>

      {error && <div className="error">{error}</div>}

      {races.length === 0 ? (
        <div className="card">
          <p>Пока нет запланированных гонок</p>
        </div>
      ) : (
        <>
          {races.map((race) => (
            <div
              key={race.id}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => handleRaceClick(race)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
                    {race.name}
                  </div>
                  <div style={{ fontSize: 16, marginBottom: 8 }}>
                    📍 {race.track}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.7, marginBottom: 4 }}>
                    🗓️{' '}
                    {new Date(race.scheduledDate).toLocaleString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div style={{ fontSize: 14, opacity: 0.7 }}>
                    {getWeatherEmoji(race.weather)} {race.weather}
                  </div>
                </div>
                <div
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: 'var(--tg-theme-button-color)',
                    color: 'white',
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {getStatusLabel(race.status)}
                </div>
              </div>

              {selectedRace?.id === race.id &&
                race.status === 'completed' &&
                results.length > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #ddd' }}>
                    <div style={{ fontWeight: 600, marginBottom: 12 }}>
                      Результаты:
                    </div>
                    {results.map((result, index) => (
                      <div
                        key={result.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: 8,
                          background:
                            index < 3
                              ? 'var(--tg-theme-button-color, #0088cc)'
                              : 'var(--tg-theme-bg-color)',
                          color: index < 3 ? 'white' : 'inherit',
                          borderRadius: 6,
                          marginBottom: 4,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 18 }}>
                            {result.position}
                          </span>
                          <span>Команда #{result.teamId}</span>
                        </div>
                        <div>
                          {result.dnf ? (
                            <span style={{ fontSize: 12 }}>DNF</span>
                          ) : (
                            <>
                              <span style={{ fontWeight: 600 }}>{result.points} очков</span>
                              {result.fastestLap && (
                                <span style={{ marginLeft: 8 }}>⚡</span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </>
      )}
    </div>
  );
};
