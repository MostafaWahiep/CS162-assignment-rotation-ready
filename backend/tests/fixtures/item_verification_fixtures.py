"""
Item Verification Fixtures
"""
import pytest
from app.models import ItemVerification
from datetime import datetime, timedelta


@pytest.fixture
def item_verification(db_session, user, item):
    """Create a test item verification."""
    verification = ItemVerification(
        user_id=user.user_id,
        item_id=item.item_id,
        note="Item verified and in good condition"
    )
    db_session.add(verification)
    db_session.commit()
    db_session.refresh(verification)
    return verification


@pytest.fixture
def item_verification_no_note(db_session, verified_user, item):
    """Create a verification without a note."""
    verification = ItemVerification(
        user_id=verified_user.user_id,
        item_id=item.item_id,
        note=None
    )
    db_session.add(verification)
    db_session.commit()
    db_session.refresh(verification)
    return verification


@pytest.fixture
def old_verification(db_session, user, item):
    """Create an old verification from yesterday."""
    verification = ItemVerification(
        user_id=user.user_id,
        item_id=item.item_id,
        note="Old verification"
    )
    db_session.add(verification)
    db_session.flush()
    
    # Manually set created_at to yesterday
    yesterday = datetime.utcnow() - timedelta(days=1)
    verification.created_at = yesterday
    db_session.commit()
    db_session.refresh(verification)
    return verification


@pytest.fixture
def multiple_verifications(db_session, user, verified_user, item):
    """Create multiple verifications for an item."""
    verifications = []
    
    # Verification 1 - from user
    v1 = ItemVerification(
        user_id=user.user_id,
        item_id=item.item_id,
        note="First verification"
    )
    db_session.add(v1)
    verifications.append(v1)
    
    # Verification 2 - from verified_user
    v2 = ItemVerification(
        user_id=verified_user.user_id,
        item_id=item.item_id,
        note="Second verification"
    )
    db_session.add(v2)
    verifications.append(v2)
    
    # Verification 3 - from user again (different day simulated)
    v3 = ItemVerification(
        user_id=user.user_id,
        item_id=item.item_id,
        note="Third verification"
    )
    db_session.add(v3)
    verifications.append(v3)
    
    db_session.commit()
    for v in verifications:
        db_session.refresh(v)
    
    return verifications
