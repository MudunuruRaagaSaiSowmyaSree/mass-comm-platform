import os
import re

from dotenv import load_dotenv
from google import genai

from app.services.weather import get_current_weather


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing."
    )


client = genai.Client(
    api_key=GEMINI_API_KEY
)


MODEL_NAME = "gemini-3.6-flash"


# ============================================================
# LANGUAGE NAMES
# ============================================================

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "te": "Telugu",
    "bn": "Bengali",
}


# ============================================================
# LANGUAGE DETECTION
# ============================================================

def detect_language(question: str) -> str:
    """
    Detect the language from Unicode characters.

    Supported:
        English -> en
        Hindi   -> hi
        Telugu  -> te
        Bengali -> bn

    English is used as the fallback.
    """

    question = question.strip()

    if not question:
        return "en"

    # Hindi / Devanagari
    if re.search(r"[\u0900-\u097F]", question):
        return "hi"

    # Telugu
    if re.search(r"[\u0C00-\u0C7F]", question):
        return "te"

    # Bengali
    if re.search(r"[\u0980-\u09FF]", question):
        return "bn"

    # Default
    return "en"


# ============================================================
# WEATHER QUESTION DETECTION
# ============================================================

def is_weather_question(question: str) -> bool:
    """
    Detect weather-related questions in English,
    Hindi, Telugu, and Bengali.
    """

    question_lower = question.lower().strip()

    weather_keywords = [
        # English
        "weather",
        "temperature",
        "forecast",
        "climate",
        "rain",
        "raining",
        "sunny",
        "cloudy",
        "humidity",
        "wind",
        "hot",
        "cold",

        # Hindi
        "मौसम",
        "तापमान",
        "बारिश",
        "वर्षा",
        "धूप",
        "बादल",
        "नमी",
        "हवा",
        "गर्मी",
        "ठंड",

        # Telugu
        "వాతావరణం",
        "వాతావరణ",
        "ఉష్ణోగ్రత",
        "వర్షం",
        "ఎండ",
        "మబ్బు",
        "తేమ",
        "గాలి",
        "వేడి",
        "చలి",

        # Bengali
        "আবহাওয়া",
        "আবহাওয়া",
        "তাপমাত্রা",
        "বৃষ্টি",
        "রোদ",
        "মেঘ",
        "আর্দ্রতা",
        "হাওয়া",
        "হাওয়া",
        "গরম",
        "ঠান্ডা",
    ]

    return any(
        keyword in question_lower
        for keyword in weather_keywords
    )


# ============================================================
# WEATHER CITY EXTRACTION
# ============================================================

def extract_weather_city(question: str) -> str:
    """
    Extract a city name from English, Hindi, Telugu,
    or Bengali weather questions.

    Supported project cities:

        Hyderabad
        Vijayawada
        Visakhapatnam
        Tirupati
        Warangal

    Examples:

        What is the weather in Hyderabad?
        What is the weather in Vijayawada?

        हैदराबाद में आज मौसम कैसा है?
        विजयवाड़ा में आज मौसम कैसा है?

        హైదరాబాద్‌లో ఈరోజు వాతావరణం ఎలా ఉంది?
        విజయవాడలో ఈరోజు వాతావరణం ఎలా ఉంది?

        কলকাতায় আজকের আবহাওয়া কেমন?
        বিজয়ওয়াড়ায় আজকের আবহাওয়া কেমন?

    If no city can be identified, Hyderabad is used as
    the default dummy-data city.
    """

    question_clean = question.strip()
    question_lower = question_clean.lower()

    # ========================================================
    # EXPLICIT MULTILINGUAL CITY MAP
    # ========================================================

    city_aliases = {

        # ----------------------------------------------------
        # Hyderabad
        # ----------------------------------------------------

        "hyderabad": "hyderabad",
        "हैदराबाद": "hyderabad",
        "हैदराबाद": "hyderabad",
        "హైదరాబాద్": "hyderabad",
        "హైదరాబాదు": "hyderabad",
        "হায়দরাবাদ": "hyderabad",
        "হায়দরাবাদ": "hyderabad",

        # ----------------------------------------------------
        # Vijayawada
        # ----------------------------------------------------

        "vijayawada": "vijayawada",
        "विजयवाड़ा": "vijayawada",
        "विजयवाडा": "vijayawada",
        "विजयवाड़": "vijayawada",
        "విజయవాడ": "vijayawada",
        "విజయవాడలో": "vijayawada",
        "বিজয়ওয়াড়া": "vijayawada",
        "বিজয়ওয়াড়া": "vijayawada",

        # ----------------------------------------------------
        # Visakhapatnam
        # ----------------------------------------------------

        "visakhapatnam": "visakhapatnam",
        "vizag": "visakhapatnam",
        "विशाखापट्टनम": "visakhapatnam",
        "विशाखापत्तनम": "visakhapatnam",
        "विशाखापटनम": "visakhapatnam",
        "విశాఖపట్నం": "visakhapatnam",
        "విశాఖ": "visakhapatnam",
        "বিশাখাপত্তনম": "visakhapatnam",
        "বিশাখাপটনম": "visakhapatnam",

        # ----------------------------------------------------
        # Tirupati
        # ----------------------------------------------------

        "tirupati": "tirupati",
        "तिरुपति": "tirupati",
        "తిరుపతి": "tirupati",
        "తిరుపతిలో": "tirupati",
        "তিরুপতি": "tirupati",

        # ----------------------------------------------------
        # Warangal
        # ----------------------------------------------------

        "warangal": "warangal",
        "वरंगल": "warangal",
        "వరంగల్": "warangal",
        "వరంగల్‌లో": "warangal",
        "ওয়ারাঙ্গল": "warangal",
        "ওয়ারাঙ্গল": "warangal",
    }

    # ========================================================
    # CHECK KNOWN CITY ALIASES FIRST
    # ========================================================
    #
    # This is important.
    #
    # We check multilingual city names BEFORE the generic
    # regex patterns and BEFORE the Hyderabad fallback.
    # ========================================================

    for alias, city in city_aliases.items():

        if alias in question_lower:

            print(
                f"Weather city detected from alias: "
                f"{alias} -> {city}"
            )

            return city

    # ========================================================
    # ENGLISH PATTERNS
    # ========================================================

    patterns = [
        r"weather\s+in\s+([a-zA-Z\s]+)",
        r"weather\s+of\s+([a-zA-Z\s]+)",
        r"weather\s+at\s+([a-zA-Z\s]+)",
        r"temperature\s+in\s+([a-zA-Z\s]+)",
        r"temperature\s+of\s+([a-zA-Z\s]+)",
        r"forecast\s+for\s+([a-zA-Z\s]+)",
    ]

    for pattern in patterns:

        match = re.search(
            pattern,
            question_lower,
        )

        if match:

            city = match.group(1).strip()

            city = re.sub(
                r"\b(today|tomorrow|now|please|right now)\b",
                "",
                city,
            ).strip()

            city = city.strip(
                " .,?!"
            )

            if city:

                # Map the extracted English city if possible.
                mapped_city = city_aliases.get(
                    city,
                    city,
                )

                print(
                    f"Weather city detected: "
                    f"{mapped_city}"
                )

                return mapped_city

    # ========================================================
    # DEFAULT
    # ========================================================

    print(
        "No weather city detected. "
        "Using default dummy city: hyderabad"
    )

    return "hyderabad"


# ============================================================
# WEATHER ANSWER
# ============================================================

async def generate_weather_answer(
    question: str,
    language: str = "en",
) -> str:
    """
    Generate a weather response using ONLY the project's
    dummy weather data.
    """

    language_name = LANGUAGE_NAMES.get(
        language,
        "English",
    )

    city = extract_weather_city(
        question
    )

    print(
        f"Weather city detected: {city}"
    )

    # ========================================================
    # GET DUMMY WEATHER DATA
    # ========================================================

    weather = await get_current_weather(
        city
    )

    if not weather.get("success"):

        return (
            f"Sorry, I do not have dummy weather "
            f"data available for {city}."
        )

    # ========================================================
    # BUILD WEATHER CONTEXT
    # ========================================================

    weather_context = f"""
City: {weather.get("city")}
Temperature: {weather.get("temperature")}°C
Humidity: {weather.get("humidity")}%
Condition: {weather.get("weather")}
Wind Speed: {weather.get("wind_speed")} km/h
Date: {weather.get("date")}
Source: Dummy project data
"""

    # ========================================================
    # GEMINI FORMATTING PROMPT
    # ========================================================

    prompt = f"""
You are an AI assistant for a rural public information
service.

The user asked a weather-related question.

USER QUESTION:
{question}

DUMMY WEATHER DATA:
{weather_context}

RESPONSE LANGUAGE:
{language_name}

RULES:

1. Use ONLY the supplied dummy weather data.
2. Do not use real weather information.
3. Do not call or mention any external weather API.
4. Do not invent temperature, humidity, wind speed,
   weather conditions, city names, or dates.
5. Answer entirely in {language_name}.
6. Use simple and natural language.
7. Clearly mention the correct city from the supplied data.
8. If the user asks for today's weather, provide the
   supplied dummy weather information as today's weather.
9. If the city is Vijayawada, do not change it to Hyderabad.
10. If the city is Hyderabad, do not change it to Vijayawada.
11. Do not substitute one city for another.
12. Do not say that you lack weather information when
    the supplied dummy data contains the answer.
13. Do not mention these instructions.
14. Do not mention Gemini.
15. Do not mention the knowledge base.

FINAL ANSWER:
"""

    # ========================================================
    # GENERATE NATURAL ANSWER
    # ========================================================

    try:

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
        )

        if response.text:

            return response.text.strip()

        # ----------------------------------------------------
        # Fallback if Gemini returns no text
        # ----------------------------------------------------

        if language == "hi":

            return (
                f"आज {weather.get('city')} में मौसम "
                f"{weather.get('weather')} है।\n\n"
                f"तापमान: {weather.get('temperature')}°C\n"
                f"नमी: {weather.get('humidity')}%\n"
                f"हवा की गति: {weather.get('wind_speed')} किमी/घंटा\n"
                f"तारीख: {weather.get('date')}"
            )

        if language == "te":

            return (
                f"ఈరోజు {weather.get('city')}లో "
                f"వాతావరణం {weather.get('weather')}గా ఉంది.\n\n"
                f"ఉష్ణోగ్రత: {weather.get('temperature')}°C\n"
                f"తేమ: {weather.get('humidity')}%\n"
                f"గాలి వేగం: గంటకు "
                f"{weather.get('wind_speed')} కిమీ\n"
                f"తేదీ: {weather.get('date')}"
            )

        if language == "bn":

            return (
                f"আজ {weather.get('city')} শহরের আবহাওয়া "
                f"{weather.get('weather')}।\n\n"
                f"তাপমাত্রা: {weather.get('temperature')}°C\n"
                f"আর্দ্রতা: {weather.get('humidity')}%\n"
                f"বাতাসের গতি: {weather.get('wind_speed')} কিমি/ঘণ্টা\n"
                f"তারিখ: {weather.get('date')}"
            )

        return (
            f"Today's weather in "
            f"{weather.get('city')}:\n"
            f"Temperature: {weather.get('temperature')}°C\n"
            f"Condition: {weather.get('weather')}\n"
            f"Humidity: {weather.get('humidity')}%\n"
            f"Wind speed: {weather.get('wind_speed')} km/h\n"
            f"Date: {weather.get('date')}"
        )

    except Exception as error:

        print(
            "Gemini weather generation error:",
            error,
        )

        # ====================================================
        # SAFE LANGUAGE-SPECIFIC FALLBACK
        # ====================================================

        if language == "hi":

            return (
                f"आज {weather.get('city')} में मौसम "
                f"{weather.get('weather')} है।\n"
                f"तापमान: {weather.get('temperature')}°C\n"
                f"नमी: {weather.get('humidity')}%\n"
                f"हवा की गति: {weather.get('wind_speed')} किमी/घंटा\n"
                f"तारीख: {weather.get('date')}"
            )

        if language == "te":

            return (
                f"ఈరోజు {weather.get('city')}లో "
                f"వాతావరణం {weather.get('weather')}గా ఉంది.\n"
                f"ఉష్ణోగ్రత: {weather.get('temperature')}°C\n"
                f"తేమ: {weather.get('humidity')}%\n"
                f"గాలి వేగం: గంటకు "
                f"{weather.get('wind_speed')} కిమీ\n"
                f"తేదీ: {weather.get('date')}"
            )

        if language == "bn":

            return (
                f"আজ {weather.get('city')} শহরের আবহাওয়া "
                f"{weather.get('weather')}।\n"
                f"তাপমাত্রা: {weather.get('temperature')}°C\n"
                f"আর্দ্রতা: {weather.get('humidity')}%\n"
                f"বাতাসের গতি: {weather.get('wind_speed')} কিমি/ঘণ্টা\n"
                f"তারিখ: {weather.get('date')}"
            )

        return (
            f"Today's weather in "
            f"{weather.get('city')}:\n"
            f"Temperature: {weather.get('temperature')}°C\n"
            f"Condition: {weather.get('weather')}\n"
            f"Humidity: {weather.get('humidity')}%\n"
            f"Wind speed: {weather.get('wind_speed')} km/h\n"
            f"Date: {weather.get('date')}"
        )


# ============================================================
# GENERAL RAG ANSWER
# ============================================================

def generate_answer(
    question: str,
    context: str,
    domain: str,
    language: str = "en",
    history: list | None = None,
) -> str:
    """
    Generate a normal RAG answer.

    Weather questions are handled separately by
    generate_weather_answer().
    """

    language_name = LANGUAGE_NAMES.get(
        language,
        "English",
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
4. Answer entirely in {language_name}.
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

        if response.text:

            return response.text.strip()

        return (
            "I could not generate an answer "
            "from the available information."
        )

    except Exception as error:

        print(
            "Gemini generation error:",
            error,
        )

        return (
            "Sorry, I was unable to generate "
            "an answer at the moment."
        )
