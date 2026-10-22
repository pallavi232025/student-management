from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CourseBase(BaseModel):
    course_name: str = Field(..., min_length=2, max_length=200, example="Introduction to Computer Science")
    course_code: str = Field(..., min_length=2, max_length=50, example="CS101")
    description: Optional[str] = Field(None, example="Foundational programming and algorithmic concepts.")


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    course_name: Optional[str] = Field(None, min_length=2, max_length=200, example="Advanced Computer Science")
    course_code: Optional[str] = Field(None, min_length=2, max_length=50, example="CS102")
    description: Optional[str] = Field(None, example="Updated course description.")


class CourseResponse(CourseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    enrolled_count: Optional[int] = 0

    class Config:
        from_attributes = True


class EnrollmentCreate(BaseModel):
    student_id: int = Field(..., example=1)
    student_name: Optional[str] = Field(None, example="Alice Johnson")
    student_email: Optional[str] = Field(None, example="alice.johnson@example.com")


class EnrollmentResponse(BaseModel):
    id: int
    course_id: int
    student_id: int
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    enrolled_at: datetime
    course_name: Optional[str] = None
    course_code: Optional[str] = None

    class Config:
        from_attributes = True


class EnrolledStudentResponse(BaseModel):
    enrollment_id: int
    student_id: int
    student_name: Optional[str]
    student_email: Optional[str]
    enrolled_at: datetime
