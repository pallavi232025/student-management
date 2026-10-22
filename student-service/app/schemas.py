from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class StudentBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200, example="Alice Johnson")
    email: EmailStr = Field(..., example="alice.johnson@example.com")
    phone_number: str = Field(..., min_length=7, max_length=20, example="+1-555-0199")
    department: str = Field(..., min_length=2, max_length=100, example="Computer Science")
    course: str = Field(..., min_length=2, max_length=100, example="B.Tech Computer Science")


class StudentCreate(StudentBase):
    pass


class StudentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200, example="Alice Johnson")
    email: Optional[EmailStr] = Field(None, example="alice.johnson@example.com")
    phone_number: Optional[str] = Field(None, min_length=7, max_length=20, example="+1-555-0199")
    department: Optional[str] = Field(None, min_length=2, max_length=100, example="Computer Science")
    course: Optional[str] = Field(None, min_length=2, max_length=100, example="B.Tech Computer Science")


class StudentResponse(StudentBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class StudentListResponse(BaseModel):
    total: int
    students: List[StudentResponse]
