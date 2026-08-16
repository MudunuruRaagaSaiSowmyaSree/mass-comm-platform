# app/rag/router.py

from typing import Literal


Domain = Literal[
    "platform",
    "agriculture",
    "government_schemes",
    "healthcare",
    "banking",
    "mandi",
    "weather",
    "education",
    "employment",
    "women_welfare",
    "emergency_services",
    "unknown",
]


DOMAIN_KEYWORDS = {

    # ============================================================
    # PLATFORM
    # ============================================================

    "platform": [
        "platform",
        "this platform",
        "mass communication",
        "mass communication platform",
        "campaignhub",
        "campaign hub",
        "communication platform",
        "communication system",
        "what is this",
        "what does this platform do",
        "what is this platform used for",
        "how does this platform work",
        "how to use this platform",
        "what can i do here",
        "what services does this platform provide",
        "what features does this platform have",
    ],

    # ============================================================
    # AGRICULTURE
    # ============================================================

    "agriculture": [
        "crop",
        "crops",
        "farmer",
        "farmers",
        "farming",
        "agriculture",
        "agricultural",
        "seed",
        "seeds",
        "fertilizer",
        "fertiliser",
        "pesticide",
        "irrigation",
        "soil",
        "harvest",
        "cultivation",
        "sowing",
        "harvesting",
        "crop disease",
        "crop diseases",
        "pest",
        "pests",
        "farm",
        "farmland",
    ],

    # ============================================================
    # GOVERNMENT SCHEMES
    # ============================================================

    "government_schemes": [
        "government scheme",
        "government schemes",
        "government welfare",
        "scheme",
        "schemes",
        "subsidy",
        "subsidies",
        "benefit",
        "benefits",
        "pm kisan",
        "pension scheme",
        "financial assistance",
        "government assistance",
        "welfare program",
        "welfare programs",
    ],

    # ============================================================
    # HEALTHCARE
    # ============================================================

    "healthcare": [
        "health",
        "healthcare",
        "hospital",
        "doctor",
        "medicine",
        "medical",
        "disease",
        "symptoms",
        "treatment",
        "vaccination",
        "vaccine",
        "pregnancy",
        "maternal",
        "child health",
        "fever",
        "clinic",
        "health center",
        "primary health center",
    ],

    # ============================================================
    # BANKING
    # ============================================================

    "banking": [
        "bank",
        "banking",
        "account",
        "savings account",
        "current account",
        "loan",
        "interest",
        "deposit",
        "withdraw",
        "withdrawal",
        "atm",
        "upi",
        "credit",
        "debit",
        "ifsc",
        "fixed deposit",
        "fd",
        "kisan credit card",
    ],

    # ============================================================
    # MANDI
    # ============================================================

    "mandi": [
        "mandi",
        "mandi price",
        "mandi prices",
        "mandi rate",
        "mandi rates",
        "market price",
        "market prices",
        "market rate",
        "market rates",
        "crop price",
        "crop prices",
        "crop rate",
        "crop rates",
        "commodity price",
        "commodity prices",
        "commodity rate",
        "commodity rates",
        "wholesale price",
        "wholesale prices",
        "agricultural market",

        # Crop-specific price questions
        "price of rice",
        "price of wheat",
        "price of cotton",
        "price of maize",
        "price of tomato",
        "price of potato",
        "price of onion",

        "rice price",
        "wheat price",
        "cotton price",
        "maize price",
        "tomato price",
        "potato price",
        "onion price",

        "rice rate",
        "wheat rate",
        "cotton rate",
        "maize rate",
        "tomato rate",
        "potato rate",
        "onion rate",

        "selling price of rice",
        "selling price of wheat",
        "selling price of cotton",
        "selling price of maize",
        "selling price of tomato",
        "selling price of potato",
        "selling price of onion",

        "price of crops",
        "prices of crops",
        "rate of crops",
        "rates of crops",
    ],

    # ============================================================
    # WEATHER
    # ============================================================

    "weather": [
        "weather",
        "forecast",
        "rain",
        "rainfall",
        "temperature",
        "humidity",
        "storm",
        "cyclone",
        "flood",
        "drought",
        "wind",
        "heatwave",
        "weather warning",
        "weather forecast",
        "rain forecast",
    ],

    # ============================================================
    # EDUCATION
    # ============================================================

    "education": [
        "education",
        "school",
        "schools",
        "college",
        "colleges",
        "student",
        "students",
        "scholarship",
        "scholarships",
        "exam",
        "exams",
        "course",
        "courses",
        "study",
        "university",
        "universities",
        "training",
    ],

    # ============================================================
    # EMPLOYMENT
    # ============================================================

    "employment": [
        "employment",
        "job",
        "jobs",
        "career",
        "vacancy",
        "vacancies",
        "work",
        "worker",
        "workers",
        "recruitment",
        "employment scheme",
        "employment schemes",
        "job opportunity",
        "job opportunities",
        "employment opportunity",
        "employment opportunities",
        "skill development",
    ],

    # ============================================================
    # WOMEN WELFARE
    # ============================================================

    "women_welfare": [
        "women",
        "woman",
        "women welfare",
        "woman welfare",
        "welfare for women",
        "welfare for woman",
        "women scheme",
        "women schemes",
        "scheme for women",
        "schemes for women",
        "benefits for women",
        "benefit for women",
        "government scheme for women",
        "government schemes for women",
        "government welfare for women",
        "women welfare scheme",
        "women welfare schemes",
        "female welfare",
        "girl",
        "girls",
        "female",
        "widow",
        "widows",
    ],

    # ============================================================
    # EMERGENCY SERVICES
    # ============================================================

    "emergency_services": [
        "emergency",
        "ambulance",
        "police",
        "fire",
        "fire service",
        "disaster",
        "disaster management",
        "helpline",
        "urgent",
        "emergency service",
        "emergency services",
    ],
}


def classify_domain(query: str) -> Domain:

    if not query or not query.strip():
        return "unknown"

    query_lower = " ".join(query.lower().strip().split())

    scores = {
        domain: 0
        for domain in DOMAIN_KEYWORDS
    }

    # ============================================================
    # EXACT / PHRASE MATCHING
    # ============================================================

    for domain, keywords in DOMAIN_KEYWORDS.items():

        for keyword in keywords:

            keyword_normalized = " ".join(
                keyword.lower().split()
            )

            if keyword_normalized in query_lower:
                scores[domain] += 1

    # ============================================================
    # SPECIAL PRIORITY RULES
    # ============================================================
    #
    # Price questions about a specific crop are MANDI questions,
    # not general AGRICULTURE questions.
    #
    # Example:
    # "What is the price of rice?"
    # "What is the price of wheat?"
    # "What is the price of cotton?"
    #
    # These should always go to mandi.
    # ============================================================

    price_words = [
        "price",
        "prices",
        "rate",
        "rates",
        "selling price",
        "market price",
        "market prices",
        "mandi price",
        "mandi prices",
    ]

    crop_names = [
        "rice",
        "wheat",
        "cotton",
        "maize",
        "tomato",
        "potato",
        "onion",
    ]

    has_price_word = any(
        word in query_lower
        for word in price_words
    )

    has_crop_name = any(
        crop in query_lower
        for crop in crop_names
    )

    if has_price_word and has_crop_name:
        return "mandi"

    # General mandi questions should also go to mandi.
    if "mandi" in query_lower:
        return "mandi"

    # ============================================================
    # WOMEN WELFARE PRIORITY
    # ============================================================
    #
    # Questions containing both "women" and scheme/benefit/welfare
    # should go to women_welfare rather than government_schemes.
    # ============================================================

    women_words = [
        "women",
        "woman",
        "female",
        "girl",
        "girls",
        "widow",
        "widows",
    ]

    welfare_words = [
        "scheme",
        "schemes",
        "welfare",
        "benefit",
        "benefits",
        "assistance",
        "program",
        "programs",
    ]

    has_women_word = any(
        word in query_lower
        for word in women_words
    )

    has_welfare_word = any(
        word in query_lower
        for word in welfare_words
    )

    if has_women_word and has_welfare_word:
        return "women_welfare"

    # ============================================================
    # FIND BEST DOMAIN
    # ============================================================

    best_domain = max(
        scores,
        key=scores.get,
    )

    best_score = scores[best_domain]

    # No keyword matched
    if best_score == 0:
        return "unknown"

    # ============================================================
    # HANDLE TIES
    # ============================================================

    top_domains = [
        domain
        for domain, score in scores.items()
        if score == best_score
    ]

    if len(top_domains) > 1:
        return "unknown"

    return best_domain