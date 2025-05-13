from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Allow CORS for frontend (replace with your Vercel URL later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporary for testing
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Hello from HopDot Backend!"}

@app.get("/api/test")
def test_endpoint():
    return {"status": "OK", "data": "Backend connected successfully!"}