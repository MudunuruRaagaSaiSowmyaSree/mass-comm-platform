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

    for document in response["results"]:
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
        "query": response["query"],
        "domain": response["domain"],
        "results": formatted_results,
    }


def retrieve_context(
    query: str,
    k: int = 3,
) -> str:
    """
    Compatibility function used by voice.py.

    Retrieves relevant RAG documents and converts
    them into plain text context.
    """

    response = retrieve_domain_documents(
        query=query,
        k=k,
    )

    results = response.get("results", [])

    if not results:
        return ""

    context_parts = []

    for document in results:
        context_parts.append(
            document.page_content
        )

    return "\n\n".join(context_parts)