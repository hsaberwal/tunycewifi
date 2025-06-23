CREATE TABLE ads (
  id SERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  weight INTEGER DEFAULT 1,
  uploaded_by TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
  ad_filename TEXT,
  ip_address TEXT,
  device_info JSONB,
  ad_watch_timestamp TIMESTAMP,
  ad_completion_timestamp TIMESTAMP,
  watched_full_ad BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS reject_logs (
  id SERIAL PRIMARY KEY,
  mac_address TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reason TEXT
);

CREATE TABLE IF NOT EXISTS ad_views (
  id SERIAL PRIMARY KEY,
  mac_address TEXT NOT NULL,
  ad_filename TEXT NOT NULL,
  ad_id INTEGER,
  router_ip TEXT,
  user_agent_data TEXT,
  viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

