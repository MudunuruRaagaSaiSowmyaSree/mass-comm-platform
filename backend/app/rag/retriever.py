# app/rag/retriever.py

from langchain_chroma import Chroma

from app.rag.embedding import get_embeddings
from app.rag.router import classify_domain


VECTOR_DB_PATH = "app/rag/vector_db"

COLLECTION_NAME = "mass_comm_knowledge"


def get_vector_database():

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

    # ============================================================
    # DOMAIN CLASSIFICATION
    # ============================================================

    domain = classify_domain(query)

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

        results = vectordb.similarity_search(
            query,
            k=k
        )

        return {
            "query": query,
            "domain": domain,
            "results": results,
        }

    # ============================================================
    # DOMAIN FILTER
    # ============================================================

    print(
        f"Searching domain: {domain}"
    )

    results = vectordb.similarity_search(
        query,
        k=k,
        filter={
            "domain": domain
        }
    )

    # ============================================================
    # FALLBACK
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
            k=k
        )

    return {
        "query": query,
        "domain": domain,
        "results": results,
    }


def search_knowledge_base(
    query: str,
    k: int = 3,
):

    response = retrieve_domain_documents(
        query=query,
        k=k
    )

    formatted_results = []

    for document in response["results"]:

        formatted_results.append(
            {
                "content": document.page_content,

                "domain": document.metadata.get(
                    "domain",
                    "unknown"
                ),

                "source": document.metadata.get(
                    "source_file",
                    document.metadata.get(
                        "source",
                        "unknown"
                    )
                ),
            }
        )

    return {
        "query": response["query"],
        "domain": response["domain"],
        "results": formatted_results,
    }


if __name__ == "__main__":

    test_queries = [

        "What crops should farmers grow?",

        "What does the weather forecast say about rainfall?",

        "How can I open a bank account?",

        "What healthcare services are available?",

        "What is the mandi price information?",

        "What government schemes are available?",

        "What educational support is available?",

        "What employment opportunities are available?",

        "What services are available for women?",
    ]

    print()
    print("=" * 70)
    print("DOMAIN ROUTING + DOMAIN-SPECIFIC RETRIEVAL TEST")
    print("=" * 70)

    for query in test_queries:

        print()
        print("-" * 70)

        response = search_knowledge_base(
            query,
            k=3
        )

        print(
            f"DOMAIN: {response['domain']}"
        )

        print(
            f"RESULTS: {len(response['results'])}"
        )

        for index, result in enumerate(
            response["results"],
            start=1
        ):

            print()
            print(
                f"Result {index}"
            )

            print(
                f"Domain: {result['domain']}"
            )

            print(
                f"Source: {result['source']}"
            )

            print(
                result["content"]
            )

    print()
    print("=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)