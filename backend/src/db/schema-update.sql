-- Обновление схемы БД для новых функций

-- Обновляем таблицу teams
ALTER TABLE teams ADD COLUMN IF NOT EXISTS max_currency INTEGER DEFAULT 50;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS pilot1_id INTEGER REFERENCES pilots(id);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS pilot2_id INTEGER REFERENCES pilots(id);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS referred_by INTEGER REFERENCES players(id);

-- Таблица пилотов
CREATE TABLE IF NOT EXISTS pilots (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
    skill INTEGER NOT NULL,
    experience INTEGER NOT NULL,
    consistency INTEGER NOT NULL,
    aggression INTEGER NOT NULL,
    cost INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица пилотов команды (инвентарь)
CREATE TABLE IF NOT EXISTS team_pilots (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    pilot_id INTEGER REFERENCES pilots(id),
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, pilot_id)
);

-- Таблица квалификации
CREATE TABLE IF NOT EXISTS qualifications (
    id SERIAL PRIMARY KEY,
    race_id INTEGER REFERENCES races(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    lap_time INTEGER NOT NULL, -- в миллисекундах
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(race_id, team_id)
);

-- Таблица наборов/кейсов
CREATE TABLE IF NOT EXISTS crates (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- daily, bronze, silver, gold, season_reward
    status VARCHAR(50) DEFAULT 'locked', -- locked, ready, opened
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    opened_at TIMESTAMP
);

-- Таблица наград из кейсов
CREATE TABLE IF NOT EXISTS crate_rewards (
    id SERIAL PRIMARY KEY,
    crate_id INTEGER REFERENCES crates(id) ON DELETE CASCADE,
    reward_type VARCHAR(50) NOT NULL, -- component, pilot, money, max_currency
    reward_id INTEGER, -- ID компонента или пилота
    amount INTEGER, -- Для денег или Max валюты
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица рефералов
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    referred_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    reward_given BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referred_id)
);

-- Таблица транзакций Max валюты
CREATE TABLE IF NOT EXISTS max_transactions (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL, -- purchase, reward, spend
    description TEXT,
    telegram_payment_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица для отслеживания последнего получения ежедневного набора
CREATE TABLE IF NOT EXISTS daily_crate_claims (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    last_claim_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица стратегий гонок
CREATE TABLE IF NOT EXISTS race_strategies (
    id SERIAL PRIMARY KEY,
    race_id INTEGER REFERENCES races(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    pit_stops JSONB NOT NULL, -- Массив объектов {lap: number, tireType: string}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(race_id, team_id)
);

-- Таблица данных по кругам гонки (для визуализации)
CREATE TABLE IF NOT EXISTS lap_data (
    id SERIAL PRIMARY KEY,
    race_id INTEGER REFERENCES races(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    lap INTEGER NOT NULL,
    position INTEGER NOT NULL,
    lap_time INTEGER NOT NULL, -- в миллисекундах
    tire_type VARCHAR(20) NOT NULL,
    tire_age INTEGER NOT NULL, -- количество кругов на этих шинах
    is_in_pit BOOLEAN DEFAULT false,
    pit_time INTEGER, -- время в пит-лейн в миллисекундах
    total_time BIGINT NOT NULL, -- общее время гонки в миллисекундах
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_pilots_level ON pilots(level);
CREATE INDEX IF NOT EXISTS idx_qualifications_race_id ON qualifications(race_id);
CREATE INDEX IF NOT EXISTS idx_crates_team_id ON crates(team_id);
CREATE INDEX IF NOT EXISTS idx_crates_status ON crates(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_max_transactions_player_id ON max_transactions(player_id);
CREATE INDEX IF NOT EXISTS idx_race_strategies_race_id ON race_strategies(race_id);
CREATE INDEX IF NOT EXISTS idx_race_strategies_team_id ON race_strategies(team_id);
CREATE INDEX IF NOT EXISTS idx_lap_data_race_id ON lap_data(race_id);
CREATE INDEX IF NOT EXISTS idx_lap_data_team_id ON lap_data(team_id);
CREATE INDEX IF NOT EXISTS idx_lap_data_race_lap ON lap_data(race_id, lap);
