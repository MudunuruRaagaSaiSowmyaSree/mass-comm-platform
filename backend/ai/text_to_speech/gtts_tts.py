import os
import uuid
from gtts import gTTS

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "generated_audio")
os.makedirs(OUTPUT_DIR, exist_ok=True)

GTTS_LANG_MAP = {
    "en": "en",
    "hi": "hi",
    "te": "te",
    "bn": "bn"
}

def synthesize(text: str, language: str, session_id: str) -> str:
    """Generate speech audio and return just the filename (not full path)."""
    lang = GTTS_LANG_MAP.get(language, "en")
    filename = f"{session_id}_{uuid.uuid4().hex}.mp3"
    filepath = os.path.join(OUTPUT_DIR, filename)

    tts = gTTS(text=text or "Sorry, I could not understand that.", lang=lang)
    tts.save(filepath)

    return filename