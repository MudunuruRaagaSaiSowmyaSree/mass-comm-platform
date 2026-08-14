import asyncio

from app.database import engine, Base

# Import all models so SQLAlchemy knows about every table
from app.models.user import User
from app.models.audience import AudienceMember
from app.models.campaign import Campaign
from app.models.template import Template
from app.models.campaign_recipient import CampaignRecipient

# Import these if these files exist in your project
try:
    from app.models.chat_history import ChatHistory
except ImportError:
    ChatHistory = None

try:
    from app.models.message_delivery import MessageDelivery
except ImportError:
    MessageDelivery = None


async def init_db():
    print("Creating database tables...")

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    print("Database tables created successfully!")


if __name__ == "__main__":
    asyncio.run(init_db())