from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import psycopg2
import os

router = APIRouter()

DB_HOST = os.getenv("DB_HOST", "db")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "tunycewifi")
DB_USER = os.getenv("DB_USER", "tunyce")
DB_PASS = os.getenv("DB_PASS", "tunycepass")

class SessionRequest(BaseModel):
    mac_address: str  # Should be uppercased like AA:BB:CC:DD:EE:FF

@router.post("/grant")
def grant_wifi_access(data: SessionRequest):
    try:
        conn = psycopg2.connect(
            dbname=DB_NAME, user=DB_USER, password=DB_PASS,
            host=DB_HOST, port=DB_PORT
        )
        cur = conn.cursor()

        # Insert or update the dummy Cleartext-Password
        cur.execute("""
            INSERT INTO sessions (mac_address)
            VALUES (%s)
            ON CONFLICT (mac_address)
            DO UPDATE SET mac_address = EXCLUDED.mac_address
        """, (data.mac_address.upper(),))

        conn.commit()
        cur.close()
        conn.close()
        return {"status": "ok", "mac": data.mac_address.upper()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

