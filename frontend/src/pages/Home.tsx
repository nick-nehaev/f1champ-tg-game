import { useEffect, useState } from 'react';
import { playerAPI, raceAPI } from '../services/api';

export const Home = () => {
  const [player, setPlayer] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [nextRace, setNextRace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [playerRes, raceRes] = await Promise.all([
        playerAPI.getMe(),
        raceAPI.getNextRace(),
      ]);

      if (playerRes.success && playerRes.data) {
        setPlayer(playerRes.data.player);
        setTeam(playerRes.data.team);
      }

      if (raceRes.success && raceRes.data) {
        setNextRace(raceRes.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>
        🏎️ F1 Championship
      </h1>

      {/* Информация об игроке */}
      {player && (
        <div className="card">
          <div className="card-title">Добро пожаловать!</div>
          <p>
            {player.firstName} {player.lastName}
            {player.username && ` (@${player.username})`}
          </p>
        </div>
      )}

      {/* Информация о команде */}
      {team ? (
        <div className="card">
          <div className="card-title">Ваша команда</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              className="team-color"
              style={{
                backgroundColor: team.color,
                width: 40,
                height: 40,
              }}
            />
            <div>
              <div style={{ fontSize: 20, fontWeight: 600 }}>{team.name}</div>
              <div style={{ fontSize: 14, opacity: 0.7 }}>
                Бюджет: ${team.budget.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-title">Создайте команду</div>
          <p style={{ marginBottom: 12 }}>
            Чтобы начать играть, создайте свою команду!
          </p>
        </div>
      )}

      {/* Следующая гонка */}
      {nextRace && (
        <div className="race-card">
          <div className="race-name">{nextRace.name}</div>
          <div className="race-track">📍 {nextRace.track}</div>
          <div className="race-date">
            🗓️{' '}
            {new Date(nextRace.scheduledDate).toLocaleString('ru-RU', {
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          <div style={{ marginTop: 12, fontSize: 14, opacity: 0.9 }}>
            Погода: {getWeatherEmoji(nextRace.weather)} {nextRace.weather}
          </div>
        </div>
      )}

      {/* Инструкция */}
      <div className="card">
        <div className="card-title">Как играть</div>
        <ol style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          <li>Создайте команду и выберите цвет</li>
          <li>Улучшайте компоненты машины</li>
          <li>Участвуйте в гонках каждые 2 дня</li>
          <li>Набирайте очки и побеждайте!</li>
        </ol>
      </div>
    </div>
  );
};

function getWeatherEmoji(weather: string): string {
  const map: Record<string, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    stormy: '⛈️',
  };
  return map[weather] || '🌤️';
}
