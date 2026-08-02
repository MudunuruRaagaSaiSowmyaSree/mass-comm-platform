import os
import tempfile
from typing import Optional
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from gtts import gTTS
import whisper

from app.nlp_utils import IndicProcessor
from app.session_manager import SessionManager

app = FastAPI()

# 1. Enable CORS Middleware for Frontend Communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Pydantic Models
class UserRegister(BaseModel):
    name: Optional[str] = "User"
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = "User"

class AudienceMember(BaseModel):
    name: str
    language: str
    geography: Optional[str] = "General"
    occupation: Optional[str] = "General"

# 3. In-memory Audience Storage (Mock DB)
audience_db = [
    {
        "id": "1",
        "name": "Raaga Sai",
        "language": "hi",
        "geography": "Bihar",
        "occupation": "Farmer"
    },
    {
        "id": "2",
        "name": "Sowmya Sree",
        "language": "te",
        "geography": "Telangana",
        "occupation": "Teacher"
    }
]

# 4. Load Models & Utilities
stt_model = whisper.load_model("base")
nlp_processor = IndicProcessor()
session_mgr = SessionManager()


# ------------------------------------------------------------------
# AUTHENTICATION ENDPOINTS
# ------------------------------------------------------------------

@app.post("/auth/register")
async def register_user(user: UserRegister):
    return {
        "status": "success",
        "message": "User registered successfully!",
        "user": user
    }

@app.post("/auth/login")
async def login_user(request: Request):
    return {
        "status": "success",
        "access_token": "fake-jwt-token-for-development",
        "token_type": "bearer",
        "user": {
            "email": "admin@example.com",
            "role": "admin"
        }
    }


# ------------------------------------------------------------------
# AUDIENCE MANAGEMENT ENDPOINTS
# ------------------------------------------------------------------

@app.get("/audience/")
@app.get("/api/v1/audience/")
async def get_audience():
    return audience_db

@app.post("/audience/")
@app.post("/api/v1/audience/")
async def add_audience_member(member: AudienceMember):
    new_entry = {
        "id": str(len(audience_db) + 1),
        "name": member.name,
        "language": member.language,
        "geography": member.geography,
        "occupation": member.occupation
    }
    audience_db.append(new_entry)
    return {"status": "success", "data": new_entry}


# ------------------------------------------------------------------
# VOICE PROCESSING ENDPOINT
# ------------------------------------------------------------------

@app.post("/api/v1/voice-process")
async def process_voice(
    session_id: str = Form(...),
    file: UploadFile = File(...)
):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_audio:
        content = await file.read()
        temp_audio.write(content)
        temp_path = temp_audio.name

    try:
        result = stt_model.transcribe(temp_path)
        raw_text = result["text"]
        detected_lang = result["language"]

        cleaned_text = nlp_processor.clean_text(raw_text, detected_lang)
        bot_response_text = f"Received query in {detected_lang}: {cleaned_text}"

        session_mgr.add_interaction(session_id, cleaned_text, bot_response_text, detected_lang)

        tts_output_path = f"temp_output_{session_id}.mp3"
        tts_lang = detected_lang if detected_lang in ['hi', 'ta', 'te', 'kn', 'bn', 'en'] else 'en'
        tts = gTTS(text=bot_response_text, lang=tts_lang)
        tts.save(tts_output_path)

        return {
            "session_id": session_id,
            "detected_language": detected_lang,
            "transcribed_text": cleaned_text,
            "response_text": bot_response_text,
            "audio_response_path": tts_output_path
        }

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.delete("/audience/{member_id}")
@app.delete("/api/v1/audience/{member_id}")
async def delete_audience_member(member_id: str):
    global audience_db
    audience_db = [m for m in audience_db if m["id"] != member_id]
    return {"status": "success", "message": f"Member {member_id} deleted"}