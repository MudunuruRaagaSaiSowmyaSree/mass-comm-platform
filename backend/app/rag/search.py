from app.rag.retriever import retrieve_domain_documents


def search_knowledge_base(
    query: str,
    k: int = 4,
):
    response = retrieve_domain_documents(
        query=query,
        k=k,
    )

    formatted_results = []

    for document in response.get("results", []):
        formatted_results.append(
            {
                "content": document.page_content,
                "domain": document.metadata.get(
                    "domain",
                    "unknown",
                ),
                "source": document.metadata.get(
                    "source_file",
                    document.metadata.get(
                        "source",
                        "unknown",
                    ),
                ),
            }
        )

    return {
        "query": response.get("query", query),
        "domain": response.get("domain", "unknown"),
        "results": formatted_results,
    }


def retrieve_context(
    query: str,
    k: int = 3,
):
    """
    Retrieve relevant RAG documents and return:

        (context, sources)

    This function is used by the chat and voice assistants.
    It ALWAYS returns two values so callers can safely do:

        context, sources = retrieve_context(query)
    """

    response = retrieve_domain_documents(
        query=query,
        k=k,
    )

    results = response.get("results", [])

    # No relevant documents found
    if not results:
        return "", []

    context_parts = []
    sources = []

    for document in results:
        # Add document text to context
        if document.page_content:
            context_parts.append(
                document.page_content
            )

        # Get source information
        source = document.metadata.get(
            "source_file",
            document.metadata.get(
                "source",
                "unknown",
            ),
        )

        if source and source != "unknown":
            if source not in sources:
                sources.append(source)

    context = "\n\n".join(context_parts)

    return context, sources