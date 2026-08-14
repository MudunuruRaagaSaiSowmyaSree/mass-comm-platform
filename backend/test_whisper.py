import sys
import whisper


if len(sys.argv) < 3:
    print("Usage:")
    print("python test_whisper.py audio.wav te")
    print("python test_whisper.py audio.wav hi")
    sys.exit(1)


audio_file = sys.argv[1]
language = sys.argv[2]


print("Loading Whisper model...")
model = whisper.load_model("small")

print("Transcribing...")
print("Language:", language)

result = model.transcribe(
    audio_file,
    language="te",
    task="transcribe",
    fp16=False,
    temperature=0,
    condition_on_previous_text=False
)

print("\n==============================")
print("TRANSCRIPTION RESULT")
print("==============================")

print(result["text"].strip())

print("==============================")