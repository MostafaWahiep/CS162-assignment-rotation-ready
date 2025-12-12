"""Integration tests for Verification API endpoints."""
import pytest
from flask import json
from app.services.auth.token_service import TokenService
from app.models import ItemVerification
from app import db


@pytest.mark.integration
@pytest.mark.api
class TestVerificationRoutes:
    """Test Verification API endpoints."""

    # POST /api/v1/verification/items/<item_id>/verify tests

    def test_verify_item_requires_authentication(self, client, item):
        """Test that POST /verification/items/<item_id>/verify requires JWT token."""
        response = client.post(
            f'/api/v1/verification/items/{item.item_id}/verify',
            json={}
        )
        
        assert response.status_code == 401

    def test_verify_item_success(self, client, verified_user, item, app_context):
        """Test successfully verifying an item."""
        tokens = TokenService.generate_tokens(verified_user)
        headers = {'Authorization': f'Bearer {tokens["access_token"]}'}
        
        response = client.post(
            f'/api/v1/verification/items/{item.item_id}/verify',
            headers=headers,
            json={'note': 'Item is still available'}
        )
        
        assert response.status_code == 201
        data = json.loads(response.data)
        
        assert data['verification_id'] is not None
        assert data['user_id'] == verified_user.user_id
        assert data['user_name'] == (
            f"{verified_user.first_name} {verified_user.last_name}"
        )
        assert data['item_id'] == item.item_id
        assert data['item_name'] == item.name
        assert data['note'] == 'Item is still available'
        assert data['verification_count'] == 1
        assert 'created_at' in data

    def test_verify_item_without_note(
        self,
        client,
        verified_user,
        item,
        app_context
    ):
        """Test verifying item without a note."""
        tokens = TokenService.generate_tokens(verified_user)
        headers = {'Authorization': f'Bearer {tokens["access_token"]}'}
        
        response = client.post(
            f'/api/v1/verification/items/{item.item_id}/verify',
            headers=headers,
            json={}
        )
        
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data['note'] is None

    def test_verify_item_nonexistent_item(
        self,
        client,
        verified_user,
        app_context
    ):
        """Test verifying non-existent item returns 404."""
        tokens = TokenService.generate_tokens(verified_user)
        headers = {'Authorization': f'Bearer {tokens["access_token"]}'}
        
        response = client.post(
            '/api/v1/verification/items/99999/verify',
            headers=headers,
            json={'note': 'Test'}
        )
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'error' in data
        assert 'not found' in data['error'].lower()

    def test_verify_item_already_verified_today(
        self,
        client,
        verified_user,
        item,
        app_context
    ):
        """Test verifying item twice on same day returns 400."""
        tokens = TokenService.generate_tokens(verified_user)
        headers = {'Authorization': f'Bearer {tokens["access_token"]}'}
        
        # First verification
        response1 = client.post(
            f'/api/v1/verification/items/{item.item_id}/verify',
            headers=headers,
            json={'note': 'First'}
        )
        assert response1.status_code == 201
        
        # Second verification same day
        response2 = client.post(
            f'/api/v1/verification/items/{item.item_id}/verify',
            headers=headers,
            json={'note': 'Second'}
        )
        
        assert response2.status_code == 400
        data = json.loads(response2.data)
        assert 'error' in data
        assert 'already verified' in data['error'].lower()

    def test_verify_item_multiple_users(
        self,
        client,
        user,
        verified_user,
        item,
        app_context
    ):
        """Test multiple users can verify same item on same day."""
        # User 1 verifies
        tokens1 = TokenService.generate_tokens(user)
        headers1 = {'Authorization': f'Bearer {tokens1["access_token"]}'}
        
        response1 = client.post(
            f'/api/v1/verification/items/{item.item_id}/verify',
            headers=headers1,
            json={'note': 'User 1'}
        )
        assert response1.status_code == 201
        data1 = json.loads(response1.data)
        assert data1['verification_count'] == 1
        
        # User 2 verifies
        tokens2 = TokenService.generate_tokens(verified_user)
        headers2 = {'Authorization': f'Bearer {tokens2["access_token"]}'}
        
        response2 = client.post(
            f'/api/v1/verification/items/{item.item_id}/verify',
            headers=headers2,
            json={'note': 'User 2'}
        )
        assert response2.status_code == 201
        data2 = json.loads(response2.data)
        assert data2['verification_count'] == 2

    def test_verify_item_note_validation(
        self,
        client,
        verified_user,
        item,
        app_context
    ):
        """Test note validation (max length 500)."""
        tokens = TokenService.generate_tokens(verified_user)
        headers = {'Authorization': f'Bearer {tokens["access_token"]}'}
        
        # Note too long (over 500 characters)
        long_note = 'x' * 501
        
        response = client.post(
            f'/api/v1/verification/items/{item.item_id}/verify',
            headers=headers,
            json={'note': long_note}
        )
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data

    # GET /api/v1/verification/<verification_id> tests

    def test_get_verification_success(
        self,
        client,
        item_verification,
        app_context
    ):
        """Test getting a verification by ID."""
        response = client.get(
            f'/api/v1/verification/{item_verification.verification_id}'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['verification_id'] == item_verification.verification_id
        assert data['user_id'] == item_verification.user_id
        assert 'user_name' in data
        assert data['item_id'] == item_verification.item_id
        assert 'item_name' in data
        assert data['note'] == item_verification.note
        assert 'created_at' in data

    def test_get_verification_not_found(self, client, app_context):
        """Test getting non-existent verification returns 404."""
        response = client.get('/api/v1/verification/99999')
        
        assert response.status_code == 404
        data = json.loads(response.data)
        assert 'error' in data

    # GET /api/v1/verification/items/<item_id> tests

    def test_get_item_verifications_success(
        self,
        client,
        item,
        multiple_verifications,
        app_context
    ):
        """Test getting all verifications for an item."""
        response = client.get(f'/api/v1/verification/items/{item.item_id}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['item_id'] == item.item_id
        assert data['total_count'] == 3
        assert data['returned_count'] == 3
        assert len(data['verifications']) == 3
        
        # Check structure of each verification
        for v in data['verifications']:
            assert 'verification_id' in v
            assert 'user_id' in v
            assert 'user_name' in v
            assert 'item_id' in v
            assert 'item_name' in v
            assert 'created_at' in v

    def test_get_item_verifications_with_limit(
        self,
        client,
        item,
        multiple_verifications,
        app_context
    ):
        """Test getting item verifications with limit parameter."""
        response = client.get(
            f'/api/v1/verification/items/{item.item_id}?limit=2'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['total_count'] == 3
        assert data['returned_count'] == 2
        assert len(data['verifications']) == 2

    def test_get_item_verifications_empty(self, client, item, app_context):
        """Test getting verifications for item with no verifications."""
        response = client.get(f'/api/v1/verification/items/{item.item_id}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['item_id'] == item.item_id
        assert data['total_count'] == 0
        assert data['verifications'] == []

    def test_get_item_verifications_limit_capped_at_200(
        self,
        client,
        item,
        app_context
    ):
        """Test that limit is capped at 200."""
        response = client.get(
            f'/api/v1/verification/items/{item.item_id}?limit=500'
        )
        
        assert response.status_code == 200
        # Should not fail even with high limit

    # GET /api/v1/verification/users/<user_id> tests

    def test_get_user_verifications_success(
        self,
        client,
        user,
        multiple_verifications,
        app_context
    ):
        """Test getting all verifications by a user."""
        response = client.get(f'/api/v1/verification/users/{user.user_id}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['user_id'] == user.user_id
        assert data['count'] == 2
        assert len(data['verifications']) == 2
        
        # All verifications should be from this user
        for v in data['verifications']:
            assert v['user_id'] == user.user_id

    def test_get_user_verifications_with_limit(
        self,
        client,
        user,
        multiple_verifications,
        app_context
    ):
        """Test getting user verifications with limit parameter."""
        response = client.get(
            f'/api/v1/verification/users/{user.user_id}?limit=1'
        )
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['count'] == 1
        assert len(data['verifications']) == 1

    def test_get_user_verifications_empty(self, client, user, app_context):
        """Test getting verifications for user with no verifications."""
        response = client.get(f'/api/v1/verification/users/{user.user_id}')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        
        assert data['user_id'] == user.user_id
        assert data['count'] == 0
        assert data['verifications'] == []

    # End-to-end workflow test

    def test_verification_workflow_end_to_end(
        self,
        client,
        verified_user,
        item,
        app_context
    ):
        """Test complete verification workflow."""
        tokens = TokenService.generate_tokens(verified_user)
        headers = {'Authorization': f'Bearer {tokens["access_token"]}'}
        
        # 1. Verify the item
        verify_response = client.post(
            f'/api/v1/verification/items/{item.item_id}/verify',
            headers=headers,
            json={'note': 'Workflow test'}
        )
        assert verify_response.status_code == 201
        verify_data = json.loads(verify_response.data)
        verification_id = verify_data['verification_id']
        
        # 2. Get the specific verification
        get_response = client.get(
            f'/api/v1/verification/{verification_id}'
        )
        assert get_response.status_code == 200
        get_data = json.loads(get_response.data)
        assert get_data['note'] == 'Workflow test'
        
        # 3. Get all verifications for the item
        item_verifs_response = client.get(
            f'/api/v1/verification/items/{item.item_id}'
        )
        assert item_verifs_response.status_code == 200
        item_verifs_data = json.loads(item_verifs_response.data)
        assert item_verifs_data['total_count'] == 1
        
        # 4. Get all verifications by the user
        user_verifs_response = client.get(
            f'/api/v1/verification/users/{verified_user.user_id}'
        )
        assert user_verifs_response.status_code == 200
        user_verifs_data = json.loads(user_verifs_response.data)
        assert user_verifs_data['count'] == 1
