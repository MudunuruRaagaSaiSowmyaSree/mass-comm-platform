from app import models  # noqa: F401 — ensures all models are registered
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, audience, campaign, template

app = FastAPI(title="Mass Comm Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(audience.router)
app.include_router(campaign.router)
app.include_router(template.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}