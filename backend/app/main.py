from fastapi import FastAPI
from app.routers import auth, audience

app = FastAPI(title="Mass Comm Platform API")

app.include_router(auth.router)
app.include_router(audience.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}