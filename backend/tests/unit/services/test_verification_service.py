"""Unit tests for VerificationService."""
import pytest
from app.services.verification_service import (
    VerificationService,
    ItemNotFoundError,
    AlreadyVerifiedTodayError,
    VerificationNotFoundError
)


@pytest.mark.unit
@pytest.mark.service
class TestVerificationService:
    """Test VerificationService methods."""

    def test_verify_item_success(self, db_session, user, item):
        """Test successfully verifying an item."""
        service = VerificationService()
        
        result = service.verify_item(
            user_id=user.user_id,
            item_id=item.item_id,
            note="Item is still here"
        )
        
        assert result['verification_id'] is not None
        assert result['user_id'] == user.user_id
        assert result['user_name'] == f"{user.first_name} {user.last_name}"
        assert result['item_id'] == item.item_id
        assert result['item_name'] == item.name
        assert result['note'] == "Item is still here"
        assert result['created_at'] is not None
        assert result['verification_count'] == 1

    def test_verify_item_without_note(self, db_session, user, item):
        """Test verifying item without a note."""
        service = VerificationService()
        
        result = service.verify_item(
            user_id=user.user_id,
            item_id=item.item_id,
            note=None
        )
        
        assert result['note'] is None
        assert result['verification_count'] == 1

    def test_verify_item_nonexistent_item(self, db_session, user):
        """Test verifying non-existent item raises error."""
        service = VerificationService()
        
        with pytest.raises(ItemNotFoundError) as exc_info:
            service.verify_item(
                user_id=user.user_id,
                item_id=99999,
                note="Test"
            )
        
        assert "Item with id 99999 not found" in str(exc_info.value)

    def test_verify_item_already_verified_today(
        self,
        db_session,
        item_verification
    ):
        """Test verifying item user already verified today raises error."""
        service = VerificationService()
        
        with pytest.raises(AlreadyVerifiedTodayError) as exc_info:
            service.verify_item(
                user_id=item_verification.user_id,
                item_id=item_verification.item_id,
                note="Another verification"
            )
        
        assert "already verified" in str(exc_info.value).lower()
        assert "today" in str(exc_info.value).lower()

    def test_verify_item_can_verify_old_verification(
        self,
        db_session,
        old_verification
    ):
        """Test user can verify item again if last verification was yesterday."""
        service = VerificationService()
        
        result = service.verify_item(
            user_id=old_verification.user_id,
            item_id=old_verification.item_id,
            note="New verification"
        )
        
        assert result['verification_id'] is not None
        assert result['verification_count'] == 2

    def test_verify_item_multiple_users_same_item(
        self,
        db_session,
        user,
        verified_user,
        item
    ):
        """Test multiple users can verify the same item on same day."""
        service = VerificationService()
        
        result1 = service.verify_item(user.user_id, item.item_id, "User 1")
        result2 = service.verify_item(
            verified_user.user_id,
            item.item_id,
            "User 2"
        )
        
        assert result1['verification_id'] != result2['verification_id']
        assert result1['user_id'] != result2['user_id']
        assert result2['verification_count'] == 2

    def test_get_verification_success(self, db_session, item_verification):
        """Test getting a verification by ID."""
        service = VerificationService()
        
        result = service.get_verification(
            item_verification.verification_id
        )
        
        assert result['verification_id'] == item_verification.verification_id
        assert result['user_id'] == item_verification.user_id
        assert result['user_name'] is not None
        assert result['item_id'] == item_verification.item_id
        assert result['item_name'] is not None
        assert result['note'] == item_verification.note

    def test_get_verification_not_found(self, db_session):
        """Test getting non-existent verification raises error."""
        service = VerificationService()
        
        with pytest.raises(VerificationNotFoundError) as exc_info:
            service.get_verification(99999)
        
        assert "Verification with id 99999 not found" in str(exc_info.value)

    def test_get_item_verifications(
        self,
        db_session,
        item,
        multiple_verifications
    ):
        """Test getting all verifications for an item."""
        service = VerificationService()
        
        result = service.get_item_verifications(item.item_id)
        
        assert result['item_id'] == item.item_id
        assert result['total_count'] == 3
        assert result['returned_count'] == 3
        assert len(result['verifications']) == 3
        
        # Check each verification has required fields
        for v in result['verifications']:
            assert 'verification_id' in v
            assert 'user_id' in v
            assert 'user_name' in v
            assert 'item_id' in v
            assert 'item_name' in v
            assert 'created_at' in v

    def test_get_item_verifications_with_limit(
        self,
        db_session,
        item,
        multiple_verifications
    ):
        """Test getting item verifications with limit."""
        service = VerificationService()
        
        result = service.get_item_verifications(item.item_id, limit=2)
        
        assert result['total_count'] == 3
        assert result['returned_count'] == 2
        assert len(result['verifications']) == 2

    def test_get_item_verifications_empty(self, db_session, item):
        """Test getting verifications for item with no verifications."""
        service = VerificationService()
        
        result = service.get_item_verifications(item.item_id)
        
        assert result['item_id'] == item.item_id
        assert result['total_count'] == 0
        assert result['returned_count'] == 0
        assert result['verifications'] == []

    def test_get_user_verifications(
        self,
        db_session,
        user,
        multiple_verifications
    ):
        """Test getting all verifications by a user."""
        service = VerificationService()
        
        result = service.get_user_verifications(user.user_id)
        
        assert result['user_id'] == user.user_id
        assert result['count'] == 2
        assert len(result['verifications']) == 2
        
        # All verifications should be from this user
        for v in result['verifications']:
            assert v['user_id'] == user.user_id

    def test_get_user_verifications_with_limit(
        self,
        db_session,
        user,
        multiple_verifications
    ):
        """Test getting user verifications with limit."""
        service = VerificationService()
        
        result = service.get_user_verifications(user.user_id, limit=1)
        
        assert result['count'] == 1
        assert len(result['verifications']) == 1

    def test_get_user_verifications_empty(self, db_session, user):
        """Test getting verifications for user with no verifications."""
        service = VerificationService()
        
        result = service.get_user_verifications(user.user_id)
        
        assert result['user_id'] == user.user_id
        assert result['count'] == 0
        assert result['verifications'] == []

    def test_verification_includes_user_and_item_names(
        self,
        db_session,
        user,
        item
    ):
        """Test that verification responses include full user and item names."""
        service = VerificationService()
        
        result = service.verify_item(
            user_id=user.user_id,
            item_id=item.item_id,
            note="Test"
        )
        
        assert result['user_name'] == f"{user.first_name} {user.last_name}"
        assert result['item_name'] == item.name
