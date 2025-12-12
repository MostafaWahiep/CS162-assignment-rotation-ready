"""Unit tests for ItemVerificationRepository."""
import pytest
from datetime import datetime, timedelta
from app.repositories.implementations.item_verification_repository import (
    ItemVerificationRepository
)
from app.models import ItemVerification


@pytest.mark.unit
@pytest.mark.repository
class TestItemVerificationRepository:
    """Test ItemVerificationRepository methods."""

    def test_create_verification_with_note(self, db_session, user, item):
        """Test creating verification with a note."""
        repo = ItemVerificationRepository()
        
        verification = repo.create_verification(
            user_id=user.user_id,
            item_id=item.item_id,
            note="Item is still available"
        )
        
        assert verification.verification_id is not None
        assert verification.user_id == user.user_id
        assert verification.item_id == item.item_id
        assert verification.note == "Item is still available"
        assert verification.created_at is not None
        assert isinstance(verification.created_at, datetime)

    def test_create_verification_without_note(self, db_session, user, item):
        """Test creating verification without a note."""
        repo = ItemVerificationRepository()
        
        verification = repo.create_verification(
            user_id=user.user_id,
            item_id=item.item_id,
            note=None
        )
        
        assert verification.verification_id is not None
        assert verification.note is None

    def test_get_verification_by_id_success(
        self,
        db_session,
        item_verification
    ):
        """Test getting verification by valid ID."""
        repo = ItemVerificationRepository()
        
        retrieved = repo.get_verification_by_id(
            item_verification.verification_id
        )
        
        assert retrieved is not None
        assert retrieved.verification_id == item_verification.verification_id
        assert retrieved.user_id == item_verification.user_id
        assert retrieved.item_id == item_verification.item_id

    def test_get_verification_by_id_not_found(self, db_session):
        """Test getting verification with non-existent ID."""
        repo = ItemVerificationRepository()
        verification = repo.get_verification_by_id(99999)
        assert verification is None

    def test_get_verifications_by_item_id(
        self,
        db_session,
        item,
        multiple_verifications
    ):
        """Test getting all verifications for an item."""
        repo = ItemVerificationRepository()
        
        verifications = repo.get_verifications_by_item_id(item.item_id)
        
        assert len(verifications) == 3
        # Should be ordered by most recent first
        assert verifications[0].created_at >= verifications[1].created_at
        assert verifications[1].created_at >= verifications[2].created_at

    def test_get_verifications_by_item_id_with_limit(
        self,
        db_session,
        item,
        multiple_verifications
    ):
        """Test getting verifications with limit."""
        repo = ItemVerificationRepository()
        
        verifications = repo.get_verifications_by_item_id(
            item.item_id,
            limit=2
        )
        
        assert len(verifications) == 2

    def test_get_verifications_by_item_id_empty(
        self,
        db_session,
        item
    ):
        """Test getting verifications for item with no verifications."""
        repo = ItemVerificationRepository()
        verifications = repo.get_verifications_by_item_id(item.item_id)
        assert verifications == []

    def test_get_verifications_by_user_id(
        self,
        db_session,
        user,
        multiple_verifications
    ):
        """Test getting all verifications by a user."""
        repo = ItemVerificationRepository()
        
        verifications = repo.get_verifications_by_user_id(user.user_id)
        
        # User created 2 verifications (v1 and v3)
        assert len(verifications) == 2
        for v in verifications:
            assert v.user_id == user.user_id

    def test_get_verifications_by_user_id_with_limit(
        self,
        db_session,
        user,
        multiple_verifications
    ):
        """Test getting user verifications with limit."""
        repo = ItemVerificationRepository()
        
        verifications = repo.get_verifications_by_user_id(
            user.user_id,
            limit=1
        )
        
        assert len(verifications) == 1

    def test_user_verified_item_today_true(
        self,
        db_session,
        item_verification
    ):
        """Test checking if user verified item today - returns true."""
        repo = ItemVerificationRepository()
        
        has_verified = repo.user_verified_item_today(
            item_verification.user_id,
            item_verification.item_id
        )
        
        assert has_verified is True

    def test_user_verified_item_today_false_no_verification(
        self,
        db_session,
        user,
        item
    ):
        """Test checking if user verified item today - no verification."""
        repo = ItemVerificationRepository()
        
        has_verified = repo.user_verified_item_today(
            user.user_id,
            item.item_id
        )
        
        assert has_verified is False

    def test_user_verified_item_today_false_old_verification(
        self,
        db_session,
        old_verification
    ):
        """Test checking if user verified item today - only old verification."""
        repo = ItemVerificationRepository()
        
        has_verified = repo.user_verified_item_today(
            old_verification.user_id,
            old_verification.item_id
        )
        
        assert has_verified is False

    def test_get_verification_count_for_item(
        self,
        db_session,
        item,
        multiple_verifications
    ):
        """Test getting total verification count for item."""
        repo = ItemVerificationRepository()
        
        count = repo.get_verification_count_for_item(item.item_id)
        
        assert count == 3

    def test_get_verification_count_for_item_zero(self, db_session, item):
        """Test getting verification count for item with no verifications."""
        repo = ItemVerificationRepository()
        count = repo.get_verification_count_for_item(item.item_id)
        assert count == 0

    def test_create_multiple_verifications_same_item(
        self,
        db_session,
        user,
        verified_user,
        item
    ):
        """Test multiple users can verify the same item."""
        repo = ItemVerificationRepository()
        
        v1 = repo.create_verification(user.user_id, item.item_id, "User 1")
        v2 = repo.create_verification(
            verified_user.user_id,
            item.item_id,
            "User 2"
        )
        
        assert v1.verification_id != v2.verification_id
        assert v1.user_id != v2.user_id
        assert v1.item_id == v2.item_id

    def test_verification_relationships(self, db_session, item_verification):
        """Test that verification has proper relationships to user and item."""
        repo = ItemVerificationRepository()
        
        verification = repo.get_verification_by_id(
            item_verification.verification_id
        )
        
        # Test user relationship
        assert verification.user is not None
        assert verification.user.user_id == item_verification.user_id
        
        # Test item relationship
        assert verification.item is not None
        assert verification.item.item_id == item_verification.item_id
