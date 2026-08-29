import asyncio

from sqlalchemy import text

from app.database import AsyncSessionLocal


async def main():
    async with AsyncSessionLocal() as db:

        # ========================================================
        # REMOVE UNIQUE CONSTRAINT FROM manager_id
        # ========================================================

        await db.execute(
            text(
                """
                ALTER TABLE users
                DROP CONSTRAINT IF EXISTS users_manager_id_key
                """
            )
        )

        print(
            "Removed unique constraint from users.manager_id."
        )

        # ========================================================
        # CREATE NORMAL INDEX
        # ========================================================

        await db.execute(
            text(
                """
                CREATE INDEX IF NOT EXISTS
                ix_users_manager_id
                ON users (manager_id)
                """
            )
        )

        print(
            "Created normal index on users.manager_id."
        )

        # ========================================================
        # ASSIGN CAMPAIGN PERSON TO MANAGER
        # ========================================================

        result = await db.execute(
            text(
                """
                UPDATE users
                SET manager_id = :manager_id
                WHERE email = :email
                  AND role = 'comms_team'
                RETURNING
                    id,
                    name,
                    email,
                    role,
                    manager_id
                """
            ),
            {
                "manager_id": "CM001",
                "email": "test@example.com",
            },
        )

        row = result.fetchone()

        if row is None:
            print(
                "ERROR: Campaign Person was not found."
            )

        else:
            print(
                "SUCCESS: Campaign Person assigned."
            )

            print(
                f"id         = {row[0]}"
            )

            print(
                f"name       = {row[1]}"
            )

            print(
                f"email      = {row[2]}"
            )

            print(
                f"role       = {row[3]}"
            )

            print(
                f"manager_id  = {row[4]}"
            )

        await db.commit()


if __name__ == "__main__":
    asyncio.run(main())