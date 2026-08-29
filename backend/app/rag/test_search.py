from app.rag.search import search_knowledge_base


def main():

    print("=" * 60)
    print("TESTING SEMANTIC SEARCH")
    print("=" * 60)

    queries = [
        "How can farmers protect crops during heavy rain?",
        "What government schemes are available?",
        "What are basic banking services?",
        "What are today's mandi prices?",
        "What should I do during an emergency?",
        "How can I get healthcare information?"
    ]

    for query in queries:

        print("\n" + "-" * 60)

        print(
            f"QUERY: {query}"
        )

        results = search_knowledge_base(
            query=query,
            k=3
        )

        if not results:

            print(
                "No results found."
            )

            continue

        for index, document in enumerate(
            results,
            start=1
        ):

            source = document.metadata.get(
                "source",
                "Unknown"
            )

            print(
                f"\nResult {index}"
            )

            print(
                f"Source: {source}"
            )

            print(
                document.page_content[:500]
            )

    print("\n" + "=" * 60)
    print("SEMANTIC SEARCH TEST COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()