import asyncio
import asyncpg

DATABASE_URL = "postgresql://masscomm:masscomm_pass@localhost:5432/masscomm"

async def main():
    conn = await asyncpg.connect(DATABASE_URL)

    try:
        await conn.execute("""
            ALTER TYPE campaignstatus RENAME TO campaignstatus_old;
        """)

        await conn.execute("""
            CREATE TYPE campaignstatus AS ENUM (
                'draft',
                'review',
                'ready',
                'scheduled',
                'sending',
                'completed',
                'failed'
            );
        """)

        await conn.execute("""
            ALTER TABLE campaigns
            ALTER COLUMN status
            TYPE campaignstatus
            USING LOWER(status::text)::campaignstatus;
        """)

        await conn.execute("""
            DROP TYPE campaignstatus_old;
        """)

        print("campaignstatus enum fixed successfully.")

    finally:
        await conn.close()

asyncio.run(main())