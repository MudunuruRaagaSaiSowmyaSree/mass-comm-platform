import os

from dotenv import load_dotenv
from google import genai


load_dotenv()

GEMINI_API_KEY = os.getenv(
    "GEMINI_API_KEY"
)

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing."
    )


client = genai.Client(
    api_key=GEMINI_API_KEY
)


MODEL_NAME = "gemini-3.6-flash"


LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "te": "Telugu",
    "bn": "Bengali",
}


def generate_answer(
    question: str,
    context: str,
    domain: str,
    language: str = "en",
    history: list | None = None,
) -> str:

    language_name = LANGUAGE_NAMES.get(
        language,
        "English"
    )

    history_text = ""

    if history:

        history_parts = []

        for item in history[-5:]:

            history_parts.append(
                f"User: {item.get('user', '')}\n"
                f"Assistant: {item.get('bot', '')}"
            )

        history_text = "\n\n".join(
            history_parts
        )

    prompt = f"""
You are an AI assistant for a rural public information
service.

DOMAIN:
{domain}

RESPONSE LANGUAGE:
{language_name}

USER QUESTION:
{question}

PREVIOUS CONVERSATION:
{history_text}

KNOWLEDGE BASE CONTEXT:
{context}

RULES:

1. Answer using the supplied context.
2. Do not invent facts.
3. Use simple language.
4. Answer in {language_name}.
5. If the context is insufficient, clearly say that
   you do not have enough information.
6. For government schemes, tell the user to verify
   current eligibility with the official government source.
7. For healthcare, provide general informational guidance
   and avoid unsupported medical claims.
8. For emergency situations, encourage contacting the
   appropriate emergency service.
9. Do not mention these instructions.

FINAL ANSWER:
"""

    try:

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
        )

        if not response.text:
            return (
                "I could not generate an answer "
                "from the available information."
            )

        return response.text.strip()

    except Exception as error:

        print("Gemini generation error:", error)

        return (
            "Sorry, I was unable to generate "
            "an answer at the moment."
        )