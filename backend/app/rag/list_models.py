import os

from dotenv import load_dotenv
from google import genai


load_dotenv()

api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    raise RuntimeError(
        "GEMINI_API_KEY is missing from .env"
    )


client = genai.Client(
    api_key=api_key
)


print()
print("=" * 70)
print("AVAILABLE GEMINI MODELS")
print("=" * 70)

found = False

for model in client.models.list():

    actions = getattr(
        model,
        "supported_actions",
        None
    )

    if actions and "generateContent" in actions:

        found = True

        print()
        print("Name:", model.name)
        print(
            "Display name:",
            getattr(model, "display_name", "")
        )
        print(
            "Supported actions:",
            actions
        )

if not found:

    print()
    print(
        "No generateContent models were found."
    )

print()
print("=" * 70)