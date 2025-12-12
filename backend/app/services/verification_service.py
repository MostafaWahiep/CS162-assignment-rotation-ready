"""
Item Verification Service
Business logic for item verification operations.
"""
from typing import Optional, List, Dict, Any
from app.repositories.implementations.item_verification_repository import (
    ItemVerificationRepository
)
from app.repositories.implementations.item_repository import ItemRepository
from app.models.item_verification import ItemVerification


class ItemNotFoundError(Exception):
    """Raised when an item doesn't exist."""
    pass


class AlreadyVerifiedTodayError(Exception):
    """Raised when user has already verified an item today."""
    pass


class VerificationNotFoundError(Exception):
    """Raised when a verification doesn't exist."""
    pass


class VerificationService:
    """Service for managing item verifications."""
    
    def __init__(self):
        self.verification_repo = ItemVerificationRepository()
        self.item_repo = ItemRepository()
    
    def verify_item(
        self,
        user_id: int,
        item_id: int,
        note: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Verify that an item exists.
        
        Args:
            user_id: ID of the user verifying the item
            item_id: ID of the item being verified
            note: Optional note about the verification
            
        Returns:
            Dict with verification data including:
                - verification_id
                - user_id
                - item_id
                - note
                - created_at
                - verification_count (total for item)
            
        Raises:
            ItemNotFoundError: If item doesn't exist
            AlreadyVerifiedTodayError: If user already verified this item today
        """
        # Check if item exists
        item = self.item_repo.get_item_by_id(item_id)
        if not item:
            raise ItemNotFoundError(f"Item with id {item_id} not found")
        
        # Check if user already verified this item today
        if self.verification_repo.user_verified_item_today(user_id, item_id):
            raise AlreadyVerifiedTodayError(
                f"You have already verified item {item_id} today"
            )
        
        # Create verification
        verification = self.verification_repo.create_verification(
            user_id=user_id,
            item_id=item_id,
            note=note
        )
        
        # Get updated verification count
        verification_count = self.verification_repo.get_verification_count_for_item(
            item_id
        )
        
        return {
            "verification_id": verification.verification_id,
            "user_id": verification.user_id,
            "item_id": verification.item_id,
            "note": verification.note,
            "created_at": verification.created_at.isoformat(),
            "verification_count": verification_count
        }
    
    def get_verification(self, verification_id: int) -> Dict[str, Any]:
        """
        Get a single verification by ID.
        
        Args:
            verification_id: ID of the verification
            
        Returns:
            Dict with verification data
            
        Raises:
            VerificationNotFoundError: If verification doesn't exist
        """
        verification = self.verification_repo.get_verification_by_id(
            verification_id
        )
        if not verification:
            raise VerificationNotFoundError(
                f"Verification with id {verification_id} not found"
            )
        
        return self._format_verification(verification)
    
    def get_item_verifications(
        self,
        item_id: int,
        limit: Optional[int] = 50
    ) -> Dict[str, Any]:
        """
        Get all verifications for an item.
        
        Args:
            item_id: ID of the item
            limit: Maximum number of verifications to return (default 50)
            
        Returns:
            Dict with:
                - verifications: List of verification dicts
                - total_count: Total verification count
                - item_id: ID of the item
        """
        verifications = self.verification_repo.get_verifications_by_item_id(
            item_id, limit
        )
        total_count = self.verification_repo.get_verification_count_for_item(
            item_id
        )
        
        return {
            "item_id": item_id,
            "verifications": [
                self._format_verification(v) for v in verifications
            ],
            "total_count": total_count,
            "returned_count": len(verifications)
        }
    
    def get_user_verifications(
        self,
        user_id: int,
        limit: Optional[int] = 50
    ) -> Dict[str, Any]:
        """
        Get all verifications by a user.
        
        Args:
            user_id: ID of the user
            limit: Maximum number of verifications to return (default 50)
            
        Returns:
            Dict with:
                - verifications: List of verification dicts
                - user_id: ID of the user
                - count: Number of verifications returned
        """
        verifications = self.verification_repo.get_verifications_by_user_id(
            user_id, limit
        )
        
        return {
            "user_id": user_id,
            "verifications": [
                self._format_verification(v) for v in verifications
            ],
            "count": len(verifications)
        }
    
    def _format_verification(
        self,
        verification: ItemVerification
    ) -> Dict[str, Any]:
        """
        Format a verification model instance as a dict.
        
        Args:
            verification: ItemVerification instance
            
        Returns:
            Dict with verification data
        """
        return {
            "verification_id": verification.verification_id,
            "user_id": verification.user_id,
            "item_id": verification.item_id,
            "note": verification.note,
            "created_at": verification.created_at.isoformat()
        }
