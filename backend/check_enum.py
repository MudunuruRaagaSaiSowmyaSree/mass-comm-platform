import asyncio
import asyncpg


async def main():
    conn = await asyncpg.connect(
        "postgresql://masscomm:masscomm_pass@localhost:5432/masscomm"
    )

    result = await conn.fetchval(
        "SELECT enum_range(NULL::campaignstatus)"
    )

    print(result)

    await conn.close()


asyncio.run(main())