"""
Item Verification Repository Implementation
Implements verification data access operations using SQLAlchemy.
"""
from typing import Optional, List
from datetime import datetime, timedelta
from sqlalchemy import func, and_
from app.models.item_verification import ItemVerification
from app.repositories.base.item_verification_repository_interface import (
    IItemVerificationRepository
)
from app import db


class ItemVerificationRepository(IItemVerificationRepository):
    """SQLAlchemy implementation of item verification repository."""
    
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
        verification = ItemVerification(
            user_id=user_id,
            item_id=item_id,
            note=note
        )
        db.session.add(verification)
        db.session.commit()
        db.session.refresh(verification)
        return verification
    
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
        return db.session.query(ItemVerification).filter(
            ItemVerification.verification_id == verification_id
        ).first()
    
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
            List of ItemVerification instances ordered by most recent first
        """
        query = db.session.query(ItemVerification).filter(
            ItemVerification.item_id == item_id
        ).order_by(ItemVerification.created_at.desc())
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
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
            List of ItemVerification instances ordered by most recent first
        """
        query = db.session.query(ItemVerification).filter(
            ItemVerification.user_id == user_id
        ).order_by(ItemVerification.created_at.desc())
        
        if limit:
            query = query.limit(limit)
        
        return query.all()
    
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
        # Get start of today (00:00:00)
        today_start = datetime.utcnow().replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        
        # Check if verification exists for this user + item today
        existing_verification = db.session.query(ItemVerification).filter(
            and_(
                ItemVerification.user_id == user_id,
                ItemVerification.item_id == item_id,
                ItemVerification.created_at >= today_start
            )
        ).first()
        
        return existing_verification is not None
    
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
        return db.session.query(func.count(ItemVerification.verification_id)).filter(
            ItemVerification.item_id == item_id
        ).scalar() or 0
