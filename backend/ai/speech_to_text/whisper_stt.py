import whisper

ALLOWED_LANGUAGES = {"en", "hi", "te", "bn"}

_model = None


def get_model():
    """Lazily load the Whisper model once and reuse it across requests."""
    global _model
    if _model is None:
        _model = whisper.load_model("base")
    return _model


def detect_language(audio_path: str) -> str:
    """Detect spoken language, restricted to English, Hindi, Telugu, Bengali."""
    model = get_model()
    audio = whisper.load_audio(audio_path)
    audio = whisper.pad_or_trim(audio)
    mel = whisper.log_mel_spectrogram(audio, n_mels=model.dims.n_mels).to(model.device)
    _, probs = model.detect_language(mel)

    restricted = {lang: p for lang, p in probs.items() if lang in ALLOWED_LANGUAGES}
    if not restricted:
        return "en"
    return max(restricted, key=restricted.get)


def transcribe(audio_path: str, language: str | None = None) -> tuple[str, str]:
    """Transcribe audio. If language is None/invalid, auto-detect among the 4 allowed."""
    model = get_model()
    if language not in ALLOWED_LANGUAGES:
        language = detect_language(audio_path)

    result = model.transcribe(audio_path, language=language)
    return result["text"].strip(), language