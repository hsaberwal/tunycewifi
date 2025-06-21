from fastapi import FastAPI, Request, HTTPException
from pydantic import BaseModel
import psycopg2
import os
from datetime import datetime
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse

app = FastAPI()

DATABASE_URL = os.getenv("DATABASE_URL")

# Serve static files (e.g., portal HTML)
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    # You can later move this to a template
    return HTMLResponse(content="""
    <html>
      <head><title>Welcome</title></head>
      <body>
        <h1>Welcome to Tunyce Wifi</h1>
        <p>You will get 15 mins of free internet after watching an ad.</p>
        <form action="/api/authorize" method="post">
          <input type="hidden" name="mac_address" value="AA:BB:CC:DD:EE:FF" />
          <button type="submit">Continue</button>
        </form>
      </body>
    </html>
    """)


class AuthRequest(BaseModel):
    mac_address: str


@app.post("/api/authorize")
async def authorize(auth: AuthRequest):
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        cur.execute(
            "INSERT INTO sessions (mac_address, start_time) VALUES (%s, %s) "
            "ON CONFLICT (mac_address) DO UPDATE SET start_time = EXCLUDED.start_time",
            (auth.mac_address, datetime.now())
        )

        conn.commit()
        cur.close()
        conn.close()

        return {"status": "authorized"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health():
    return {"status": "TunyceWifi Backend Running"}

