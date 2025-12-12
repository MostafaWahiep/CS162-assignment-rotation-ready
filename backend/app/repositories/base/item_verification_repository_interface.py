"""
Item Verification Repository Interface
Defines the contract for verification data access operations.
"""
from abc import ABC, abstractmethod
from typing import Optional, List
from datetime import datetime
from app.models.item_verification import ItemVerification


class IItemVerificationRepository(ABC):
    """Interface for item verification data access operations."""
    
    @abstractmethod
    def create_verification(
        self,
        user_id: int,
        item_id: int,
        note: Optional[str] = None
    ) -> ItemVerification:
        """
        Create a new item verification.
        
        Args:
            user_id: ID of the user verifying the item
            item_id: ID of the item being verified
            note: Optional note about the verification
            
        Returns:
            The created ItemVerification instance
        """
        pass
    
    @abstractmethod
    def get_verification_by_id(
        self,
        verification_id: int
    ) -> Optional[ItemVerification]:
        """
        Get a verification by its ID.
        
        Args:
            verification_id: ID of the verification
            
        Returns:
            ItemVerification if found, None otherwise
        """
        pass
    
    @abstractmethod
    def get_verifications_by_item_id(
        self,
        item_id: int,
        limit: Optional[int] = None
    ) -> List[ItemVerification]:
        """
        Get all verifications for a specific item.
        
        Args:
            item_id: ID of the item
            limit: Optional limit on number of results
            
        Returns:
            List of ItemVerification instances
        """
        pass
    
    @abstractmethod
    def get_verifications_by_user_id(
        self,
        user_id: int,
        limit: Optional[int] = None
    ) -> List[ItemVerification]:
        """
        Get all verifications by a specific user.
        
        Args:
            user_id: ID of the user
            limit: Optional limit on number of results
            
        Returns:
            List of ItemVerification instances
        """
        pass
    
    @abstractmethod
    def user_verified_item_today(
        self,
        user_id: int,
        item_id: int
    ) -> bool:
        """
        Check if user has already verified this item today.
        
        Args:
            user_id: ID of the user
            item_id: ID of the item
            
        Returns:
            True if user verified this item today, False otherwise
        """
        pass
    
    @abstractmethod
    def get_verification_count_for_item(
        self,
        item_id: int
    ) -> int:
        """
        Get the total number of verifications for an item.
        
        Args:
            item_id: ID of the item
            
        Returns:
            Count of verifications
        """
        pass
