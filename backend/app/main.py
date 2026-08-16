from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import init_db

from app.routers import (
    auth,
    audience,
    campaign,
    template,
    voice,
    chat,
    campaign_recipient,
    message_delivery,
    content,
    compliance,
    review,
    pipeline,
    translation,
    weather,
    mandi,
    report,
)

from app.routers.chat_history import router as chat_history_router
from app.routers.ai import router as ai_router


# ============================================================
# LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="AI-Based Multilingual Assistance System",
    lifespan=lifespan,
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ROUTERS
# ============================================================

app.include_router(auth.router)

app.include_router(audience.router)

app.include_router(campaign.router)

app.include_router(template.router)

app.include_router(voice.router)

app.include_router(chat.router)

app.include_router(campaign_recipient.router)

app.include_router(message_delivery.router)

app.include_router(content.router)

app.include_router(compliance.router)

app.include_router(review.router)

app.include_router(pipeline.router)

app.include_router(translation.router)

app.include_router(chat_history_router)

app.include_router(ai_router)

app.include_router(weather.router)

app.include_router(mandi.router)

app.include_router(report.router)


# ============================================================
# STATIC AUDIO FILES
# ============================================================

app.mount(
    "/audio",
    StaticFiles(directory="generated_audio"),
    name="audio",
)


# ============================================================
# HOME
# ============================================================

@app.get("/")
def home():
    return {
        "message": "Backend is working!"
    }