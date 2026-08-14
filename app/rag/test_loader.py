from app.rag.loader import load_documents


def main():

    print("=" * 60)
    print("TESTING KNOWLEDGE BASE LOADER")
    print("=" * 60)

    documents = load_documents()

    print(
        f"\nTotal documents loaded: {len(documents)}"
    )

    for index, document in enumerate(
        documents,
        start=1
    ):

        print(
            f"\n--- Document {index} ---"
        )

        print(
            "Source:",
            document.metadata.get(
                "source",
                "Unknown"
            )
        )

        print(
            "Characters:",
            len(document.page_content)
        )

        print(
            "Preview:"
        )

        print(
            document.page_content[:300]
        )

    print("\n" + "=" * 60)
    print("LOADER TEST COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()