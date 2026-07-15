import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import RouteRequest, RouteResponse
from services.ors_client import OrsClient, OrsError
from engine.ors import OrsEngine

@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.engine = OrsEngine(OrsClient())
    yield
    await app.state.engine.ors.aclose()

app = FastAPI(title="HopDot API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("ALLOWED_ORIGIN", "http://localhost:3000")],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/route", response_model=RouteResponse)
async def create_route(req: RouteRequest):
    try:
        return await app.state.engine.generate(req)
    except OrsError as e:
        raise HTTPException(status_code=429 if e.status == 429 else 502,
                            detail=str(e))
