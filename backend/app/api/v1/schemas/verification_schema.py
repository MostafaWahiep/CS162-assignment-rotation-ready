"""
Verification Schemas
Pydantic schemas for verification request/response validation.
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


class VerifyItemRequest(BaseModel):
    """Request schema for verifying an item."""
    note: Optional[str] = Field(
        None,
        max_length=500,
        description="Optional note about the verification"
    )
    
    @field_validator('note')
    @classmethod
    def validate_note(cls, v: Optional[str]) -> Optional[str]:
        """Validate and strip note text."""
        if v:
            v = v.strip()
            if not v:
                return None
        return v


class VerificationResponse(BaseModel):
    """Response schema for a single verification."""
    verification_id: int = Field(..., description="Unique verification ID")
    user_id: int = Field(..., description="ID of user who verified")
    item_id: int = Field(..., description="ID of item verified")
    note: Optional[str] = Field(None, description="Verification note")
    created_at: str = Field(..., description="ISO format timestamp")
    
    class Config:
        from_attributes = True


class CreateVerificationResponse(VerificationResponse):
    """Response schema for creating a verification."""
    verification_count: int = Field(
        ...,
        description="Total number of verifications for this item"
    )


class ItemVerificationsResponse(BaseModel):
    """Response schema for item verification list."""
    item_id: int = Field(..., description="ID of the item")
    verifications: List[VerificationResponse] = Field(
        ...,
        description="List of verifications"
    )
    total_count: int = Field(
        ...,
        description="Total number of verifications for this item"
    )
    returned_count: int = Field(
        ...,
        description="Number of verifications in this response"
    )


class UserVerificationsResponse(BaseModel):
    """Response schema for user verification list."""
    user_id: int = Field(..., description="ID of the user")
    verifications: List[VerificationResponse] = Field(
        ...,
        description="List of verifications by this user"
    )
    count: int = Field(
        ...,
        description="Number of verifications returned"
    )
