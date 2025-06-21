from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
import asyncpg
import os

router = APIRouter()

DB_DSN = os.getenv("DATABASE_URL")

async def get_db_connection():
    return await asyncpg.connect(dsn=DB_DSN)

@router.post("/api/authorize")
async def authorize(request: Request):
    try:
        data = await request.json()
        mac_address = data.get("mac")

        if not mac_address:
            return JSONResponse(status_code=400, content={"detail": "MAC address required"})

        conn = await get_db_connection()
        row = await conn.fetchrow(
            "SELECT expires_at FROM authorized_devices WHERE mac_address = $1", mac_address
        )
        await conn.close()

        if row:
            # Optional: check if still valid
            return {"authorized": True, "mac": mac_address}
        else:
            return {"authorized": False, "mac": mac_address}

    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

