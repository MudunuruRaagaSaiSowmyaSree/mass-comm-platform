from fastapi import FastAPI

app = FastAPI(title="Mass Comm Platform API")

@app.get("/health")
def health_check():
    return {"status": "ok"}