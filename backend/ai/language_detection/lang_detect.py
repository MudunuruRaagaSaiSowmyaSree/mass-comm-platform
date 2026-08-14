import re


ALLOWED_LANGUAGES = {
    "en",
    "hi",
    "te",
    "bn",
}


def detect_language(text: str) -> str:

    if not text or not text.strip():
        return "en"

    # Telugu Unicode range
    if re.search(r"[\u0C00-\u0C7F]", text):
        return "te"

    # Bengali Unicode range
    if re.search(r"[\u0980-\u09FF]", text):
        return "bn"

    # Devanagari = Hindi
    if re.search(r"[\u0900-\u097F]", text):
        return "hi"

    # Otherwise treat as English
    return "en"