-- Создание таблиц для игры F1 Championship

-- Таблица игроков
CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица команд
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL, -- HEX цвет, например #FF0000
    budget INTEGER DEFAULT 10000,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(player_id)
);

-- Таблица компонентов машины
CREATE TABLE IF NOT EXISTS car_components (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- engine, chassis, aerodynamics, tires, electronics
    name VARCHAR(255) NOT NULL,
    level INTEGER NOT NULL,
    power INTEGER DEFAULT 0,
    reliability INTEGER DEFAULT 0,
    handling INTEGER DEFAULT 0,
    speed INTEGER DEFAULT 0,
    grip INTEGER DEFAULT 0,
    stability INTEGER DEFAULT 0,
    cost INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица машин
CREATE TABLE IF NOT EXISTS cars (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    engine_id INTEGER REFERENCES car_components(id),
    chassis_id INTEGER REFERENCES car_components(id),
    aerodynamics_id INTEGER REFERENCES car_components(id),
    tires_id INTEGER REFERENCES car_components(id),
    electronics_id INTEGER REFERENCES car_components(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id)
);

-- Таблица сезонов
CREATE TABLE IF NOT EXISTS seasons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица гонок
CREATE TABLE IF NOT EXISTS races (
    id SERIAL PRIMARY KEY,
    season_id INTEGER REFERENCES seasons(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    track VARCHAR(255) NOT NULL,
    scheduled_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
    weather VARCHAR(50) DEFAULT 'sunny', -- sunny, cloudy, rainy, stormy
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Таблица результатов гонок
CREATE TABLE IF NOT EXISTS race_results (
    id SERIAL PRIMARY KEY,
    race_id INTEGER REFERENCES races(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    points INTEGER NOT NULL,
    fastest_lap BOOLEAN DEFAULT false,
    dnf BOOLEAN DEFAULT false, -- Did Not Finish
    dnf_reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(race_id, team_id)
);

-- Таблица покупок компонентов
CREATE TABLE IF NOT EXISTS team_components (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    component_id INTEGER REFERENCES car_components(id),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, component_id)
);

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_players_telegram_id ON players(telegram_id);
CREATE INDEX IF NOT EXISTS idx_teams_player_id ON teams(player_id);
CREATE INDEX IF NOT EXISTS idx_races_season_id ON races(season_id);
CREATE INDEX IF NOT EXISTS idx_races_scheduled_date ON races(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_race_results_race_id ON race_results(race_id);
CREATE INDEX IF NOT EXISTS idx_race_results_team_id ON race_results(team_id);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для обновления updated_at
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cars_updated_at BEFORE UPDATE ON cars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
