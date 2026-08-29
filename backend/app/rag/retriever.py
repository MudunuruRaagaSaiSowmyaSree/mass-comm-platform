# app/rag/retriever.py

from langchain_chroma import Chroma

from app.rag.embedding import get_embeddings
from app.rag.router import classify_domain


VECTOR_DB_PATH = "app/rag/vector_db"
COLLECTION_NAME = "mass_comm_knowledge"


def get_vector_database():
    """
    Load the Chroma vector database.
    """

    embeddings = get_embeddings()

    vectordb = Chroma(
        persist_directory=VECTOR_DB_PATH,
        collection_name=COLLECTION_NAME,
        embedding_function=embeddings,
    )

    return vectordb


def retrieve_domain_documents(
    query: str,
    k: int = 3,
):
    """
    Classify the query and retrieve relevant documents.

    If a known domain is detected, domain-specific
    filtering is attempted first.

    If the domain is unknown or no domain-specific
    documents are found, general semantic search
    is used as a fallback.

    Always returns:

        {
            "query": str,
            "domain": str,
            "results": list
        }
    """

    # ============================================================
    # VALIDATE QUERY
    # ============================================================

    query = query.strip()

    if not query:
        return {
            "query": query,
            "domain": "unknown",
            "results": [],
        }

    # Make sure k is valid
    k = max(1, int(k))

    # ============================================================
    # DOMAIN CLASSIFICATION
    # ============================================================

    try:
        domain = classify_domain(query)
    except Exception as exc:
        print(
            f"WARNING: Domain classification failed: {exc}"
        )

        domain = "unknown"

    if not domain:
        domain = "unknown"

    domain = str(domain).strip().lower()

    print()
    print(f"Query: {query}")
    print(f"Detected domain: {domain}")

    # ============================================================
    # LOAD VECTOR DATABASE
    # ============================================================

    vectordb = get_vector_database()

    # ============================================================
    # UNKNOWN DOMAIN
    # ============================================================

    if domain == "unknown":

        print(
            "Unknown domain."
        )

        print(
            "Using general semantic search."
        )

        results = vectordb.similarity_search(
            query,
            k=k,
        )

        return {
            "query": query,
            "domain": domain,
            "results": results,
        }

    # ============================================================
    # DOMAIN-SPECIFIC SEARCH
    # ============================================================

    print(
        f"Searching domain: {domain}"
    )

    try:
        results = vectordb.similarity_search(
            query,
            k=k,
            filter={
                "domain": domain,
            },
        )

    except Exception as exc:
        print(
            "WARNING: Domain-specific search failed:"
        )
        print(exc)

        results = []

    # ============================================================
    # FALLBACK TO GENERAL SEARCH
    # ============================================================

    if not results:

        print(
            "WARNING: No domain-specific results found."
        )

        print(
            "Falling back to general semantic search."
        )

        results = vectordb.similarity_search(
            query,
            k=k,
        )

    # ============================================================
    # RETURN RESULTS
    # ============================================================

    return {
        "query": query,
        "domain": domain,
        "results": results,
    }