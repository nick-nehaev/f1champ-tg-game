import { useEffect, useState } from 'react';
import { raceAPI } from '../services/api';

export const Standings = () => {
  const [standings, setStandings] = useState<any[]>([]);
  const [season, setSeason] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [standingsRes, seasonRes] = await Promise.all([
        raceAPI.getStandings(),
        raceAPI.getActiveSeason(),
      ]);

      if (standingsRes.success && standingsRes.data) {
        setStandings(standingsRes.data);
      }

      if (seasonRes.success && seasonRes.data) {
        setSeason(seasonRes.data);
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

  const getMedalEmoji = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return '';
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>
        🏆 Турнирная таблица
      </h1>

      {error && <div className="error">{error}</div>}

      {season && (
        <div className="card">
          <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            {season.name}
          </div>
          <div style={{ fontSize: 14, opacity: 0.7 }}>
            {new Date(season.start_date).toLocaleDateString('ru-RU')} -{' '}
            {new Date(season.end_date).toLocaleDateString('ru-RU')}
          </div>
        </div>
      )}

      {standings.length === 0 ? (
        <div className="card">
          <p>Пока нет результатов</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table className="standings-table">
            <thead>
              <tr>
                <th>Место</th>
                <th>Команда</th>
                <th>Очки</th>
                <th>Победы</th>
                <th>Подиумы</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((entry) => (
                <tr key={entry.teamId}>
                  <td>
                    <span className="position">
                      {getMedalEmoji(entry.position)} {entry.position}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span
                        className="team-color"
                        style={{ backgroundColor: entry.teamColor }}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{entry.teamName}</div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          @{entry.playerUsername || 'unknown'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>
                      {entry.totalPoints}
                    </span>
                  </td>
                  <td>{entry.wins}</td>
                  <td>{entry.podiums}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Легенда очков */}
      <div className="card">
        <div className="card-title">Система очков</div>
        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
          <div>🥇 1 место - 25 очков</div>
          <div>🥈 2 место - 18 очков</div>
          <div>🥉 3 место - 15 очков</div>
          <div>4 место - 12 очков</div>
          <div>5 место - 10 очков</div>
          <div>6-10 места - 8, 6, 4, 2, 1 очков</div>
          <div>⚡ Быстрейший круг - +1 очко</div>
        </div>
      </div>
    </div>
  );
};
