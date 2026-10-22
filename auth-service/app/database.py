import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Database URL can be configured via environment variable
# Defaults to a local SQLite database file auth.db
DATABASE_URL = os.getenv("AUTH_DATABASE_URL", "sqlite:///./auth.db")

# check_same_thread=False is required for SQLite when accessed from multiple threads
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """
    Dependency that provides a database session to FastAPI route endpoints.
    Ensures that the database session is closed after the request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Create database tables automatically on startup.
    """
    Base.metadata.create_all(bind=engine)
