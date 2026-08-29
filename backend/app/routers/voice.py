import os
import shutil
import tempfile

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    Depends,
)

from ai.speech_to_text.google_stt import (
    transcribe,
    ALLOWED_LANGUAGES,
)

from ai.nlp.nlp_utils import IndicProcessor
from ai.session.session_manager import SessionManager
from ai.text_to_speech.gtts_tts import synthesize

from app.rag.pipeline import run_rag_pipeline
from app.core.deps import get_current_user
from app.models.user import User


router = APIRouter(
    prefix="/api/v1",
    tags=["voice"],
)


# ---------------------------------------------------------
# Initialize services
# ---------------------------------------------------------

indic = IndicProcessor()
sessions = SessionManager()


# ---------------------------------------------------------
# Voice processing endpoint
# ---------------------------------------------------------

@router.post("/voice-process")
async def voice_process(
    session_id: str = Form(...),
    language: str = Form("auto"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):

    # -----------------------------------------------------
    # Save uploaded audio temporarily
    # -----------------------------------------------------

    suffix = (
        os.path.splitext(file.filename or "audio.webm")[1]
        or ".webm"
    )

    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=suffix,
    ) as tmp:

        shutil.copyfileobj(file.file, tmp)

        tmp_path = tmp.name

    # -----------------------------------------------------
    # Speech to Text
    # -----------------------------------------------------

    try:

        lang_hint = (
            language
            if language in ALLOWED_LANGUAGES
            else None
        )

        raw_text, detected_lang = transcribe(
            tmp_path,
            language=lang_hint,
        )

    finally:

        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    # -----------------------------------------------------
    # Process / normalize text
    # -----------------------------------------------------

    processed = indic.process(
        raw_text,
        detected_lang,
    )

    cleaned_text = processed["normalized_text"]

    tokens = processed["tokens"]

    # -----------------------------------------------------
    # If speech could not be understood
    # -----------------------------------------------------

    if not cleaned_text:

        response_text = (
            "Sorry, I couldn't hear that clearly."
        )

        # Save unsuccessful interaction
        # with the authenticated user's ID.
        await sessions.add_interaction(
            session_id=session_id,
            user_text="",
            bot_text=response_text,
            detected_lang=detected_lang,
            user_id=current_user.id,
        )

        history = await sessions.get_history(
            session_id
        )

        audio_filename = synthesize(
            response_text,
            detected_lang,
            session_id,
        )

        return {
            "session_id": session_id,
            "detected_language": detected_lang,
            "raw_transcribed_text": raw_text,
            "cleaned_text": cleaned_text,
            "tokens": tokens,
            "response_text": response_text,
            "audio_response_url": f"/audio/{audio_filename}",
            "conversation_history_length": len(history),
        }

    # -----------------------------------------------------
    # Load previous conversation from database
    # -----------------------------------------------------

    history = await sessions.get_history(
        session_id
    )

    # -----------------------------------------------------
    # RAG retrieval
    # -----------------------------------------------------

    rag_result = run_rag_pipeline(
        question=cleaned_text,
        language=detected_lang,
        history=history,
    )

    response_text = rag_result["answer"]

    # -----------------------------------------------------
    # Save conversation to database
    # -----------------------------------------------------

    await sessions.add_interaction(
        session_id=session_id,
        user_text=cleaned_text,
        bot_text=response_text,
        detected_lang=detected_lang,
        user_id=current_user.id,
    )

    # -----------------------------------------------------
    # Generate voice response
    # -----------------------------------------------------

    audio_filename = synthesize(
        response_text,
        detected_lang,
        session_id,
    )

    # -----------------------------------------------------
    # Get updated history length
    # -----------------------------------------------------

    updated_history = await sessions.get_history(
        session_id
    )

    # -----------------------------------------------------
    # Return response
    # -----------------------------------------------------

    return {
        "session_id": session_id,
        "detected_language": detected_lang,
        "raw_transcribed_text": raw_text,
        "cleaned_text": cleaned_text,
        "tokens": tokens,
        "response_text": response_text,
        "audio_response_url": f"/audio/{audio_filename}",
        "conversation_history_length": len(updated_history),
    }