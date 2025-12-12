"""
Verification API Endpoints
Routes for item verification operations.
"""
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from pydantic import ValidationError
from app.services.verification_service import (
    VerificationService,
    ItemNotFoundError,
    AlreadyVerifiedTodayError,
    VerificationNotFoundError
)
from app.api.v1.schemas.verification_schema import (
    VerifyItemRequest,
    CreateVerificationResponse,
    VerificationResponse,
    ItemVerificationsResponse,
    UserVerificationsResponse
)


verification_bp = Blueprint('verifications', __name__)
verification_service = VerificationService()


@verification_bp.route('/items/<int:item_id>/verify', methods=['POST'])
@jwt_required()
def verify_item(item_id: int):
    """
    Verify that an item exists.
    
    Required: JWT authentication
    
    Request Body:
        {
            "note": "Optional note about verification"
        }
    
    Returns:
        201: Verification created successfully
        400: Validation error or already verified today
        404: Item not found
    """
    try:
        # Get authenticated user ID
        user_id = get_jwt_identity()
        
        # Parse and validate request body
        request_data = VerifyItemRequest(**request.get_json() or {})
        
        # Create verification
        verification_data = verification_service.verify_item(
            user_id=user_id,
            item_id=item_id,
            note=request_data.note
        )
        
        # Validate and return response
        response = CreateVerificationResponse(**verification_data)
        return jsonify(response.model_dump()), 201
        
    except ValidationError as e:
        return jsonify({
            "error": "Validation error",
            "details": e.errors()
        }), 400
        
    except ItemNotFoundError as e:
        return jsonify({"error": str(e)}), 404
        
    except AlreadyVerifiedTodayError as e:
        return jsonify({"error": str(e)}), 400
        
    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500


@verification_bp.route('/<int:verification_id>', methods=['GET'])
def get_verification(verification_id: int):
    """
    Get a single verification by ID.
    
    Returns:
        200: Verification data
        404: Verification not found
    """
    try:
        verification_data = verification_service.get_verification(
            verification_id
        )
        
        response = VerificationResponse(**verification_data)
        return jsonify(response.model_dump()), 200
        
    except VerificationNotFoundError as e:
        return jsonify({"error": str(e)}), 404
        
    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500


@verification_bp.route('/items/<int:item_id>', methods=['GET'])
def get_item_verifications(item_id: int):
    """
    Get all verifications for an item.
    
    Query Parameters:
        limit: Maximum number of verifications to return (default 50, max 200)
    
    Returns:
        200: List of verifications with total count
    """
    try:
        # Parse limit parameter
        limit = request.args.get('limit', 50, type=int)
        limit = min(limit, 200)  # Cap at 200
        
        verifications_data = verification_service.get_item_verifications(
            item_id=item_id,
            limit=limit
        )
        
        response = ItemVerificationsResponse(**verifications_data)
        return jsonify(response.model_dump()), 200
        
    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500


@verification_bp.route('/users/<int:user_id>', methods=['GET'])
def get_user_verifications(user_id: int):
    """
    Get all verifications by a user.
    
    Query Parameters:
        limit: Maximum number of verifications to return (default 50, max 200)
    
    Returns:
        200: List of verifications
    """
    try:
        # Parse limit parameter
        limit = request.args.get('limit', 50, type=int)
        limit = min(limit, 200)  # Cap at 200
        
        verifications_data = verification_service.get_user_verifications(
            user_id=user_id,
            limit=limit
        )
        
        response = UserVerificationsResponse(**verifications_data)
        return jsonify(response.model_dump()), 200
        
    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "message": str(e)
        }), 500
