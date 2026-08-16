import json
import os

from google import genai

from app.database import settings


# ============================================================
# GEMINI CLIENT
# ============================================================

def get_gemini_client():
    api_key = (
        settings.GEMINI_API_KEY
        or os.getenv("GEMINI_API_KEY")
    )

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured"
        )

    return genai.Client(api_key=api_key)


# ============================================================
# CHAT / VOICE ASSISTANT
# ============================================================

def generate_answer(
    question: str,
    context: str = "",
    language: str = "en",
    history: list | None = None,
) -> str:

    client = get_gemini_client()

    history_text = ""

    if history:
        history_text = "\n".join(
            [
                f"{item.get('role', 'user')}: "
                f"{item.get('content', '')}"
                for item in history
            ]
        )

    prompt = f"""
You are an AI communication assistant.

Answer the user's question using the available context.

Language:
{language}

Context:
{context}

Conversation history:
{history_text}

User question:
{question}

Rules:
- Give a clear and helpful answer.
- Use the requested language.
- Do not invent information.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
    )

    return response.text.strip()


# ============================================================
# AI CONTENT GENERATION
# ============================================================

def generate_content(
    campaign_type: str,
    brief: str,
    language: str = "en",
    audience: str = "general_public",
) -> str:

    client = get_gemini_client()

    # --------------------------------------------------------
    # CAMPAIGN TYPE
    # --------------------------------------------------------

    if campaign_type.lower() == "emergency":

        campaign_instruction = """
This is an emergency communication.

Be:
- direct
- clear
- urgent
- actionable

Clearly communicate important actions.
Avoid unnecessary wording.
"""

    elif campaign_type.lower() == "announcement":

        campaign_instruction = """
This is an official announcement.

Use:
- a formal tone
- clear language
- informative wording

Clearly communicate the important information.
"""

    elif campaign_type.lower() == "awareness":

        campaign_instruction = """
This is an awareness campaign.

Use:
- educational language
- friendly wording
- encouraging communication

Make the message easy to understand.
"""

    elif campaign_type.lower() == "educational":

        campaign_instruction = """
This is an educational communication.

Use:
- clear explanations
- informative language
- simple instructions
"""

    else:

        campaign_instruction = """
Use a professional and appropriate
communication tone.
"""

    # --------------------------------------------------------
    # AUDIENCE
    # --------------------------------------------------------

    if audience.lower() == "general_public":

        audience_instruction = """
The audience is the general public.

Use simple language that people from
different backgrounds can understand.

Avoid unnecessary technical terminology.
"""

    elif audience.lower() == "professionals":

        audience_instruction = """
The audience consists of professionals.

You may use moderately technical and
professional terminology.

Keep the communication precise.
"""

    elif audience.lower() == "students":

        audience_instruction = """
The audience consists of students.

Use clear, approachable and engaging language.
"""

    else:

        audience_instruction = """
Use language appropriate for the specified audience.
"""

    # --------------------------------------------------------
    # PROMPT
    # --------------------------------------------------------

    prompt = f"""
You are an AI communication assistant.

Create a public communication message.

Campaign type:
{campaign_type}

Campaign brief:
{brief}

Target audience:
{audience}

Language:
{language}

Campaign instructions:
{campaign_instruction}

Audience instructions:
{audience_instruction}

Requirements:
- Be accurate.
- Do not invent facts.
- Keep the message concise.
- Use appropriate language for the audience.
- Include important information from the campaign brief.
- Do not add explanations outside the message.
- Return only the final communication message.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
    )

    return response.text.strip()


# ============================================================
# TONE CHECK
# ============================================================

def check_tone(
    message: str,
    audience: str = "general_public",
) -> dict:

    client = get_gemini_client()

    prompt = f"""
You are a communication quality reviewer.

Analyze the following message.

Message:
{message}

Target audience:
{audience}

Check whether the tone is appropriate.

Identify:

1. Whether the tone is appropriate.
2. The current tone.
3. Any tone problems.
4. How the message could be improved.

Return ONLY valid JSON in this exact structure:

{{
    "appropriate": true,
    "tone": "professional",
    "issues": [],
    "suggestion": "The tone is appropriate."
}}

If there are problems, provide them
in the issues array.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
    )

    text = response.text.strip()

    # Remove Markdown code fences
    if text.startswith("```"):
        text = text.replace(
            "```json",
            ""
        )

        text = text.replace(
            "```",
            ""
        )

        text = text.strip()

    return json.loads(text)


# ============================================================
# TRANSLATION
# ============================================================

def translate_content(
    message: str,
    source_language: str,
    target_language: str,
) -> str:

    client = get_gemini_client()

    # --------------------------------------------------------
    # LANGUAGE MAP
    # --------------------------------------------------------

    language_names = {
        "en": "English",
        "te": "Telugu",
        "hi": "Hindi",
        "bn": "Bengali",
    }

    source_language = (
        source_language
        .lower()
        .strip()
    )

    target_language = (
        target_language
        .lower()
        .strip()
    )

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if source_language not in language_names:

        raise ValueError(
            f"Unsupported source language: "
            f"{source_language}. "
            f"Supported languages are: "
            f"{', '.join(language_names.keys())}"
        )

    if target_language not in language_names:

        raise ValueError(
            f"Unsupported target language: "
            f"{target_language}. "
            f"Supported languages are: "
            f"{', '.join(language_names.keys())}"
        )

    # --------------------------------------------------------
    # SAME LANGUAGE
    # --------------------------------------------------------

    if source_language == target_language:
        return message

    source_name = language_names[
        source_language
    ]

    target_name = language_names[
        target_language
    ]

    # --------------------------------------------------------
    # TRANSLATION PROMPT
    # --------------------------------------------------------

    prompt = f"""
You are a highly accurate professional
multilingual translator.

Translate the user's message from
{source_name} to {target_name}.

IMPORTANT:

The user's message is the ONLY content
that should be translated.

Do NOT use information from previous
examples, previous conversations,
or unrelated topics.

Original message:
<<<
{message}
>>>

Translation requirements:

1. Preserve the exact meaning of the
   original message.

2. Do not add information.

3. Do not remove information.

4. Do not change names, numbers,
   dates, places, or important facts.

5. Preserve the original tone.

6. Use natural, grammatically correct
   {target_name}.

7. Translate short messages naturally.
   For example, if the user enters
   "Hi", translate "Hi" rather than
   inventing a longer message.

8. If the original message appears to be
   in a different language than the selected
   source language, identify the actual
   language of the message and translate
   its meaning correctly into {target_name}.

9. Do not explain the translation.

10. Return ONLY the translated text.

Return the translation now.
"""

    response = client.models.generate_content(
        model="gemini-3.5-flash-lite",
        contents=prompt,
    )

    translated_text = (
        response.text.strip()
    )

    # --------------------------------------------------------
    # CLEAN GEMINI MARKDOWN
    # --------------------------------------------------------

    if translated_text.startswith("```"):

        translated_text = (
            translated_text
            .replace("```text", "")
            .replace("```", "")
            .strip()
        )

    return translated_text