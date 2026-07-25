from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://masscomm:masscomm_pass@localhost:5432/masscomm"
    DATABASE_URL_SYNC: str = "postgresql+psycopg2://masscomm:masscomm_pass@localhost:5432/masscomm"
    class Config:
        env_file = ".env"

settings = Settings()

class Base(DeclarativeBase):
    pass

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session