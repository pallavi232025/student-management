from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
from app.database import Base


class Student(Base):
    """
    SQLAlchemy model representing a Student record.
    Uses its own isolated SQLite database (students.db).
    """
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone_number = Column(String(50), nullable=False)
    department = Column(String(100), nullable=False)
    course = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
