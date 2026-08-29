from app.services.mandi import get_mandi_prices


def main():

    print()
    print("=" * 70)
    print("MANDI API TEST")
    print("=" * 70)

    print()
    print("Fetching mandi prices...")

    try:

        data = get_mandi_prices(
            limit=5
        )

        print()
        print("API CONNECTION SUCCESSFUL")

        print()
        print("Total records:")

        print(
            data.get(
                "total",
                "Unknown"
            )
        )

        print()
        print("Records:")

        records = data.get(
            "records",
            []
        )

        if not records:

            print(
                "No records returned."
            )

            return

        for index, record in enumerate(
            records,
            start=1
        ):

            print()
            print(
                f"--- Record {index} ---"
            )

            print(
                "State:",
                record.get("state")
            )

            print(
                "District:",
                record.get("district")
            )

            print(
                "Market:",
                record.get("market")
            )

            print(
                "Commodity:",
                record.get("commodity")
            )

            print(
                "Variety:",
                record.get("variety")
            )

            print(
                "Minimum Price:",
                record.get("min_price")
            )

            print(
                "Maximum Price:",
                record.get("max_price")
            )

            print(
                "Modal Price:",
                record.get("modal_price")
            )

            print(
                "Arrival Date:",
                record.get("arrival_date")
            )

    except Exception as error:

        print()
        print("MANDI API ERROR")
        print(
            type(error).__name__
        )

        print(
            str(error)
        )

    print()
    print("=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()