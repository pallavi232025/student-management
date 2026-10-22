from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    """
    Schema for user registration request payload.
    """
    email: EmailStr = Field(..., description="Valid email address of the user", example="admin@example.com")
    password: str = Field(..., min_length=6, description="Password (at least 6 characters)", example="secret123")
    full_name: Optional[str] = Field(None, description="Full name of the user", example="John Doe")


class UserLogin(BaseModel):
    """
    Schema for user login credentials.
    """
    email: EmailStr = Field(..., description="Registered email address", example="admin@example.com")
    password: str = Field(..., description="Account password", example="secret123")


class UserResponse(BaseModel):
    """
    Schema for public user profile details returned in responses.
    """
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    role: str
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """
    Schema for JWT token response upon successful authentication.
    """
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """
    Internal schema for decoded JWT payload.
    """
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None
