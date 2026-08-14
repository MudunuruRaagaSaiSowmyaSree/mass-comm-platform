import os
import json
from pathlib import Path

from dotenv import load_dotenv
from google import genai


BASE_DIR = Path(__file__).resolve().parents[2]

ENV_FILE = BASE_DIR / ".env"

load_dotenv(ENV_FILE)


API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is not set in the .env file."
    )


client = genai.Client(
    api_key=API_KEY
)


MODEL_NAME = "gemini-3.6-flash"


ALLOWED_LANGUAGES = {
    "en",
    "hi",
    "te",
    "bn"
}


LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "te": "Telugu",
    "bn": "Bengali"
}


def transcribe(
    audio_path: str,
    language: str | None = None
) -> tuple[str, str]:

    language_instruction = ""

    if language in ALLOWED_LANGUAGES:

        language_name = LANGUAGE_NAMES[language]

        language_instruction = f"""
The expected spoken language is {language_name}.

Transcribe the speech in the original {language_name} script.
Do NOT translate it into English.
"""

    prompt = f"""
You are a highly accurate multilingual speech-to-text system.

Transcribe ONLY the spoken words from the audio.

Supported languages:
- English
- Hindi
- Telugu
- Bengali

{language_instruction}

Requirements:

1. Return the exact spoken sentence as accurately as possible.
2. Preserve the original language and script.
3. Do not translate the sentence.
4. Do not explain the audio.
5. Do not add words that were not spoken.
6. Detect the language automatically if no language was specified.

Return ONLY valid JSON in this format:

{{
    "language": "en",
    "transcript": "spoken sentence"
}}
"""

    # Upload audio to Gemini Files API
    audio_file = client.files.upload(
        file=audio_path
    )

    try:

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=[
                prompt,
                audio_file
            ]
        )

        text = response.text.strip()

        # Remove markdown code fences if Gemini adds them
        if text.startswith("```"):
            text = text.replace("```json", "")
            text = text.replace("```", "")
            text = text.strip()

        result = json.loads(text)

        transcript = result.get(
            "transcript",
            ""
        ).strip()

        detected_language = result.get(
            "language",
            "en"
        ).strip().lower()

        if detected_language not in ALLOWED_LANGUAGES:
            detected_language = "en"

        return transcript, detected_language

    finally:

        # Delete temporary Gemini file
        try:
            client.files.delete(
                name=audio_file.name
            )
        except Exception:
            pass