from typing import Dict, Any


def check_response_quality(
    question: str,
    answer: str,
    context: str,
    domain: str,
) -> Dict[str, Any]:
    """
    Check whether the generated answer has enough supporting context.

    Returns:
        score: confidence score from 0 to 100
        status: high / medium / low
        needs_human: whether human assistance is recommended
        reason: explanation
    """

    question = question.strip()
    answer = answer.strip()
    context = context.strip()

    # ---------------------------------------------------------
    # BASIC VALIDATION
    # ---------------------------------------------------------

    if not answer:
        return {
            "score": 0,
            "status": "low",
            "needs_human": True,
            "reason": "No answer was generated.",
        }

    if not context:
        return {
            "score": 10,
            "status": "low",
            "needs_human": True,
            "reason": "No supporting knowledge-base context was found.",
        }

    # ---------------------------------------------------------
    # SIMPLE CONTEXT-ANSWER OVERLAP CHECK
    # ---------------------------------------------------------

    context_words = set(
        word.lower().strip(".,!?;:()[]{}")
        for word in context.split()
        if len(word) > 3
    )

    answer_words = set(
        word.lower().strip(".,!?;:()[]{}")
        for word in answer.split()
        if len(word) > 3
    )

    if not answer_words:
        return {
            "score": 0,
            "status": "low",
            "needs_human": True,
            "reason": "Generated answer contains no usable information.",
        }

    overlap = context_words.intersection(answer_words)

    overlap_ratio = len(overlap) / len(answer_words)

    # ---------------------------------------------------------
    # SCORE
    # ---------------------------------------------------------

    score = int(min(overlap_ratio * 100, 100))

    # Give a reasonable minimum score when context clearly exists
    if score >= 60:
        status = "high"
        needs_human = False
        reason = "Answer has strong overlap with the retrieved knowledge."

    elif score >= 30:
        status = "medium"
        needs_human = False
        reason = "Answer has partial support from the retrieved knowledge."

    else:
        status = "low"
        needs_human = True
        reason = "Answer has weak support from the retrieved knowledge."

    return {
        "score": score,
        "status": status,
        "needs_human": needs_human,
        "reason": reason,
    }