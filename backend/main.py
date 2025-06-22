from fastapi import  Header, FastAPI, HTTPException, status, Depends, Request, Path
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import psycopg2
import os
from datetime import datetime, timedelta
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()



# Allow CORS from your frontend container
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://192.168.100.160"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = os.getenv("DATABASE_URL")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "changeme123")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "secretadmin")



def verify_admin(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format")
    token = authorization.replace("Bearer ", "")
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
    return token


# Load config.json
with open("config.json") as f:
    config = json.load(f)

SESSION_DURATION_MINUTES = config.get("session_duration_minutes", 15)


class AuthRequest(BaseModel):
    mac_address: str

class RejectLogRequest(BaseModel):
    mac_address: str
    reason: str

@app.post("/api/authorize")
async def authorize(auth: AuthRequest):
    if not auth.mac_address:
        raise HTTPException(status_code=400, detail="MAC address required")

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        now = datetime.utcnow()
        end_time = now + timedelta(minutes=SESSION_DURATION_MINUTES)

        cur.execute("""
            INSERT INTO sessions (mac_address, start_time, end_time)
            VALUES (%s, %s, %s)
            ON CONFLICT (mac_address)
            DO UPDATE SET start_time = EXCLUDED.start_time,
                          end_time = EXCLUDED.end_time
        """, (auth.mac_address, now, end_time))

        conn.commit()
        cur.close()
        conn.close()

        return {"status": "authorized", "session_ends": end_time.isoformat()}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/check_authorization")
async def check_authorization(auth: AuthRequest):
    if not auth.mac_address:
        raise HTTPException(status_code=400, detail="MAC address required")

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        cur.execute("""
            SELECT end_time FROM sessions
            WHERE mac_address = %s
            ORDER BY end_time DESC
            LIMIT 1
        """, (auth.mac_address,))
        result = cur.fetchone()

        cur.close()
        conn.close()

        if result:
            end_time = result[0]
            if end_time > datetime.utcnow():
                return {"status": "authorized", "session_ends": end_time.isoformat()}

        raise HTTPException(status_code=403, detail="Session expired or not found")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/session_status")
async def session_status(auth: AuthRequest):
    if not auth.mac_address:
        raise HTTPException(status_code=400, detail="MAC address required")

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        cur.execute("""
            SELECT end_time FROM sessions
            WHERE mac_address = %s
            ORDER BY end_time DESC
            LIMIT 1
        """, (auth.mac_address,))
        result = cur.fetchone()

        cur.close()
        conn.close()

        if not result:
            return JSONResponse(status_code=404, content={"status": "not_found"})

        end_time = result[0]
        now = datetime.utcnow()

        if end_time > now:
            minutes_remaining = int((end_time - now).total_seconds() // 60)
            return {
                "status": "active",
                "minutes_remaining": minutes_remaining,
                "session_ends": end_time.isoformat() + "Z"
            }
        else:
            return {"status": "expired"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/sessions")
def list_sessions(admin: str = Depends(verify_admin)):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("""
            SELECT mac_address, start_time, end_time, device_type, router_id
            FROM sessions
            ORDER BY start_time DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [
            {
                "mac_address": row[0],
                "start_time": row[1],
                "end_time": row[2],
                "device_type": row[3],
                "router_id": row[4]
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


from fastapi import Path

@app.delete("/api/admin/sessions/{mac_address}")
def delete_session(
    mac_address: str = Path(..., description="MAC address of the device"),
    admin: str = Depends(verify_admin)
):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        cur.execute("DELETE FROM sessions WHERE mac_address = %s", (mac_address,))
        deleted = cur.rowcount
        conn.commit()

        cur.close()
        conn.close()

        if deleted == 0:
            raise HTTPException(status_code=404, detail="Session not found")
        return {"status": "deleted", "mac_address": mac_address}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/api/log_reject")
async def log_reject(log: RejectLogRequest):
    if not log.mac_address or not log.reason:
        raise HTTPException(status_code=400, detail="MAC address and reason required")

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO reject_logs (mac_address, reason)
            VALUES (%s, %s)
        """, (log.mac_address, log.reason))

        conn.commit()
        cur.close()
        conn.close()

        return {"status": "logged"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health_check():
    return {"status": "TunyceWifi Backend Running"}

