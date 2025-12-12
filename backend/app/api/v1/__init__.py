from flask import Blueprint, jsonify

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')


@api_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'healthy', 'message': 'API is running'}), 200


@api_bp.route('/', methods=['GET'])
def index():
    """API welcome endpoint."""
    return jsonify({
        'message': 'Welcome to Minerva API v1',
        'version': '1.0.0'
    }), 200


from app.api.v1.rotation_city import rotation_city_bp
api_bp.register_blueprint(rotation_city_bp, url_prefix='/rotation-city')

from .auth import auth_bp
api_bp.register_blueprint(auth_bp, url_prefix='/auth')

from .user import user_bp
api_bp.register_blueprint(user_bp, url_prefix='/user')

from .category import category_bp
api_bp.register_blueprint(category_bp, url_prefix='/category')

from .tag import tag_bp
api_bp.register_blueprint(tag_bp, url_prefix='/tag')

from .item import item_bp
api_bp.register_blueprint(item_bp, url_prefix='/item')

from .value import value_bp
api_bp.register_blueprint(value_bp, url_prefix='/value')

from .verification import verification_bp
api_bp.register_blueprint(verification_bp, url_prefix='/verification')
