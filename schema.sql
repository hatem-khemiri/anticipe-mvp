-- ============================================
-- SCHÉMA DE BASE DE DONNÉES MVP BAKERY FORECAST
-- ============================================

-- Table des utilisateurs (boutiques)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    shop_name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des produits
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    business_importance VARCHAR(50) CHECK (business_importance IN ('coeur', 'secondaire', 'opportuniste')),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Table des ventes journalières
CREATE TABLE daily_sales (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    sale_date DATE NOT NULL,
    quantity_sold INTEGER NOT NULL DEFAULT 0,
    quantity_unsold INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, product_id, sale_date)
);

-- Table des calendriers culturels pré-configurés
CREATE TABLE cultural_calendars (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('catholique', 'musulman', 'juif', 'commercial', 'custom')),
    description TEXT
);

-- Table des événements culturels
CREATE TABLE cultural_events (
    id SERIAL PRIMARY KEY,
    calendar_id INTEGER REFERENCES cultural_calendars(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    event_type VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    is_fixed_date BOOLEAN DEFAULT TRUE,
    default_impact_percent DECIMAL(5, 2) DEFAULT 10.00,
    affected_categories TEXT[]
);

-- Table des calendriers activés par utilisateur
CREATE TABLE user_calendars (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    calendar_id INTEGER REFERENCES cultural_calendars(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, calendar_id)
);

-- Table des événements exceptionnels déclarés par l'utilisateur
CREATE TABLE exceptional_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    impact_percent DECIMAL(5, 2) DEFAULT 10.00,
    affected_categories TEXT[],
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des recommandations générées
CREATE TABLE recommendations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    recommendation_date DATE NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    quantity_standard INTEGER NOT NULL,
    quantity_prudent INTEGER NOT NULL,
    confidence_level INTEGER,
    
    weather_condition VARCHAR(50),
    weather_impact_percent DECIMAL(5, 2),
    season VARCHAR(20),
    day_of_week VARCHAR(20),
    active_cultural_events TEXT[],
    active_exceptional_events TEXT[],
    
    j7_value INTEGER,
    j14_value INTEGER,
    j365_value INTEGER,
    
    j7_weight DECIMAL(5, 2),
    j14_weight DECIMAL(5, 2),
    j365_weight DECIMAL(5, 2),
    
    total_adjustment_percent DECIMAL(5, 2),
    
    UNIQUE(user_id, product_id, recommendation_date)
);

-- Table des décisions finales du directeur
CREATE TABLE production_decisions (
    id SERIAL PRIMARY KEY,
    recommendation_id INTEGER REFERENCES recommendations(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    decision_date DATE NOT NULL,
    
    final_quantity INTEGER NOT NULL,
    
    chose_standard BOOLEAN,
    chose_prudent BOOLEAN,
    chose_custom BOOLEAN,
    
    notes TEXT,
    
    validated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, product_id, decision_date)
);

-- Table de cache météo
CREATE TABLE weather_cache (
    id SERIAL PRIMARY KEY,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    forecast_date DATE NOT NULL,
    
    temperature_avg DECIMAL(5, 2),
    precipitation_mm DECIMAL(6, 2),
    weather_condition VARCHAR(50),
    
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(latitude, longitude, forecast_date)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_daily_sales_user_date ON daily_sales(user_id, sale_date);
CREATE INDEX idx_daily_sales_product_date ON daily_sales(product_id, sale_date);
CREATE INDEX idx_recommendations_user_date ON recommendations(user_id, recommendation_date);
CREATE INDEX idx_cultural_events_dates ON cultural_events(start_date, end_date);
CREATE INDEX idx_exceptional_events_dates ON exceptional_events(start_date, end_date);
CREATE INDEX idx_weather_cache_location_date ON weather_cache(latitude, longitude, forecast_date);

-- Données initiales : calendriers culturels
INSERT INTO cultural_calendars (name, type, description) VALUES
('Calendrier Catholique', 'catholique', 'Principales fêtes catholiques'),
('Calendrier Musulman', 'musulman', 'Principales fêtes musulmanes'),
('Calendrier Commercial', 'commercial', 'Événements commerciaux majeurs');

-- Événements catholiques
INSERT INTO cultural_events (calendar_id, name, event_type, start_date, end_date, is_fixed_date, default_impact_percent) VALUES
((SELECT id FROM cultural_calendars WHERE type = 'catholique'), 'Jour de l''An', 'ferie', '2025-01-01', '2025-01-01', TRUE, 15.00),
((SELECT id FROM cultural_calendars WHERE type = 'catholique'), 'Épiphanie', 'religieux', '2025-01-06', '2025-01-06', TRUE, 20.00),
((SELECT id FROM cultural_calendars WHERE type = 'catholique'), 'Chandeleur', 'religieux', '2025-02-02', '2025-02-02', TRUE, 25.00),
((SELECT id FROM cultural_calendars WHERE type = 'catholique'), 'Saint-Valentin', 'commercial', '2025-02-14', '2025-02-14', TRUE, 15.00),
((SELECT id FROM cultural_calendars WHERE type = 'catholique'), 'Mardi Gras', 'religieux', '2025-03-04', '2025-03-04', FALSE, 20.00),
((SELECT id FROM cultural_calendars WHERE type = 'catholique'), 'Pâques', 'religieux', '2025-04-20', '2025-04-21', FALSE, 30.00),
((SELECT id FROM cultural_calendars WHERE type = 'catholique'), 'Fête du Travail', 'ferie', '2025-05-01', '2025-05-01', TRUE, 10.00),
((SELECT id FROM cultural_calendars WHERE type = 'catholique'), 'Ascension', 'religieux', '2025-05-29', '2025-05-29', FALSE, 15.00),
((SELECT id FROM cultural_calendars WHERE type = 'catholique'), 'Pentecôte', 'religieux', '2025-06-08', '2025-06-09', FALSE, 15.00),
((SELECT id FROM cultural_calendars WHERE type = 'catholique'), 'Fête Nationale', 'ferie', '2025-07-14', '2025-07-14', TRUE, 20.00),
((SELECT id FROM cultural_calendars WHERE type = 'catholique'), 'Assomption', 'religieux', '2025-08-15', '2025-08-15', TRUE, 15.00),
((SELECT id FROM cultural_calendars WHERE type = 'catholique'), 'Toussaint', 'religieux', '2025-11-01', '2025-11-01', TRUE, 10.00),
((SELECT id FROM cultural_calendars WHERE type = 'catholique'), 'Armistice', 'ferie', '2025-11-11', '2025-11-11', TRUE, 10.00),
((SELECT id FROM cultural_calendars WHERE type = 'catholique'), 'Noël', 'religieux', '2025-12-24', '2025-12-26', TRUE, 40.00);

-- Événements musulmans 2025
INSERT INTO cultural_events (calendar_id, name, event_type, start_date, end_date, is_fixed_date, default_impact_percent) VALUES
((SELECT id FROM cultural_calendars WHERE type = 'musulman'), 'Ramadan 2025', 'religieux', '2025-02-28', '2025-03-30', FALSE, 30.00),
((SELECT id FROM cultural_calendars WHERE type = 'musulman'), 'Aïd al-Fitr 2025', 'religieux', '2025-03-30', '2025-04-01', FALSE, 50.00),
((SELECT id FROM cultural_calendars WHERE type = 'musulman'), 'Aïd al-Adha 2025', 'religieux', '2025-06-06', '2025-06-09', FALSE, 40.00);

-- Événements commerciaux
INSERT INTO cultural_events (calendar_id, name, event_type, start_date, end_date, is_fixed_date, default_impact_percent) VALUES
((SELECT id FROM cultural_calendars WHERE type = 'commercial'), 'Soldes d''Hiver', 'commercial', '2025-01-08', '2025-02-04', TRUE, 15.00),
((SELECT id FROM cultural_calendars WHERE type = 'commercial'), 'Fête des Mères', 'commercial', '2025-05-25', '2025-05-25', FALSE, 25.00),
((SELECT id FROM cultural_calendars WHERE type = 'commercial'), 'Fête des Pères', 'commercial', '2025-06-15', '2025-06-15', FALSE, 20.00),
((SELECT id FROM cultural_calendars WHERE type = 'commercial'), 'Soldes d''Été', 'commercial', '2025-06-25', '2025-07-22', TRUE, 15.00),
((SELECT id FROM cultural_calendars WHERE type = 'commercial'), 'Rentrée Scolaire', 'commercial', '2025-09-01', '2025-09-05', TRUE, 20.00),
((SELECT id FROM cultural_calendars WHERE type = 'commercial'), 'Black Friday', 'commercial', '2025-11-28', '2025-11-28', FALSE, 10.00);