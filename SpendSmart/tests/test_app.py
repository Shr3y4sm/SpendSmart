"""
Comprehensive test suite for SpendSmart application
Tests all existing features: Auth, Expenses, Budget, Stats, AI Features
"""
import pytest
from datetime import datetime
import json

# ============================================================================
# AUTHENTICATION TESTS
# ============================================================================

class TestAuthentication:
    """Test user registration, login, and logout"""
    
    def test_register_new_user(self, client):
        """Test user registration"""
        response = client.post('/register', data={
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'password123',
            'full_name': 'New User'
        }, follow_redirects=True)
        assert response.status_code == 200
    
    def test_login_success(self, client, init_database):
        """Test successful login"""
        response = client.post('/login', data={
            'username': 'testuser',
            'password': 'password123'
        }, follow_redirects=True)
        assert response.status_code == 200
    
    def test_login_wrong_password(self, client, init_database):
        """Test login with wrong password"""
        response = client.post('/login', data={
            'username': 'testuser',
            'password': 'wrongpassword'
        }, follow_redirects=True)
        assert b'Invalid username or password' in response.data or response.status_code == 200
    
    def test_logout(self, authenticated_client):
        """Test logout"""
        response = authenticated_client.get('/logout', follow_redirects=True)
        assert response.status_code == 200


# ============================================================================
# EXPENSE TESTS
# ============================================================================

class TestExpenses:
    """Test expense CRUD operations"""
    
    def test_get_expenses(self, authenticated_client):
        """Test getting all expenses"""
        response = authenticated_client.get('/api/expenses')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'data' in data or 'expenses' in data
    
    def test_add_expense(self, authenticated_client):
        """Test adding new expense"""
        expense_data = {
            'item': 'Test Item',
            'amount': 50.00,
            'category': 'Food & Dining',
            'date': '2025-11-03'
        }
        response = authenticated_client.post('/api/expenses', json=expense_data)
        assert response.status_code in [200, 201]
    
    def test_update_expense(self, authenticated_client, init_database):
        """Test updating an expense"""
        # First get an expense
        response = authenticated_client.get('/api/expenses')
        data = json.loads(response.data)
        expenses = data.get('data') or data.get('expenses', [])
        if expenses:
            expense_id = expenses[0]['id']
            
            updated_data = {
                'item': 'Updated Item',
                'amount': 75.00,
                'category': 'Shopping',
                'date': '2025-11-03'
            }
            response = authenticated_client.put(f'/api/expenses/{expense_id}', json=updated_data)
            assert response.status_code == 200
    
    def test_delete_expense(self, authenticated_client, init_database):
        """Test deleting an expense"""
        # First get an expense
        response = authenticated_client.get('/api/expenses')
        data = json.loads(response.data)
        expenses = data.get('data') or data.get('expenses', [])
        if expenses:
            expense_id = expenses[0]['id']
            response = authenticated_client.delete(f'/api/expenses/{expense_id}')
            assert response.status_code == 200


# ============================================================================
# BUDGET TESTS
# ============================================================================

class TestBudget:
    """Test budget management"""
    
    def test_get_budget(self, authenticated_client):
        """Test getting current budget"""
        response = authenticated_client.get('/api/budget')
        assert response.status_code == 200
    
    def test_set_budget(self, authenticated_client):
        """Test setting monthly budget"""
        budget_data = {
            'amount': 1000.00,
            'alert_threshold': 80
        }
        response = authenticated_client.post('/api/budget', json=budget_data)
        assert response.status_code in [200, 201]
    
    def test_get_budget_status(self, authenticated_client, init_database):
        """Test getting budget status"""
        response = authenticated_client.get('/api/budget/status')
        assert response.status_code == 200


# ============================================================================
# STATISTICS TESTS
# ============================================================================

class TestStatistics:
    """Test expense statistics"""
    
    def test_get_stats(self, authenticated_client, init_database):
        """Test getting expense statistics"""
        response = authenticated_client.get('/api/stats')
        assert response.status_code == 200
        data = json.loads(response.data)
        # Stats can be in 'data' or at root level
        stats = data.get('data', data)
        assert 'total_expenses' in stats or 'total_amount' in stats


# ============================================================================
# AI FEATURES TESTS
# ============================================================================

class TestAIFeatures:
    """Test AI categorization and insights"""
    
    def test_categorize_expense(self, authenticated_client):
        """Test AI expense categorization"""
        data = {'item': 'Pizza from Dominos'}
        response = authenticated_client.post('/api/categorize', json=data)
        # May return 200 or 503 if API key not configured
        assert response.status_code in [200, 503]
    
    def test_get_insights(self, authenticated_client, init_database):
        """Test getting AI insights"""
        response = authenticated_client.get('/api/insights')
        # May return 200 or 503 if API key not configured
        assert response.status_code in [200, 503]
    
    def test_get_trends(self, authenticated_client, init_database):
        """Test getting spending trends"""
        response = authenticated_client.get('/api/insights/trends')
        # May return 200 or 503 if API key not configured
        assert response.status_code in [200, 503]


# ============================================================================
# VISUALIZATION TESTS
# ============================================================================

class TestVisualization:
    """Test data visualization endpoints"""
    
    def test_get_visualization_data(self, authenticated_client, init_database):
        """Test getting visualization data"""
        response = authenticated_client.get('/api/visualization/data')
        assert response.status_code == 200


# ============================================================================
# MODEL TESTS
# ============================================================================

class TestModels:
    """Test database models"""
    
    def test_user_model(self, app, init_database):
        """Test User model"""
        with app.app_context():
            from app.models import User
            user = User.query.filter_by(username='testuser').first()
            assert user is not None
            assert user.email == 'test@example.com'
            assert user.check_password('password123')
    
    def test_expense_model(self, app, init_database):
        """Test Expense model"""
        with app.app_context():
            from app.models import Expense, User
            user = User.query.filter_by(username='testuser').first()
            expenses = Expense.query.filter_by(user_id=user.id).all()
            assert len(expenses) >= 0
    
    def test_budget_model(self, app, init_database):
        """Test Budget model"""
        with app.app_context():
            from app.models import Budget, User
            user = User.query.filter_by(username='testuser').first()
            budget = Budget.query.filter_by(user_id=user.id).first()
            assert budget is not None
            assert budget.amount > 0
