from fastapi import FastAPI, UploadFile, File, Form
from gtts import gTTS
import whisper
import tempfile
import os

from app.nlp_utils import IndicProcessor
from app.session_manager import SessionManager

app = FastAPI()

# Load Whisper model[cite: 1]
stt_model = whisper.load_model("base")
nlp_processor = IndicProcessor()
session_mgr = SessionManager()

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
        # 1. Speech-to-Text & Language Identification[cite: 1]
        result = stt_model.transcribe(temp_path)
        raw_text = result["text"]
        detected_lang = result["language"]

        # 2. Text Normalization using IndicNLP[cite: 1]
        cleaned_text = nlp_processor.clean_text(raw_text, detected_lang)

        # 3. Response Generation (Placeholder for Milestone 2 RAG)[cite: 1]
        bot_response_text = f"Received query in {detected_lang}: {cleaned_text}"

        # 4. Save Session History[cite: 1]
        session_mgr.add_interaction(session_id, cleaned_text, bot_response_text, detected_lang)

        # 5. Text-to-Speech Output[cite: 1]
        tts_output_path = f"temp_output_{session_id}.mp3"
        tts = gTTS(text=bot_response_text, lang=detected_lang if detected_lang in ['hi','ta','te','kn','bn','en'] else 'en')
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