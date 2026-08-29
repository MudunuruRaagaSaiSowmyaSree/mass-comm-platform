from app.rag.retriever import (
    retrieve_domain_documents,
)

from app.rag.generator import (
    generate_answer,
    generate_weather_answer,
    detect_language,
    is_weather_question,
)

from app.rag.quality_checker import (
    check_response_quality,
)

from app.rag.escalation import (
    create_human_escalation,
)


# ============================================================
# RAG PIPELINE
# ============================================================

async def run_rag_pipeline(
    question: str,
    language: str | None = None,
    history: list | None = None,
    k: int = 3,
):
    """
    Main AI/RAG pipeline.

    Flow:

        User question
              |
              v
        Detect language
              |
              v
        Is weather question?
          /             \
        YES              NO
         |                |
         v                v
    Dummy weather       Normal RAG
         |                |
         v                v
       Answer           Answer
         \                /
          \              /
           v            v
             Response
    """

    # ========================================================
    # 1. CLEAN QUESTION
    # ========================================================

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
                "message": "A valid question is required.",
            },
        }

    print()
    print(f"Query: {question}")

    # ========================================================
    # 2. DETECT LANGUAGE
    # ========================================================

    detected_language = detect_language(
        question
    )

    # If the caller explicitly supplied a language,
    # keep it. Otherwise use automatic detection.

    if language:
        final_language = language
    else:
        final_language = detected_language

    print(
        f"Detected language: {detected_language}"
    )

    print(
        f"Response language: {final_language}"
    )

    # ========================================================
    # 3. DETECT WEATHER
    # ========================================================

    weather_question = is_weather_question(
        question
    )

    if weather_question:

        print(
            "Detected domain: weather"
        )

        print(
            "Using dummy weather data..."
        )

        # ----------------------------------------------------
        # Generate weather answer from dummy data
        # ----------------------------------------------------

        try:

            answer = await generate_weather_answer(
                question=question,
                language=final_language,
            )

        except Exception as error:

            print(
                "Weather processing error:",
                error,
            )

            answer = (
                "Sorry, I was unable to retrieve "
                "the dummy weather information."
            )

        # ----------------------------------------------------
        # Weather quality check
        # ----------------------------------------------------

        quality = check_response_quality(
            question=question,
            answer=answer,
            context="Dummy weather data",
            domain="weather",
        )

        # ----------------------------------------------------
        # Weather escalation
        # ----------------------------------------------------

        escalation = create_human_escalation(
            question=question,
            domain="weather",
            quality=quality,
        )

        return {
            "question": question,
            "domain": "weather",
            "answer": answer,
            "sources": [
                "dummy_weather_data"
            ],
            "confidence_score": quality["score"],
            "confidence_status": quality["status"],
            "needs_human": quality["needs_human"],
            "quality_reason": quality["reason"],
            "human_escalation": escalation,
        }

    # ========================================================
    # 4. NORMAL RAG RETRIEVAL
    # ========================================================

    print(
        "Searching knowledge base..."
    )

    retrieval = retrieve_domain_documents(
        query=question,
        k=k,
    )

    domain = retrieval.get(
        "domain",
        "unknown",
    )

    documents = retrieval.get(
        "results",
        [],
    )

    print(
        f"Detected domain: {domain}"
    )

    # ========================================================
    # 5. BUILD CONTEXT
    # ========================================================

    context_parts = []

    sources = []

    for document in documents:

        metadata = getattr(
            document,
            "metadata",
            {},
        )

        source = metadata.get(
            "source_file",
            "unknown",
        )

        if source not in sources:
            sources.append(source)

        page_content = getattr(
            document,
            "page_content",
            "",
        )

        context_parts.append(
            f"""
SOURCE: {source}
DOMAIN: {domain}

{page_content}
"""
        )

    context = "\n\n".join(
        context_parts
    )

    # ========================================================
    # 6. NO CONTEXT
    # ========================================================

    if not context:

        answer = (
            "I could not find enough information "
            "in my knowledge base to answer this accurately."
        )

        quality = check_response_quality(
            question=question,
            answer=answer,
            context="",
            domain=domain,
        )

        escalation = create_human_escalation(
            question=question,
            domain=domain,
            quality=quality,
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

    # ========================================================
    # 7. GENERATE NORMAL RAG ANSWER
    # ========================================================

    answer = generate_answer(
        question=question,
        context=context,
        domain=domain,
        language=final_language,
        history=history,
    )

    # ========================================================
    # 8. QUALITY CHECK
    # ========================================================

    quality = check_response_quality(
        question=question,
        answer=answer,
        context=context,
        domain=domain,
    )

    # ========================================================
    # 9. HUMAN ESCALATION
    # ========================================================

    escalation = create_human_escalation(
        question=question,
        domain=domain,
        quality=quality,
    )

    # ========================================================
    # 10. FINAL RESPONSE
    # ========================================================

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
