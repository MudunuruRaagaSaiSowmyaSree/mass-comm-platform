from ai.speech_to_text.google_stt import transcribe


audio_file = "telugu.wav"


text, language = transcribe(
    audio_file,
    language="te"
)


print()
print("==============================")
print("GOOGLE GEMINI SPEECH TEST")
print("==============================")
print("Language:", language)
print("Transcript:", text)
print("==============================")