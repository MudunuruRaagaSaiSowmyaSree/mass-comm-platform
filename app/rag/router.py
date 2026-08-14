# app/rag/router.py

from typing import Literal


Domain = Literal[
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
    "agriculture": [
        "crop",
        "crops",
        "farmer",
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
        "rice",
        "wheat",
        "cotton",
        "maize",
        "vegetable",
    ],

    "government_schemes": [
        "government scheme",
        "government schemes",
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
    ],

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
    ],

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
        "atm",
        "upi",
        "credit",
        "debit",
        "ifsc",
    ],

    "mandi": [
        "mandi",
        "market price",
        "market prices",
        "crop price",
        "crop prices",
        "commodity price",
        "commodity prices",
        "wholesale price",
        "agricultural market",
        "market rate",
    ],

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
    ],

    "education": [
        "education",
        "school",
        "college",
        "student",
        "students",
        "scholarship",
        "exam",
        "course",
        "study",
        "university",
        "training",
    ],

    "employment": [
        "employment",
        "job",
        "jobs",
        "career",
        "vacancy",
        "vacancies",
        "work",
        "worker",
        "recruitment",
        "employment scheme",
    ],

    "women_welfare": [
        "women",
        "woman",
        "women welfare",
        "girl",
        "girls",
        "female",
        "widow",
        "widows",
        "women scheme",
        "women schemes",
    ],

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
    ],
}


def classify_domain(query: str) -> Domain:

    if not query or not query.strip():
        return "unknown"

    query_lower = query.lower().strip()

    scores = {
        domain: 0
        for domain in DOMAIN_KEYWORDS
    }

    for domain, keywords in DOMAIN_KEYWORDS.items():

        for keyword in keywords:

            if keyword in query_lower:
                scores[domain] += 1

    best_domain = max(
        scores,
        key=scores.get
    )

    best_score = scores[best_domain]

    if best_score == 0:
        return "unknown"

    # ---------------------------------------------------------
    # Detect ties
    # ---------------------------------------------------------

    top_domains = [
        domain
        for domain, score in scores.items()
        if score == best_score
    ]

    # If there is a tie, use semantic retrieval
    # instead of pretending we know the domain.
    if len(top_domains) > 1:
        return "unknown"

    return best_domain