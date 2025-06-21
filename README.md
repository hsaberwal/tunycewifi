# TunyceWifi

A containerized ad-supported WiFi access platform using MikroTik, FreeRADIUS, FastAPI, PostgreSQL, and React.

## Features

- Users watch a short ad to get 15 minutes of WiFi.
- Admin portal to view and manage active sessions.
- Session enforcement using MAC-based RADIUS.
- React frontend served via Nginx.
- API backend with FastAPI + PostgreSQL.

## Architecture

- `frontend/`: React app with admin and user flow.
- `backend/`: FastAPI app managing sessions and auth.
- `db/`: Postgres DB container with initial schema.
- `freeradius/`: Containerized RADIUS server.
- `docker-compose.yml`: Launches the whole stack.

## Usage

```bash
git clone https://github.com/<your-username>/tunycewifi.git
cd tunycewifi
docker-compose up --build

