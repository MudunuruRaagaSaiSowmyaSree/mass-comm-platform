from app.rag.generator import generate_answer


def main():

    print("=" * 70)
    print("GEMINI CONNECTION TEST")
    print("=" * 70)

    question = "What crops should farmers grow?"

    context = """
Rice is one of the major crops grown in India.

Best Season:
Kharif

Suitable Temperature:
20°C to 35°C

Water Requirement:
High

Fertilizers:
Nitrogen
Phosphorus
Potassium

Recommended Soil:
Clay Loam Soil
"""

    answer = generate_answer(
        question=question,
        context=context,
        domain="agriculture",
    )

    print()
    print("QUESTION:")
    print(question)

    print()
    print("ANSWER:")
    print(answer)

    print()
    print("=" * 70)
    print("GEMINI TEST COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()