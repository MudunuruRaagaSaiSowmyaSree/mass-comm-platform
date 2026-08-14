from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.routers import auth, audience, campaign, template, voice

app = FastAPI(title="AI-Based Multilingual Assistance System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(audience.router)
app.include_router(campaign.router)
app.include_router(template.router)
app.include_router(voice.router)

app.mount("/audio", StaticFiles(directory="generated_audio"), name="audio")


@app.get("/")
def home():
    return {"message": "Backend is working!"}