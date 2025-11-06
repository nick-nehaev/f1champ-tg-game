import { useState } from 'react';
import { playerAPI } from '../services/api';

interface CreateTeamProps {
  onTeamCreated: () => void;
}

export const CreateTeam = ({ onTeamCreated }: CreateTeamProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#FF0000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const colors = [
    '#FF0000', // Red
    '#0000FF', // Blue
    '#00FF00', // Green
    '#FFFF00', // Yellow
    '#FF6600', // Orange
    '#9900FF', // Purple
    '#00FFFF', // Cyan
    '#FF00FF', // Magenta
    '#000000', // Black
    '#FFFFFF', // White
    '#808080', // Gray
    '#FF1493', // Pink
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Введите название команды');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await playerAPI.createTeam({ name: name.trim(), color });

      if (response.success) {
        onTeamCreated();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>
        Создание команды
      </h1>

      <form onSubmit={handleSubmit}>
        <div className="card">
          <div className="card-title">Название команды</div>
          <input
            type="text"
            className="input"
            placeholder="Введите название..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            disabled={loading}
          />

          <div className="card-title" style={{ marginTop: 16 }}>
            Цвет команды
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
              marginBottom: 16,
            }}
          >
            {colors.map((c) => (
              <div
                key={c}
                onClick={() => !loading && setColor(c)}
                style={{
                  width: '100%',
                  height: 50,
                  borderRadius: 8,
                  backgroundColor: c,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  border: c === color ? '3px solid var(--tg-theme-button-color)' : '2px solid #ddd',
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              />
            ))}
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 8,
              background: 'var(--tg-theme-bg-color)',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  backgroundColor: color,
                }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>
                  {name.trim() || 'Название команды'}
                </div>
                <div style={{ fontSize: 14, opacity: 0.7 }}>Предпросмотр</div>
              </div>
            </div>
          </div>

          {error && <div className="error">{error}</div>}

          <button type="submit" className="button" disabled={loading || !name.trim()}>
            {loading ? 'Создание...' : 'Создать команду'}
          </button>
        </div>
      </form>
    </div>
  );
};
