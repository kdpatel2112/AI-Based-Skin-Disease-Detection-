"""
FastAPI application entrypoint: wires up middleware, rate limiting, and all
feature routers for the AI Skin Disease Detection and Recommendation System.
# Force reload for config change

"""
import os
import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api.routes import auth, predict, recommendations, doctors, reports, dashboard, admin, chatbot, feedback
from app.core.config import settings
from app.db.mongodb import init_indexes

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="AI Skin Disease Detection and Recommendation System",
    description="Educational, AI-assisted skin condition screening and recommendation API.",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_origin,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://10.63.253.28:5173",
    ],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(predict.router)
app.include_router(recommendations.router)
app.include_router(doctors.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(admin.router)
app.include_router(chatbot.router)
app.include_router(feedback.router)

# Mount local static files directory for uploads fallback
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.on_event("startup")
async def on_startup():
    try:
        # Wrap index creation and directory seeding in a 3-second connection timeout
        await asyncio.wait_for(init_indexes(), timeout=3.0)
    except Exception as e:
        print("\n" + "=" * 60)
        print("DATABASE WARNING: Could not connect to MongoDB Atlas.")
        print(f"   Connection String: {settings.mongodb_uri}")
        print("   Registration, dashboards, and favorites will require a live database.")
        print("   Please start local MongoDB or update MONGODB_URI in your .env file.")
        print(f"   Details: {e}")
        print("=" * 60 + "\n")


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    import traceback
    traceback.print_exc()
    return JSONResponse(status_code=500, content={"detail": "An unexpected error occurred."})
