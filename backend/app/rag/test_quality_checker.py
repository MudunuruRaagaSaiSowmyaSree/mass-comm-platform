from app.rag.quality_checker import check_response_quality


def main():

    print("=" * 70)
    print("RESPONSE QUALITY CHECKER TEST")
    print("=" * 70)

    question = "What crops should farmers grow?"

    answer = """
    Rice is one of the major crops grown in India.
    The best season is Kharif.
    Suitable temperature is 20°C to 35°C.
    Recommended soil is clay loam soil.
    """

    sources = [
        """
        Rice is one of the major crops grown in India.

        Best Season:
        Kharif

        Suitable Temperature:
        20°C to 35°C

        Recommended Soil:
        Clay Loam Soil
        """
    ]

    result = check_response_quality(
        question=question,
        answer=answer,
        sources=sources,
    )

    print()
    print("Question:")
    print(question)

    print()
    print("Quality Result:")
    print(result)

    print()
    print("=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()