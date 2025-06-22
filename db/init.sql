CREATE TABLE IF NOT EXISTS ads (
  id SERIAL PRIMARY KEY,
  file_path TEXT,
  weight INTEGER DEFAULT 1,
  duration INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matatus (
  id SERIAL PRIMARY KEY,
  number_plate TEXT NOT NULL UNIQUE,
  route_name TEXT,
  stage TEXT,
  owner_name TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routers (
  id SERIAL PRIMARY KEY,
  name TEXT,
  ip_address TEXT NOT NULL,
  secret TEXT NOT NULL,
  matatu_id INTEGER REFERENCES matatus(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
  id SERIAL PRIMARY KEY,
  mac_address TEXT NOT NULL UNIQUE,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  device_type TEXT,
  router_id INTEGER REFERENCES routers(id),
  ad_id INTEGER REFERENCES ads(id)
);

CREATE TABLE IF NOT EXISTS reject_logs (
  id SERIAL PRIMARY KEY,
  mac_address TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT
);

