"""
Sentiment analysis service.

Module 4:
    Feedback & Sentiment Analysis Dashboard

Current implementation:
    Lightweight multilingual keyword-based analysis.

Future implementation:
    AI/NLP model such as Gemini, Hugging Face,
    or another dedicated sentiment model.
"""

import re


# ============================================================
# SENTIMENT RESULT
# ============================================================

class SentimentResult:
    def __init__(
        self,
        sentiment: str,
        score: float,
        matched_positive: list[str] | None = None,
        matched_negative: list[str] | None = None,
    ):
        self.sentiment = sentiment
        self.score = score
        self.matched_positive = (
            matched_positive or []
        )
        self.matched_negative = (
            matched_negative or []
        )

    def to_dict(self) -> dict:
        return {
            "sentiment": self.sentiment,
            "score": self.score,
            "matched_positive": (
                self.matched_positive
            ),
            "matched_negative": (
                self.matched_negative
            ),
        }


# ============================================================
# POSITIVE WORDS
# ============================================================

POSITIVE_WORDS = {
    # English
    "good",
    "great",
    "excellent",
    "helpful",
    "useful",
    "amazing",
    "awesome",
    "happy",
    "satisfied",
    "satisfaction",
    "thank",
    "thanks",
    "love",
    "easy",
    "clear",
    "best",
    "perfect",
    "beneficial",
    "supportive",
    "wonderful",

    # Hindi
    "अच्छा",
    "अच्छी",
    "अच्छे",
    "बहुत अच्छा",
    "धन्यवाद",
    "शानदार",
    "उपयोगी",
    "संतुष्ट",

    # Telugu
    "మంచి",
    "బాగుంది",
    "ధన్యవాదాలు",
    "ఉపయోగకరం",
    "అద్భుతం",
}


# ============================================================
# NEGATIVE WORDS
# ============================================================

NEGATIVE_WORDS = {
    # English
    "bad",
    "poor",
    "terrible",
    "worst",
    "useless",
    "wrong",
    "difficult",
    "confusing",
    "angry",
    "sad",
    "unhappy",
    "dissatisfied",
    "problem",
    "problems",
    "issue",
    "issues",
    "failed",
    "failure",
    "hate",
    "slow",
    "delay",
    "delayed",

    # Hindi
    "बुरा",
    "खराब",
    "गलत",
    "समस्या",
    "परेशानी",
    "निराश",
    "असंतुष्ट",

    # Telugu
    "చెడు",
    "బాగాలేదు",
    "తప్పు",
    "సమస్య",
    "ఇబ్బంది",
    "నిరాశ",
}


# ============================================================
# NORMALIZE TEXT
# ============================================================

def normalize_text(
    text: str,
) -> str:

    if not text:
        return ""

    text = text.strip().lower()

    text = re.sub(
        r"\s+",
        " ",
        text,
    )

    return text


# ============================================================
# TOKENIZE
# ============================================================

def tokenize(
    text: str,
) -> list[str]:

    normalized = normalize_text(
        text
    )

    if not normalized:
        return []

    return normalized.split()


# ============================================================
# ANALYZE SENTIMENT
# ============================================================

def analyze_sentiment(
    text: str,
) -> SentimentResult:
    """
    Analyze feedback sentiment.

    Returns:

        positive
        neutral
        negative
    """

    normalized = normalize_text(
        text
    )

    if not normalized:

        return SentimentResult(
            sentiment="neutral",
            score=0.0,
        )

    tokens = tokenize(
        normalized
    )

    positive_matches = []
    negative_matches = []

    # --------------------------------------------------------
    # Single-word matching
    # --------------------------------------------------------

    for token in tokens:

        if token in POSITIVE_WORDS:

            positive_matches.append(
                token
            )

        if token in NEGATIVE_WORDS:

            negative_matches.append(
                token
            )

    # --------------------------------------------------------
    # Phrase matching
    # --------------------------------------------------------

    for phrase in POSITIVE_WORDS:

        if " " in phrase and phrase in normalized:

            positive_matches.append(
                phrase
            )

    for phrase in NEGATIVE_WORDS:

        if " " in phrase and phrase in normalized:

            negative_matches.append(
                phrase
            )

    # --------------------------------------------------------
    # Calculate score
    # --------------------------------------------------------

    positive_count = len(
        positive_matches
    )

    negative_count = len(
        negative_matches
    )

    total_matches = (
        positive_count
        + negative_count
    )

    if total_matches == 0:

        return SentimentResult(
            sentiment="neutral",
            score=0.0,
        )

    score = (
        positive_count
        - negative_count
    ) / total_matches

    # --------------------------------------------------------
    # Classification
    # --------------------------------------------------------

    if score > 0.20:

        sentiment = "positive"

    elif score < -0.20:

        sentiment = "negative"

    else:

        sentiment = "neutral"

    return SentimentResult(
        sentiment=sentiment,
        score=round(
            score,
            4,
        ),
        matched_positive=positive_matches,
        matched_negative=negative_matches,
    )


# ============================================================
# CONVENIENCE FUNCTION
# ============================================================

def get_sentiment(
    text: str,
) -> str:

    result = analyze_sentiment(
        text
    )

    return result.sentiment