import { useEffect, useState } from 'react';
import { carAPI } from '../services/api';
import { ComponentType } from '@f1champ/shared';

export const Garage = () => {
  const [car, setCar] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [allComponents, setAllComponents] = useState<any[]>([]);
  const [ownedComponents, setOwnedComponents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState<ComponentType>(
    ComponentType.ENGINE
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [carRes, allRes, ownedRes] = await Promise.all([
        carAPI.getCar(),
        carAPI.getAllComponents(),
        carAPI.getTeamComponents(),
      ]);

      if (carRes.success && carRes.data) {
        setCar(carRes.data.car);
        setStats(carRes.data.stats);
      }

      if (allRes.success && allRes.data) {
        setAllComponents(allRes.data);
      }

      if (ownedRes.success && ownedRes.data) {
        setOwnedComponents(ownedRes.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyComponent = async (componentId: number) => {
    try {
      const response = await carAPI.buyComponent(componentId);
      if (response.success) {
        await loadData();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleInstallComponent = async (componentId: number, type: ComponentType) => {
    try {
      const update: any = {};
      update[`${type}Id`] = componentId;

      const response = await carAPI.updateCar(update);
      if (response.success) {
        await loadData();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!car) {
    return <div className="error">Машина не найдена</div>;
  }

  const componentTypes = [
    { type: ComponentType.ENGINE, label: 'Двигатель', emoji: '🏎️' },
    { type: ComponentType.CHASSIS, label: 'Шасси', emoji: '🔧' },
    { type: ComponentType.AERODYNAMICS, label: 'Аэродинамика', emoji: '💨' },
    { type: ComponentType.TIRES, label: 'Шины', emoji: '⚫' },
    { type: ComponentType.ELECTRONICS, label: 'Электроника', emoji: '⚡' },
  ];

  const filteredComponents = allComponents.filter((c) => c.type === selectedType);
  const ownedIds = new Set(ownedComponents.map((c) => c.id));

  return (
    <div>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 20 }}>
        🏎️ Гараж
      </h1>

      {error && <div className="error">{error}</div>}

      {/* Характеристики машины */}
      {stats && (
        <div className="card">
          <div className="card-title">Характеристики машины</div>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">Мощность</div>
              <div className="stat-value">{stats.totalPower}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Надежность</div>
              <div className="stat-value">{stats.totalReliability}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Управление</div>
              <div className="stat-value">{stats.totalHandling}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Скорость</div>
              <div className="stat-value">{stats.totalSpeed}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Сцепление</div>
              <div className="stat-value">{stats.totalGrip}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Стабильность</div>
              <div className="stat-value">{stats.totalStability}</div>
            </div>
          </div>
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: 'var(--tg-theme-button-color)',
              color: 'white',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 14, opacity: 0.9 }}>Общий рейтинг</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>
              {stats.overallRating}
            </div>
          </div>
        </div>
      )}

      {/* Выбор типа компонента */}
      <div className="nav">
        {componentTypes.map(({ type, label, emoji }) => (
          <button
            key={type}
            className={`nav-button ${selectedType === type ? 'active' : ''}`}
            onClick={() => setSelectedType(type)}
          >
            {emoji} {label}
          </button>
        ))}
      </div>

      {/* Список компонентов */}
      <div className="grid">
        {filteredComponents.map((component) => {
          const isOwned = ownedIds.has(component.id);
          const isInstalled =
            car[`${component.type}Id`] === component.id;

          return (
            <div
              key={component.id}
              className={`component-item ${isOwned ? 'owned' : ''} ${
                isInstalled ? 'selected' : ''
              }`}
              onClick={() => {
                if (isOwned && !isInstalled) {
                  handleInstallComponent(component.id, component.type);
                } else if (!isOwned) {
                  handleBuyComponent(component.id);
                }
              }}
            >
              <div className="component-name">{component.name}</div>
              <div className="component-level">Уровень {component.level}</div>
              <div className="component-stats">
                {component.power > 0 && `💪 ${component.power} `}
                {component.reliability > 0 && `🛡️ ${component.reliability} `}
                {component.handling > 0 && `🎮 ${component.handling} `}
                {component.speed > 0 && `⚡ ${component.speed} `}
                {component.grip > 0 && `🔒 ${component.grip} `}
                {component.stability > 0 && `⚖️ ${component.stability}`}
              </div>
              <div className="component-cost">
                {isInstalled
                  ? '✓ Установлен'
                  : isOwned
                  ? '✓ В наличии'
                  : `$${component.cost.toLocaleString()}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
