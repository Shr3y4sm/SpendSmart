"""
pytest configuration and shared fixtures
"""
import pytest
import os
import tempfile
from app import create_app
from app.models import db, User, Expense, Budget
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash

@pytest.fixture(scope='session')
def app():
    """Create application for testing"""
    # Create a temporary database
    db_fd, db_path = tempfile.mkstemp()
    
    test_app = create_app()
    test_app.config.update({
        'TESTING': True,
        'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_path}',
        'WTF_CSRF_ENABLED': False,
        'SECRET_KEY': 'test-secret-key'
    })
    
    with test_app.app_context():
        db.create_all()
        yield test_app
        db.session.remove()
        db.drop_all()
    
    os.close(db_fd)
    os.unlink(db_path)

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create test CLI runner"""
    return app.test_cli_runner()

@pytest.fixture
def init_database(app):
    """Initialize database with test data"""
    with app.app_context():
        # Clear existing data first
        db.session.query(Expense).delete()
        db.session.query(Budget).delete()
        db.session.query(User).delete()
        db.session.commit()
        
        # Create test users
        user1 = User(
            username='testuser',
            email='test@example.com',
            full_name='Test User'
        )
        user1.set_password('password123')
        
        user2 = User(
            username='testuser2',
            email='test2@example.com',
            full_name='Test User 2'
        )
        user2.set_password('password123')
        
        db.session.add(user1)
        db.session.add(user2)
        db.session.commit()
        
        # Create test expenses (model uses 'item' not 'item_name')
        current_date = datetime.now().date()
        current_month = current_date.strftime('%Y-%m')
        
        expense1 = Expense(
            user_id=user1.id,
            item='Grocery Shopping',
            amount=50.00,
            category='Food & Dining',
            date=current_date
        )
        
        expense2 = Expense(
            user_id=user1.id,
            item='Uber Ride',
            amount=15.50,
            category='Transportation',
            date=current_date
        )
        
        db.session.add(expense1)
        db.session.add(expense2)
        
        # Create test budget (only ONE budget per user per month due to unique constraint)
        budget1 = Budget(
            user_id=user1.id,
            amount=500.00,
            month=current_month,
            alert_threshold=80
        )
        
        db.session.add(budget1)
        db.session.commit()
        
        yield db
        
        # Cleanup happens automatically with temporary database

@pytest.fixture
def authenticated_client(client, init_database):
    """Create authenticated test client"""
    client.post('/login', data={
        'username': 'testuser',
        'password': 'password123'
    }, follow_redirects=True)
    return client

@pytest.fixture
def sample_user_data():
    """Sample user registration data"""
    return {
        'username': 'newuser',
        'email': 'newuser@example.com',
        'password': 'securepass123',
        'full_name': 'New User'
    }

@pytest.fixture
def sample_expense_data():
    """Sample expense data"""
    return {
        'item': 'Test Expense',
        'amount': 25.99,
        'category': 'Shopping',
        'date': datetime.now().strftime('%Y-%m-%d')
    }

@pytest.fixture
def sample_budget_data():
    """Sample budget data"""
    current_month = datetime.now().strftime('%Y-%m')
    return {
        'amount': 300.00,
        'month': current_month,
        'alert_threshold': 80
    }
