import os
import shutil
import tempfile

from fastapi import APIRouter, UploadFile, File, Form

from ai.speech_to_text.whisper_stt import transcribe, ALLOWED_LANGUAGES
from ai.nlp.nlp_utils import IndicProcessor
from ai.session.session_manager import SessionManager
from ai.text_to_speech.gtts_tts import synthesize

router = APIRouter(prefix="/api/v1", tags=["voice"])

indic = IndicProcessor()
sessions = SessionManager()


@router.post("/voice-process")
async def voice_process(
    session_id: str = Form(...),
    language: str = Form("auto"),
    file: UploadFile = File(...),
):
    suffix = os.path.splitext(file.filename or "audio.webm")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        lang_hint = language if language in ALLOWED_LANGUAGES else None
        raw_text, detected_lang = transcribe(tmp_path, language=lang_hint)
    finally:
        os.remove(tmp_path)

    processed = indic.process(raw_text, detected_lang)
    cleaned_text = processed["normalized_text"]
    tokens = processed["tokens"]

    response_text = (
        f"You said: {cleaned_text}" if cleaned_text else "Sorry, I couldn't hear that clearly."
    )

    sessions.add_interaction(session_id, cleaned_text, response_text, detected_lang)
    history_length = len(sessions.get_session(session_id)["history"])

    audio_filename = synthesize(response_text, detected_lang, session_id)

    return {
        "session_id": session_id,
        "detected_language": detected_lang,
        "raw_transcribed_text": raw_text,
        "cleaned_text": cleaned_text,
        "tokens": tokens,
        "response_text": response_text,
        "audio_response_url": f"/audio/{audio_filename}",
        "conversation_history_length": history_length,
    }