"""
Test Configuration
Pytest setup, hooks, and infrastructure fixtures.
All model-specific fixtures are in tests/fixtures/ directory.
"""
import pytest
from app import create_app, db

# Import all fixtures from the fixtures package
from tests.fixtures.user_fixtures import *  # noqa
from tests.fixtures.item_fixtures import *  # noqa
from tests.fixtures.verification_fixtures import *  # noqa
from tests.fixtures.category_fixtures import *  # noqa
from tests.fixtures.item_verification_fixtures import *  # noqa


@pytest.fixture(scope='session')
def app():
    """Create application for testing."""
    app = create_app('testing')
    yield app


@pytest.fixture(autouse=True)
def setup_database(app):
    """Create a fresh database for each test.
    
    This fixture runs before each test and:
    1. Creates all tables
    2. Yields control to the test
    3. Drops all tables after the test
    
    This ensures complete isolation between tests.
    """
    with app.app_context():
        db.create_all()
        yield
        db.session.remove()
        db.drop_all()


@pytest.fixture
def client(app):
    """Test client for making requests."""
    return app.test_client()


@pytest.fixture
def app_context(app):
    """Application context for testing."""
    with app.app_context():
        yield app


@pytest.fixture
def db_session(app):
    """Database session for testing.
    
    Returns the Flask-SQLAlchemy session bound to the test's app context.
    The database is created fresh before each test by the setup_database fixture.
    """
    with app.app_context():
        yield db.session
