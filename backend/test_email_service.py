import asyncio
from app.database import AsyncSessionLocal
from app.services.email import send_email_message

async def main():
    result = await send_email_message(
        recipient="aimasscomm@gmail.com",
        message="SMTP diagnostic test from Mass Communication Platform",
        config={
            "provider": "smtp",
            "host": "smtp.gmail.com",
            "port": 587,
            "username": "aimasscomm@gmail.com",
            "password": "ayqhdaddrvzdzupf",
            "from_email": "aimasscomm@gmail.com",
            "use_tls": True,
        },
    )

    print("SUCCESS  =", result.success)
    print("CHANNEL  =", result.channel)
    print("PROVIDER =", result.provider)
    print("MESSAGE  =", result.message_id)
    print("ERROR    =", result.error)
    print("METADATA =", result.metadata)

asyncio.run(main())
