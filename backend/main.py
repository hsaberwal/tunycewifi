from fastapi import FastAPI, Header, HTTPException, status, Depends, Request, Path, File, UploadFile, Form, APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import shutil
import uuid
import psycopg2
import random
import os
from datetime import datetime, timedelta
import json
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles




app = FastAPI()

VIDEO_UPLOAD_DIR = "./videos"
os.makedirs(VIDEO_UPLOAD_DIR, exist_ok=True)

app.mount("/videos", StaticFiles(directory=VIDEO_UPLOAD_DIR), name="videos")

# CORS for frontend
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

# Config
with open("config.json") as f:
    config = json.load(f)

SESSION_DURATION_MINUTES = config.get("session_duration_minutes", 15)

# Auth helpers
def verify_admin(authorization: str = Header(...)):
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token format")
    token = authorization.replace("Bearer ", "")
    if token != ADMIN_TOKEN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized")
    return token

# Models
class AuthRequest(BaseModel):
    mac_address: str

class RejectLogRequest(BaseModel):
    mac_address: str
    reason: str

class AdWatchLogRequest(BaseModel):
    mac_address: str
    ad_filename: str
    router_ip: str
    user_agent_data: str
    ad_watch_timestamp: datetime
    ad_completion_timestamp: datetime

class AddRouterRequest(BaseModel):
    ip_address: str
    secret: str
    number_plate: str

class AdViewRequest(BaseModel):
    mac_address: str
    ad_filename: str
    ad_id: int | None = None
    router_ip: str
    user_agent_data: str

# Routes
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

@app.post("/api/log_ad_view")
async def log_ad_view(log: AdWatchLogRequest):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        cur.execute("SELECT id FROM routers WHERE ip_address = %s", (log.router_ip,))
        router_row = cur.fetchone()
        if not router_row:
            raise HTTPException(status_code=404, detail="Router not found")

        router_id = router_row[0]

        cur.execute("""
            INSERT INTO sessions (
              mac_address, start_time, end_time, ad_filename, router_id, ip_address,
              ad_watch_timestamp, ad_completion_timestamp, watched_full_ad
            )
            VALUES (%s, NOW(), NOW() + interval '%s minutes', %s, %s, %s, %s, %s, TRUE)
            ON CONFLICT (mac_address)
            DO UPDATE SET
              ad_filename = EXCLUDED.ad_filename,
              router_id = EXCLUDED.router_id,
              ip_address = EXCLUDED.ip_address,
              ad_watch_timestamp = EXCLUDED.ad_watch_timestamp,
              ad_completion_timestamp = EXCLUDED.ad_completion_timestamp,
              watched_full_ad = TRUE
        """, (
            log.mac_address,
            SESSION_DURATION_MINUTES,
            log.ad_filename,
            router_id,
            log.router_ip,
            log.ad_watch_timestamp,
            log.ad_completion_timestamp
        ))

        cur.execute("""
            UPDATE sessions
            SET device_type = %s
            WHERE mac_address = %s
        """, (log.user_agent_data, log.mac_address))

        conn.commit()
        cur.close()
        conn.close()

        return {"status": "ad_view_logged"}
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

@app.delete("/api/admin/sessions/{mac_address}")
def delete_session(mac_address: str = Path(...), admin: str = Depends(verify_admin)):
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


@app.get("/api/random_ad")
def get_random_ad():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT id, filename, weight FROM ads")
        ads = cur.fetchall()
        cur.close()
        conn.close()

        if not ads:
            raise HTTPException(status_code=404, detail="No ads found")

    # Choose an ad based on weight
        chosen = random.choices(ads, weights=[a[2] for a in ads], k=1)[0]
        return {"id": chosen[0], "filename": chosen[1]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@app.post("/api/upload_ad")
async def upload_ad(file: UploadFile = File(...), weight: int = Form(1), uploaded_by: str = Form("admin")):
    try:
        os.makedirs(VIDEO_UPLOAD_DIR, exist_ok=True)
        filepath = os.path.join(VIDEO_UPLOAD_DIR, file.filename)

        with open(filepath, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO ads (filename, weight, uploaded_by)
            VALUES (%s, %s, %s)
        """, (file.filename, weight, uploaded_by))
        conn.commit()
        cur.close()
        conn.close()

        return {"status": "success", "filename": file.filename}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/admin/routers")
def add_router(data: AddRouterRequest, admin: str = Depends(verify_admin)):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # Step 1: Check if matatu already exists
        cur.execute("SELECT id FROM matatus WHERE name = %s", (data.number_plate,))
        matatu = cur.fetchone()

        # Step 2: If not found, create it
        if not matatu:
            cur.execute("INSERT INTO matatus (name) VALUES (%s) RETURNING id", (data.number_plate,))
            matatu_id = cur.fetchone()[0]
        else:
            matatu_id = matatu[0]

        # Step 3: Insert router with linked matatu_id
        cur.execute("""
            INSERT INTO routers (ip_address, secret, matatu_id)
            VALUES (%s, %s, %s)
        """, (data.ip_address, data.secret, matatu_id))

        conn.commit()
        cur.close()
        conn.close()

        return {"status": "success", "matatu_id": matatu_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/routers")
def list_routers(admin: str = Depends(verify_admin)):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT id, name, ip_address FROM routers ORDER BY id DESC")
        rows = cur.fetchall()
        cur.close()
        conn.close()

        return [
            {"id": row[0], "name": row[1], "ip_address": row[2]}
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/reject-logs")
def get_reject_logs(admin: str = Depends(verify_admin)):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, mac_address, reason, timestamp
            FROM reject_logs
            ORDER BY timestamp DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        return [
            {
                "id": row[0],
                "mac_address": row[1],
                "reason": row[2],
                "timestamp": row[3].isoformat() + "Z" if row[3] else None
            }
            for row in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/ads")
def list_ads(admin: str = Depends(verify_admin)):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT filename, weight, uploaded_by FROM ads ORDER BY id DESC")
        rows = cur.fetchall()
        cur.close()
        conn.close()
        return [{"filename": r[0], "weight": r[1], "uploaded_by": r[2]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/admin/ads/{filename}")
def delete_ad(filename: str, admin: str = Depends(verify_admin)):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("DELETE FROM ads WHERE filename = %s", (filename,))
        conn.commit()
        cur.close()
        conn.close()
        # Optional: delete file from disk
        filepath = os.path.join(VIDEO_UPLOAD_DIR, filename)
        if os.path.exists(filepath):
            os.remove(filepath)
        return {"status": "deleted", "filename": filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))    


@app.post("/api/ad_view")
async def log_ad_view_entry(view: AdViewRequest):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO ad_views (
                mac_address,
                ad_filename,
                ad_id,
                router_ip,
                user_agent_data
            )
            VALUES (%s, %s, %s, %s, %s)
        """, (
            view.mac_address,
            view.ad_filename,
            view.ad_id,
            view.router_ip,
            view.user_agent_data
        ))

        conn.commit()
        cur.close()
        conn.close()

        return {"status": "ok", "message": "Ad view logged"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/ad_views")
def list_ad_views(admin: str = Depends(verify_admin)):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("""
            SELECT id, mac_address, ad_filename, ad_id, router_ip, user_agent_data, viewed_at
            FROM ad_views
            ORDER BY viewed_at DESC
        """)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        return [
            {
                "id": r[0],
                "mac_address": r[1],
                "ad_filename": r[2],
                "ad_id": r[3],
                "router_ip": r[4],
                "user_agent_data": r[5],
                "timestamp": r[6].isoformat() + "Z" if r[6] else None
            }
            for r in rows
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health_check():
    return {"status": "TunyceWifi Backend Running"}
