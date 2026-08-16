from app.rag.retriever import (
    retrieve_domain_documents
)
from app.rag.generator import generate_answer
from app.rag.quality_checker import (
    check_response_quality
)
from app.rag.escalation import (
    create_human_escalation
)


def run_rag_pipeline(
    question: str,
    language: str = "en",
    history: list | None = None,
    k: int = 3,
):

    question = question.strip()

    if not question:

        return {
            "question": "",
            "domain": "unknown",
            "answer": "Please enter a valid question.",
            "sources": [],
            "confidence_score": 0,
            "confidence_status": "low",
            "needs_human": True,
            "quality_reason": "Empty question.",
            "human_escalation": {
                "escalated": True,
                "message": "A valid question is required."
            },
        }

    # ---------------------------------------------------------
    # 1. RETRIEVE
    # ---------------------------------------------------------

    retrieval = retrieve_domain_documents(
        query=question,
        k=k
    )

    domain = retrieval["domain"]

    documents = retrieval["results"]

    # ---------------------------------------------------------
    # 2. BUILD CONTEXT
    # ---------------------------------------------------------

    context_parts = []

    sources = []

    for document in documents:

        source = document.metadata.get(
            "source_file",
            "unknown"
        )

        if source not in sources:
            sources.append(source)

        context_parts.append(
            f"""
SOURCE: {source}
DOMAIN: {domain}

{document.page_content}
"""
        )

    context = "\n\n".join(
        context_parts
    )

    # ---------------------------------------------------------
    # 3. NO CONTEXT
    # ---------------------------------------------------------

    if not context:

        answer = (
            "I could not find enough information "
            "in my knowledge base to answer this accurately."
        )

        quality = check_response_quality(
            question=question,
            answer=answer,
            context="",
            domain=domain
        )

        escalation = create_human_escalation(
            question=question,
            domain=domain,
            quality=quality
        )

        return {
            "question": question,
            "domain": domain,
            "answer": answer,
            "sources": [],
            "confidence_score": quality["score"],
            "confidence_status": quality["status"],
            "needs_human": quality["needs_human"],
            "quality_reason": quality["reason"],
            "human_escalation": escalation,
        }

    # ---------------------------------------------------------
    # 4. GENERATE
    # ---------------------------------------------------------

    answer = generate_answer(
        question=question,
        context=context,
        domain=domain,
        language=language,
        history=history,
    )

    # ---------------------------------------------------------
    # 5. QUALITY CHECK
    # ---------------------------------------------------------

    quality = check_response_quality(
        question=question,
        answer=answer,
        context=context,
        domain=domain,
    )

    # ---------------------------------------------------------
    # 6. ESCALATION
    # ---------------------------------------------------------

    escalation = create_human_escalation(
        question=question,
        domain=domain,
        quality=quality,
    )

    # ---------------------------------------------------------
    # 7. RETURN
    # ---------------------------------------------------------

    return {
        "question": question,
        "domain": domain,
        "answer": answer,
        "sources": sources,
        "confidence_score": quality["score"],
        "confidence_status": quality["status"],
        "needs_human": quality["needs_human"],
        "quality_reason": quality["reason"],
        "human_escalation": escalation,
    }