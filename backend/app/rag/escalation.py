from typing import Dict, Any


def create_human_escalation(
    question: str,
    domain: str,
    quality: Dict[str, Any],
) -> Dict[str, Any]:
    """
    Create an escalation response when the RAG answer
    is not reliable enough.
    """

    if not quality.get("needs_human", False):
        return {
            "escalated": False,
            "message": "No human assistance is required.",
        }

    return {
        "escalated": True,
        "message": (
            "This question requires assistance from a "
            "human advisor."
        ),
        "question": question,
        "domain": domain,
        "reason": quality.get(
            "reason",
            "Low confidence answer."
        ),
    }