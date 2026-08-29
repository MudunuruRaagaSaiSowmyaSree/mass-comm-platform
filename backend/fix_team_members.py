import asyncio

from sqlalchemy import text, select

from app.database import AsyncSessionLocal
from app.models.user import User, Role


MANAGER_ID = "CM001"


async def main():
    async with AsyncSessionLocal() as db:

        # ======================================================
        # REMOVE OLD UNIQUE CONSTRAINT
        # ======================================================

        result = await db.execute(
            text("""
                SELECT constraint_name
                FROM information_schema.table_constraints
                WHERE table_name = 'users'
                  AND constraint_type = 'UNIQUE'
                  AND constraint_name = 'users_manager_id_key'
            """)
        )

        constraint = result.scalar_one_or_none()

        if constraint:
            print(
                f"Dropping constraint: {constraint}"
            )

            await db.execute(
                text(
                    'ALTER TABLE users DROP CONSTRAINT "users_manager_id_key"'
                )
            )

        else:
            print(
                "users_manager_id_key constraint not found."
            )


        # ======================================================
        # FIND CAMPAIGN PERSONS
        # ======================================================

        result = await db.execute(
            select(User)
            .where(
                User.role == Role.COMMS_TEAM
            )
            .order_by(
                User.registration_date.asc(),
                User.email.asc(),
            )
        )

        campaign_people = (
            result.scalars().all()
        )


        print(
            f"Found {len(campaign_people)} Campaign Persons."
        )


        # ======================================================
        # ASSIGN SOME CAMPAIGN PERSONS
        # ======================================================

        #
        # Assign the first 3 Campaign Persons.
        #
        # Change this number as needed.
        #

        selected = campaign_people[:3]


        if not selected:
            print(
                "No Campaign Persons found."
            )

            await db.rollback()
            return


        for member in selected:

            member.manager_id = MANAGER_ID

            print(
                f"Assigned: {member.name} "
                f"({member.email}) -> {MANAGER_ID}"
            )


        # ======================================================
        # COMMIT
        # ======================================================

        await db.commit()


        print()
        print(
            "Team assignment completed successfully."
        )

        print(
            f"Assigned {len(selected)} Campaign Persons "
            f"to Manager {MANAGER_ID}."
        )


asyncio.run(main())