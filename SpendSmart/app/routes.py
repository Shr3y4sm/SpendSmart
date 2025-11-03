from flask import Blueprint, render_template, request, jsonify, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
from sqlalchemy import extract
import json
import os
from datetime import datetime
import re
from app.ai_categorizer import AICategorizer
from app.ai_insights import AIInsightsGenerator
from app.models import db, User, Expense, Budget
from app.email_service import send_budget_exceeded_email, send_budget_warning_email

main = Blueprint('main', __name__)

# Simple file-based storage for expenses
DATA_FILE = 'expenses_data.json'

# Initialize AI categorizer
AI_CATEGORIZER = None
AI_INSIGHTS = None

def get_ai_categorizer():
    """Get or initialize AI categorizer"""
    global AI_CATEGORIZER
    if AI_CATEGORIZER is None:
        api_key = os.environ.get('GEMINI_API_KEY')
        if api_key:
            AI_CATEGORIZER = AICategorizer(api_key)
    return AI_CATEGORIZER

def get_ai_insights():
    """Get or initialize AI insights generator"""
    global AI_INSIGHTS
    if AI_INSIGHTS is None:
        api_key = os.environ.get('GEMINI_API_KEY')
        if api_key:
            AI_INSIGHTS = AIInsightsGenerator(api_key)
    return AI_INSIGHTS

def load_expenses():
    """Load expenses from JSON file"""
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error loading expenses: {e}")
            return []
        except Exception as e:
            print(f"Unexpected error loading expenses: {e}")
            return []
    return []

def save_expenses(expenses):
    """Save expenses to JSON file"""
    try:
        with open(DATA_FILE, 'w') as f:
            json.dump(expenses, f, indent=2)
        return True
    except IOError as e:
        print(f"Error saving expenses: {e}")
        return False

def get_next_id(expenses):
    """Generate next unique ID for expenses"""
    if not expenses:
        return 1
    return max(expense.get('id', 0) for expense in expenses) + 1

def validate_expense_data(data):
    """Validate expense data"""
    errors = []
    
    # Check required fields
    required_fields = ['item', 'category', 'amount', 'date']
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f"{field} is required")
    
    if errors:
        return errors
    
    # Validate item name (basic sanitization)
    if not isinstance(data['item'], str) or len(data['item'].strip()) < 1:
        errors.append("Item name must be a non-empty string")
    
    # Validate amount
    try:
        amount = float(data['amount'])
        if amount <= 0:
            errors.append("Amount must be greater than 0")
        if amount > 999999.99:
            errors.append("Amount is too large")
    except (ValueError, TypeError):
        errors.append("Amount must be a valid number")
    
    # Validate date format
    try:
        datetime.strptime(data['date'], '%Y-%m-%d')
    except ValueError:
        errors.append("Date must be in YYYY-MM-DD format")
    
    # Validate category (basic check)
    valid_categories = [
        'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
        'Bills & Utilities', 'Healthcare', 'Education', 'Others'
    ]
    if data['category'] not in valid_categories:
        errors.append("Invalid category")
    
    return errors

def check_and_send_budget_alert(user, expense_date):
    """
    Check budget status and send email alerts if thresholds are exceeded
    
    Args:
        user: Current user object
        expense_date: Date of the expense (date object)
    """
    try:
        print(f"\n📧 Checking budget alert for user: {user.email}")
        
        # Get budget for the expense month
        month_str = expense_date.strftime('%Y-%m')
        current_month = datetime.now().strftime('%Y-%m')
        
        print(f"   Expense month: {month_str}, Current month: {current_month}")
        
        # Only check for current month budget
        if month_str != current_month:
            print(f"   ⚠️  Skipping - expense not in current month")
            return
        
        budget = Budget.query.filter_by(user_id=user.id, month=month_str).first()
        
        if not budget:
            print(f"   ⚠️  No budget set for {month_str}")
            return  # No budget set, no alert needed
        
        print(f"   Budget: Rs. {budget.amount}, Threshold: {budget.alert_threshold}%")
        
        # Calculate total spent for the month
        year = expense_date.year
        month = expense_date.month
        
        monthly_expenses = Expense.query.filter(
            Expense.user_id == user.id,
            extract('year', Expense.date) == year,
            extract('month', Expense.date) == month
        ).all()
        
        total_spent = sum(expense.amount for expense in monthly_expenses)
        budget_amount = budget.amount
        spent_percentage = (total_spent / budget_amount) * 100 if budget_amount > 0 else 0
        
        print(f"   Total spent: Rs. {total_spent:.2f} ({spent_percentage:.1f}%)")
        print(f"   Warning sent: {budget.warning_email_sent}, Exceeded sent: {budget.exceeded_email_sent}")
        
        # Check if budget is exceeded and email hasn't been sent
        if spent_percentage >= 100 and not budget.exceeded_email_sent:
            print(f"   🚨 SENDING EXCEEDED EMAIL...")
            send_budget_exceeded_email(
                user_email=user.email,
                user_name=user.full_name or user.username,
                budget_amount=budget_amount,
                total_spent=total_spent,
                month=month_str
            )
            budget.exceeded_email_sent = True
            db.session.commit()
            print(f"   ✓ Budget exceeded email sent to {user.email}")
        
        # Check if threshold is reached and warning email hasn't been sent
        elif spent_percentage >= budget.alert_threshold and not budget.warning_email_sent and not budget.exceeded_email_sent:
            print(f"   ⚠️  SENDING WARNING EMAIL...")
            send_budget_warning_email(
                user_email=user.email,
                user_name=user.full_name or user.username,
                budget_amount=budget_amount,
                total_spent=total_spent,
                threshold_percentage=budget.alert_threshold,
                month=month_str
            )
            budget.warning_email_sent = True
            db.session.commit()
            print(f"   ✓ Budget warning email sent to {user.email}")
        else:
            print(f"   ℹ️  No email needed at this time")
            
    except Exception as e:
        print(f"   ✗ Error checking budget alert: {e}")
        import traceback
        traceback.print_exc()

@main.route('/')
def index():
    """Render the main page - redirect to dashboard if logged in"""
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return redirect(url_for('main.login'))

@main.route('/dashboard')
@login_required
def dashboard():
    """Render the dashboard page"""
    return render_template('index.html')

@main.route('/receipt')
@login_required
def receipt_page():
    """Receipt upload and OCR page (Tesseract-only, no Gemini)"""
    return render_template('receipt.html')

@main.route('/register', methods=['GET', 'POST'])
def register():
    """User registration"""
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        
        # Validate required fields
        required_fields = ['full_name', 'username', 'email', 'password']
        for field in required_fields:
            if not data.get(field):
                if request.is_json:
                    return jsonify({'success': False, 'error': f'{field} is required'}), 400
                flash(f'{field.replace("_", " ").title()} is required', 'danger')
                return redirect(url_for('main.register'))
        
        # Check if username already exists
        if User.query.filter_by(username=data.get('username')).first():
            if request.is_json:
                return jsonify({'success': False, 'error': 'Username already exists'}), 400
            flash('Username already exists', 'danger')
            return redirect(url_for('main.register'))
        
        # Check if email already exists
        if User.query.filter_by(email=data.get('email')).first():
            if request.is_json:
                return jsonify({'success': False, 'error': 'Email already registered'}), 400
            flash('Email already registered', 'danger')
            return redirect(url_for('main.register'))
        
        # Create new user
        try:
            user = User(
                full_name=data.get('full_name'),
                username=data.get('username'),
                email=data.get('email')
            )
            user.set_password(data.get('password'))
            
            db.session.add(user)
            db.session.commit()
            
            if request.is_json:
                return jsonify({'success': True, 'message': 'Registration successful'}), 201
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('main.login'))
            
        except Exception as e:
            db.session.rollback()
            if request.is_json:
                return jsonify({'success': False, 'error': str(e)}), 500
            flash('Registration failed. Please try again.', 'danger')
            return redirect(url_for('main.register'))
    
    return render_template('register.html')

@main.route('/login', methods=['GET', 'POST'])
def login():
    """User login"""
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        
        username_or_email = data.get('username')
        password = data.get('password')
        remember = data.get('remember', False)
        
        if not username_or_email or not password:
            if request.is_json:
                return jsonify({'success': False, 'error': 'Username/email and password are required'}), 400
            flash('Username/email and password are required', 'danger')
            return redirect(url_for('main.login'))
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username_or_email) | (User.email == username_or_email)
        ).first()
        
        if user and user.check_password(password):
            login_user(user, remember=remember)
            next_page = request.args.get('next')
            if request.is_json:
                return jsonify({'success': True, 'message': 'Login successful', 'redirect': next_page or url_for('main.dashboard')}), 200
            return redirect(next_page or url_for('main.dashboard'))
        else:
            if request.is_json:
                return jsonify({'success': False, 'error': 'Invalid username/email or password'}), 401
            flash('Invalid username/email or password', 'danger')
            return redirect(url_for('main.login'))
    
    return render_template('login.html')

@main.route('/logout')
@login_required
def logout():
    """User logout"""
    logout_user()
    flash('You have been logged out successfully', 'info')
    return redirect(url_for('main.login'))

@main.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    """User profile page"""
    if request.method == 'POST':
        data = request.get_json() if request.is_json else request.form
        
        try:
            # Update profile information
            if 'full_name' in data:
                current_user.full_name = data['full_name']
            if 'email' in data:
                # Check if email is already taken by another user
                existing_user = User.query.filter(User.email == data['email'], User.id != current_user.id).first()
                if existing_user:
                    if request.is_json:
                        return jsonify({'success': False, 'error': 'Email already in use'}), 400
                    flash('Email already in use', 'danger')
                    return redirect(url_for('main.profile'))
                current_user.email = data['email']
            
            # Change password if provided
            if 'current_password' in data and 'new_password' in data:
                if not current_user.check_password(data['current_password']):
                    if request.is_json:
                        return jsonify({'success': False, 'error': 'Current password is incorrect'}), 400
                    flash('Current password is incorrect', 'danger')
                    return redirect(url_for('main.profile'))
                current_user.set_password(data['new_password'])
            
            db.session.commit()
            
            if request.is_json:
                return jsonify({'success': True, 'message': 'Profile updated successfully'}), 200
            flash('Profile updated successfully', 'success')
            return redirect(url_for('main.profile'))
            
        except Exception as e:
            db.session.rollback()
            if request.is_json:
                return jsonify({'success': False, 'error': str(e)}), 500
            flash('Failed to update profile', 'danger')
            return redirect(url_for('main.profile'))
    
    return render_template('profile.html')

@main.route('/favicon.ico')
def favicon():
    """Handle favicon requests"""
    return '', 204  # No content

@main.route('/api/expenses', methods=['GET'])
@login_required
def get_expenses():
    """Get all expenses for current user"""
    try:
        expenses = Expense.query.filter_by(user_id=current_user.id).all()
        expenses_data = [expense.to_dict() for expense in expenses]
        return jsonify({
            'success': True,
            'data': expenses_data,
            'count': len(expenses_data)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to load expenses',
            'message': str(e)
        }), 500

@main.route('/api/expenses', methods=['POST'])
@login_required
def add_expense():
    """Add a new expense for current user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate expense data
        validation_errors = validate_expense_data(data)
        if validation_errors:
            return jsonify({
                'success': False,
                'error': 'Validation failed',
                'details': validation_errors
            }), 400
        
        # Create new expense
        new_expense = Expense(
            user_id=current_user.id,
            item=data['item'].strip(),
            category=data['category'],
            amount=float(data['amount']),
            date=datetime.strptime(data['date'], '%Y-%m-%d').date()
        )
        
        db.session.add(new_expense)
        db.session.commit()
        
        # Check budget and send email if exceeded
        check_and_send_budget_alert(current_user, new_expense.date)
        
        return jsonify({
            'success': True,
            'data': new_expense.to_dict(),
            'message': 'Expense added successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@main.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@login_required
def delete_expense(expense_id):
    """Delete an expense"""
    try:
        # Find expense and verify ownership
        expense = Expense.query.filter_by(id=expense_id, user_id=current_user.id).first()
        
        if not expense:
            return jsonify({
                'success': False,
                'error': 'Expense not found'
            }), 404
        
        db.session.delete(expense)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Expense deleted successfully',
            'deleted_id': expense_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@main.route('/api/expenses/<int:expense_id>', methods=['PUT'])
@login_required
def update_expense(expense_id):
    """Update an expense"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Find expense and verify ownership
        expense = Expense.query.filter_by(id=expense_id, user_id=current_user.id).first()
        
        if not expense:
            return jsonify({
                'success': False,
                'error': 'Expense not found'
            }), 404
        
        # Validate data if provided
        if any(field in data for field in ['item', 'category', 'amount', 'date']):
            validation_data = {
                'item': data.get('item', expense.item),
                'category': data.get('category', expense.category),
                'amount': data.get('amount', expense.amount),
                'date': data.get('date', expense.date.strftime('%Y-%m-%d'))
            }
            
            validation_errors = validate_expense_data(validation_data)
            if validation_errors:
                return jsonify({
                    'success': False,
                    'error': 'Validation failed',
                    'details': validation_errors
                }), 400
        
        # Update expense fields
        if 'item' in data:
            expense.item = data['item'].strip()
        if 'category' in data:
            expense.category = data['category']
        if 'amount' in data:
            expense.amount = float(data['amount'])
        if 'date' in data:
            expense.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        
        db.session.commit()
        
        # Check budget after update (in case amount increased)
        check_and_send_budget_alert(current_user, expense.date)
        
        return jsonify({
            'success': True,
            'data': expense.to_dict(),
            'message': 'Expense updated successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@main.route('/api/expenses/<int:expense_id>', methods=['GET'])
@login_required
def get_expense(expense_id):
    """Get a specific expense by ID"""
    try:
        expense = Expense.query.filter_by(id=expense_id, user_id=current_user.id).first()
        
        if not expense:
            return jsonify({
                'success': False,
                'error': 'Expense not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': expense.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@main.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        expenses = load_expenses()
        return jsonify({
            'status': 'healthy',
            'message': 'SpendSmart API is running',
            'expenses_count': len(expenses),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

@main.route('/api/stats', methods=['GET'])
@login_required
def get_statistics():
    """Get expense statistics for current user"""
    try:
        expenses = Expense.query.filter_by(user_id=current_user.id).all()
        
        if not expenses:
            return jsonify({
                'success': True,
                'data': {
                    'total_expenses': 0,
                    'total_amount': 0.0,
                    'categories': {},
                    'recent_expenses': []
                }
            })
        
        # Calculate statistics
        total_amount = sum(expense.amount for expense in expenses)
        
        # Category breakdown
        categories = {}
        for expense in expenses:
            category = expense.category
            if category not in categories:
                categories[category] = {'count': 0, 'amount': 0.0}
            categories[category]['count'] += 1
            categories[category]['amount'] += expense.amount
        
        # Recent expenses (last 5)
        recent_expenses = Expense.query.filter_by(user_id=current_user.id).order_by(Expense.date.desc()).limit(5).all()
        recent_expenses_data = [expense.to_dict() for expense in recent_expenses]
        
        return jsonify({
            'success': True,
            'data': {
                'total_expenses': len(expenses),
                'total_amount': round(total_amount, 2),
                'categories': categories,
                'recent_expenses': recent_expenses_data
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to calculate statistics',
            'message': str(e)
        }), 500

@main.route('/api/categorize', methods=['POST'])
@login_required
def categorize_expense():
    """AI-powered expense categorization"""
    try:
        data = request.get_json()
        
        if not data or 'item' not in data:
            return jsonify({
                'success': False,
                'error': 'Item name is required'
            }), 400
        
        item_name = data['item']
        amount = data.get('amount')
        
        # Get AI categorizer
        categorizer = get_ai_categorizer()
        
        if not categorizer:
            return jsonify({
                'success': False,
                'error': 'AI categorization not available. Please set GEMINI_API_KEY environment variable.'
            }), 503
        
        # Categorize the expense
        result = categorizer.categorize_expense(item_name, amount)
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Categorization failed',
            'message': str(e)
        }), 500

@main.route('/api/categorize/suggestions', methods=['POST'])
@login_required
def get_category_suggestions():
    """Get multiple category suggestions for an expense"""
    try:
        data = request.get_json()
        
        if not data or 'item' not in data:
            return jsonify({
                'success': False,
                'error': 'Item name is required'
            }), 400
        
        item_name = data['item']
        
        # Get AI categorizer
        categorizer = get_ai_categorizer()
        
        if not categorizer:
            return jsonify({
                'success': False,
                'error': 'AI categorization not available. Please set GEMINI_API_KEY environment variable.'
            }), 503
        
        # Get suggestions
        suggestions = categorizer.get_suggested_categories(item_name)
        
        return jsonify({
            'success': True,
            'data': suggestions
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to get suggestions',
            'message': str(e)
        }), 500

def filter_expenses_by_period(expenses, period):
    """Filter expenses based on time period"""
    from datetime import datetime, timedelta
    
    now = datetime.now()
    
    if period == 'week':
        # Last 7 days
        week_ago = now - timedelta(days=7)
        cutoff_date = week_ago.strftime('%Y-%m-%d')
    elif period == 'month':
        # Last 30 days
        month_ago = now - timedelta(days=30)
        cutoff_date = month_ago.strftime('%Y-%m-%d')
    elif period == 'year':
        # Last 365 days
        year_ago = now - timedelta(days=365)
        cutoff_date = year_ago.strftime('%Y-%m-%d')
    else:
        # Default to week
        week_ago = now - timedelta(days=7)
        cutoff_date = week_ago.strftime('%Y-%m-%d')
    
    return [expense for expense in expenses if expense['date'] >= cutoff_date]

def get_week_key(date_str):
    """Get week key in YYYY-WW format"""
    from datetime import datetime
    
    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
    year, week, _ = date_obj.isocalendar()
    return f"{year}-W{week:02d}"

@main.route('/api/visualization/data', methods=['GET'])
@login_required
def get_visualization_data():
    """Get data for charts and visualizations for current user"""
    try:
        # Get time period from query params
        period = request.args.get('period', 'month')
        if period not in ['week', 'month', 'year']:
            period = 'month'
        
        expenses = Expense.query.filter_by(user_id=current_user.id).all()
        expenses_data = [{'id': e.id, 'item': e.item, 'category': e.category, 
                         'amount': e.amount, 'date': e.date.strftime('%Y-%m-%d')} for e in expenses]
        
        if not expenses_data:
            # Get current budget even if no expenses
            current_month = datetime.now().strftime('%Y-%m')
            budget = Budget.query.filter_by(user_id=current_user.id, month=current_month).first()
            budget_data = budget.to_dict() if budget else None
            
            return jsonify({
                'success': True,
                'data': {
                    'pie_chart': [],
                    'trends': [],
                    'category_breakdown': {},
                    'total_amount': 0,
                    'period': period,
                    'budget': budget_data
                }
            })
        
        # Filter expenses based on time period
        filtered_expenses = filter_expenses_by_period(expenses_data, period)
        
        if not filtered_expenses:
            # Get current budget even if no filtered expenses
            current_month = datetime.now().strftime('%Y-%m')
            budget = Budget.query.filter_by(user_id=current_user.id, month=current_month).first()
            budget_data = budget.to_dict() if budget else None
            
            return jsonify({
                'success': True,
                'data': {
                    'pie_chart': [],
                    'trends': [],
                    'category_breakdown': {},
                    'total_amount': 0,
                    'period': period,
                    'budget': budget_data
                }
            })
        
        # Calculate pie chart data
        pie_data = {}
        trends_data = {}
        total_amount = 0
        
        for expense in filtered_expenses:
            category = expense['category']
            amount = float(expense['amount'])
            date = expense['date']
            
            # Pie chart data
            if category not in pie_data:
                pie_data[category] = 0
            pie_data[category] += amount
            
            # Trends data based on period - more granular data
            if period == 'week':
                # Group by day for weekly view (YYYY-MM-DD format)
                day_key = date
                if day_key not in trends_data:
                    trends_data[day_key] = 0
                trends_data[day_key] += amount
            elif period == 'month':
                # Group by day for monthly view (YYYY-MM-DD format)
                day_key = date
                if day_key not in trends_data:
                    trends_data[day_key] = 0
                trends_data[day_key] += amount
            elif period == 'year':
                # Group by month for yearly view (YYYY-MM format)
                month_key = date[:7]
                if month_key not in trends_data:
                    trends_data[month_key] = 0
                trends_data[month_key] += amount
            
            total_amount += amount
        
        # Format pie chart data for Chart.js
        pie_chart_data = []
        colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
            '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF'
        ]
        
        for i, (category, amount) in enumerate(pie_data.items()):
            pie_chart_data.append({
                'label': category,
                'value': round(amount, 2),
                'percentage': round((amount / total_amount) * 100, 1) if total_amount > 0 else 0,
                'color': colors[i % len(colors)]
            })
        
        # Format trends data with proper labels and fill missing periods
        trends = []
        
        if period == 'week' or period == 'month':
            # For daily data, fill in missing days
            from datetime import datetime, timedelta
            
            if period == 'week':
                # Get last 7 days
                end_date = datetime.now()
                start_date = end_date - timedelta(days=6)
            else:  # month
                # Get last 30 days
                end_date = datetime.now()
                start_date = end_date - timedelta(days=29)
            
            current_date = start_date
            while current_date <= end_date:
                date_str = current_date.strftime('%Y-%m-%d')
                amount = trends_data.get(date_str, 0)
                
                # Format label for display
                if period == 'week':
                    label = current_date.strftime('%a %d')  # Mon 25
                else:  # month
                    label = current_date.strftime('%d')  # 25
                
                trends.append({
                    'period': date_str,
                    'label': label,
                    'amount': round(amount, 2)
                })
                current_date += timedelta(days=1)
                
        elif period == 'year':
            # For monthly data, fill in missing months
            from datetime import datetime
            
            current_year = datetime.now().year
            for month in range(1, 13):
                month_key = f"{current_year}-{month:02d}"
                amount = trends_data.get(month_key, 0)
                
                # Format label for display
                month_name = datetime(current_year, month, 1).strftime('%b')  # Jan, Feb, etc.
                
                trends.append({
                    'period': month_key,
                    'label': month_name,
                    'amount': round(amount, 2)
                })
        
        # Get current budget for threshold line
        current_month = datetime.now().strftime('%Y-%m')
        budget = Budget.query.filter_by(user_id=current_user.id, month=current_month).first()
        budget_data = budget.to_dict() if budget else None
        
        return jsonify({
            'success': True,
            'data': {
                'pie_chart': pie_chart_data,
                'trends': trends,
                'category_breakdown': pie_data,
                'total_amount': round(total_amount, 2),
                'period': period,
                'budget': budget_data
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to generate visualization data',
            'message': str(e)
        }), 500

@main.route('/api/insights', methods=['GET'])
@login_required
def get_insights():
    """Get AI-powered financial insights for current user"""
    try:
        # Get time period from query params
        period = request.args.get('period', 'week')
        if period not in ['week', 'month', 'all']:
            period = 'week'
        
        # Load expenses
        expenses = Expense.query.filter_by(user_id=current_user.id).all()
        expenses_data = [{'id': e.id, 'item': e.item, 'category': e.category, 
                         'amount': e.amount, 'date': e.date.strftime('%Y-%m-%d')} for e in expenses]
        
        # Get AI insights generator
        insights_generator = get_ai_insights()
        
        if not insights_generator:
            return jsonify({
                'success': False,
                'error': 'AI insights not available. Please set GEMINI_API_KEY environment variable.'
            }), 503
        
        # Generate insights
        insights_data = insights_generator.generate_insights(expenses_data, period)
        
        return jsonify({
            'success': True,
            'data': insights_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to generate insights',
            'message': str(e)
        }), 500

@main.route('/api/insights/trends', methods=['GET'])
@login_required
def get_spending_trends():
    """Get spending trend analysis for current user"""
    try:
        # Get days parameter
        days = int(request.args.get('days', 30))
        
        # Load expenses
        expenses = Expense.query.filter_by(user_id=current_user.id).all()
        expenses_data = [{'id': e.id, 'item': e.item, 'category': e.category, 
                         'amount': e.amount, 'date': e.date.strftime('%Y-%m-%d')} for e in expenses]
        
        # Get AI insights generator
        insights_generator = get_ai_insights()
        
        if not insights_generator:
            return jsonify({
                'success': False,
                'error': 'AI insights not available. Please set GEMINI_API_KEY environment variable.'
            }), 503
        
        # Generate trends
        trends_data = insights_generator.get_spending_trends(expenses_data, days)
        
        return jsonify({
            'success': True,
            'data': trends_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to generate trends',
            'message': str(e)
        }), 500

@main.route('/api/budget', methods=['GET'])
@login_required
def get_budget():
    """Get current budget settings for current user"""
    try:
        # Get current month budget
        current_month = datetime.now().strftime('%Y-%m')
        budget = Budget.query.filter_by(user_id=current_user.id, month=current_month).first()
        
        if not budget:
            return jsonify({
                'success': True,
                'data': None
            })
        
        return jsonify({
            'success': True,
            'data': budget.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to get budget',
            'message': str(e)
        }), 500

@main.route('/api/budget', methods=['POST'])
@login_required
def set_budget():
    """Set monthly budget for current user"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Validate required fields
        if 'amount' not in data or 'alert_threshold' not in data:
            return jsonify({
                'success': False,
                'error': 'Missing required fields: amount and alert_threshold'
            }), 400
        
        amount = float(data['amount'])
        alert_threshold = int(data['alert_threshold'])
        
        if amount <= 0:
            return jsonify({
                'success': False,
                'error': 'Budget amount must be greater than 0'
            }), 400
        
        if alert_threshold < 50 or alert_threshold > 100:
            return jsonify({
                'success': False,
                'error': 'Alert threshold must be between 50% and 100%'
            }), 400
        
        # Get or create budget for current month
        current_month = datetime.now().strftime('%Y-%m')
        budget = Budget.query.filter_by(user_id=current_user.id, month=current_month).first()
        
        if budget:
            # Update existing budget
            budget.amount = amount
            budget.alert_threshold = alert_threshold
        else:
            # Create new budget
            budget = Budget(
                user_id=current_user.id,
                month=current_month,
                amount=amount,
                alert_threshold=alert_threshold
            )
            db.session.add(budget)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': budget.to_dict(),
            'message': 'Budget set successfully'
        })
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': 'Invalid data format',
            'message': str(e)
        }), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Failed to set budget',
            'message': str(e)
        }), 500

@main.route('/api/budget/status', methods=['GET'])
@login_required
def get_budget_status():
    """Get budget status with current spending for current user"""
    try:
        # Get current month budget
        current_month = datetime.now().strftime('%Y-%m')
        budget = Budget.query.filter_by(user_id=current_user.id, month=current_month).first()
        
        if not budget:
            return jsonify({
                'success': True,
                'data': {
                    'budget_set': False,
                    'message': 'No budget set'
                }
            })
        
        # Get current month's expenses
        from sqlalchemy import extract
        current_year = datetime.now().year
        current_month_num = datetime.now().month
        
        monthly_expenses = Expense.query.filter(
            Expense.user_id == current_user.id,
            extract('year', Expense.date) == current_year,
            extract('month', Expense.date) == current_month_num
        ).all()
        
        total_spent = sum(expense.amount for expense in monthly_expenses)
        budget_amount = budget.amount
        alert_threshold = budget.alert_threshold
        
        # Calculate percentages
        spent_percentage = (total_spent / budget_amount) * 100 if budget_amount > 0 else 0
        remaining_amount = budget_amount - total_spent
        remaining_percentage = 100 - spent_percentage
        
        # Determine status
        status = 'safe'
        if spent_percentage >= 100:
            status = 'exceeded'
        elif spent_percentage >= alert_threshold:
            status = 'warning'
        
        # Generate alerts
        alerts = []
        if spent_percentage >= 100:
            alerts.append({
                'type': 'danger',
                'message': f'Budget exceeded! You have spent Rs. {total_spent:.2f} out of Rs. {budget_amount:.2f}',
                'icon': 'bi-exclamation-triangle-fill'
            })
        elif spent_percentage >= alert_threshold:
            alerts.append({
                'type': 'warning',
                'message': f'Budget alert! You have spent {spent_percentage:.1f}% of your budget (Rs. {total_spent:.2f} out of Rs. {budget_amount:.2f})',
                'icon': 'bi-exclamation-triangle'
            })
        
        return jsonify({
            'success': True,
            'data': {
                'budget_set': True,
                'budget_amount': budget_amount,
                'total_spent': total_spent,
                'remaining_amount': remaining_amount,
                'spent_percentage': spent_percentage,
                'remaining_percentage': remaining_percentage,
                'alert_threshold': alert_threshold,
                'status': status,
                'alerts': alerts,
                'month': current_month
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to get budget status',
            'message': str(e)
        }), 500

@main.route('/api/receipt/scan', methods=['POST'])
@login_required
def scan_receipt():
    """
    Scan receipt image using Google Gemini Vision API
    Extracts: merchant, amount, date, category, items
    """
    try:
        # Check if file was uploaded
        if 'receipt' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No receipt image uploaded'
            }), 400
        
        file = request.files['receipt']
        
        # Validate file
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Check file type
        allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'}
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if file_ext not in allowed_extensions:
            return jsonify({
                'success': False,
                'error': 'Invalid file type. Please upload an image file (PNG, JPG, etc.)'
            }), 400
        
        # Check file size (max 10MB)
        file.seek(0, 2)  # Seek to end
        file_size = file.tell()
        file.seek(0)  # Reset to beginning
        
        if file_size > 10 * 1024 * 1024:
            return jsonify({
                'success': False,
                'error': 'File too large. Maximum size is 10MB'
            }), 400
        
        # Read image data
        image_data = file.read()
        
        # Check if Gemini API is available
        gemini_api_key = os.getenv('GEMINI_API_KEY')
        if not gemini_api_key:
            return jsonify({
                'success': False,
                'error': 'Gemini API not configured. Please add GEMINI_API_KEY to environment variables.'
            }), 500
        
        # Import and configure Gemini
        import google.generativeai as genai
        from PIL import Image
        import io
        
        genai.configure(api_key=gemini_api_key)
        
        # Create image from bytes
        image = Image.open(io.BytesIO(image_data))
        
        # Create model
        model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Create prompt for receipt analysis
        prompt = """
        Analyze this receipt image and extract the following information in JSON format:

        1. merchant: The store/merchant name (string)
        2. amount: The total amount paid (number only, no currency symbols)
        3. date: The date of purchase in YYYY-MM-DD format
        4. category: The most appropriate category from these options:
           - Food & Dining (restaurants, cafes, groceries)
           - Transportation (gas, uber, parking, public transit)
           - Shopping (retail, clothing, electronics)
           - Entertainment (movies, games, events)
           - Bills & Utilities (electricity, water, internet, phone)
           - Healthcare (medical, pharmacy, fitness)
           - Education (books, courses, tuition)
           - Others (anything else)
        5. items: Array of individual items purchased with their prices (if visible)
           Format each item as "ItemName - $Price" or just "ItemName" if price not visible
        6. confidence: Your confidence level in the extraction (high/medium/low)

        Return ONLY valid JSON in this exact format:
        {
            "merchant": "Store Name",
            "amount": "0.00",
            "date": "YYYY-MM-DD",
            "category": "Category Name",
            "items": ["item1 - 10.50", "item2 - 5.25"],
            "confidence": "high"
        }

        IMPORTANT:
        - Extract ALL visible items from the receipt, not just the first one
        - If individual item prices are visible, include them with each item
        - If you cannot read certain fields, use empty strings for text fields, "0.00" for amount, today's date for date, and "Others" for category
        - Be accurate and extract exactly what you see on the receipt
        """
        
        # Generate content
        response = model.generate_content([prompt, image])
        response_text = response.text.strip()
        
        # Parse JSON response
        import json
        import re
        
        # Try to extract JSON from response
        json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
        if json_match:
            json_str = json_match.group(0)
            parsed_data = json.loads(json_str)
        else:
            # If no JSON found, create fallback response
            parsed_data = {
                'merchant': '',
                'amount': '0.00',
                'date': datetime.now().strftime('%Y-%m-%d'),
                'category': 'Others',
                'items': [],
                'confidence': 'low'
            }
        
        # Validate and clean data
        if 'amount' in parsed_data:
            # Remove currency symbols and clean amount
            amount_str = str(parsed_data['amount'])
            amount_str = re.sub(r'[^\d.]', '', amount_str)
            parsed_data['amount'] = amount_str if amount_str else '0.00'
        
        if 'date' in parsed_data:
            # Validate date format
            try:
                datetime.strptime(parsed_data['date'], '%Y-%m-%d')
            except:
                parsed_data['date'] = datetime.now().strftime('%Y-%m-%d')
        
        # Ensure category is valid
        valid_categories = [
            'Food & Dining', 'Transportation', 'Shopping', 'Entertainment',
            'Bills & Utilities', 'Healthcare', 'Education', 'Others'
        ]
        if 'category' not in parsed_data or parsed_data['category'] not in valid_categories:
            parsed_data['category'] = 'Others'
        
        # Use merchant name as item if no items found
        if 'items' not in parsed_data or not parsed_data['items']:
            if 'merchant' in parsed_data and parsed_data['merchant']:
                parsed_data['items'] = [parsed_data['merchant']]
            else:
                parsed_data['items'] = ['Receipt Item']
        
        return jsonify({
            'success': True,
            'data': parsed_data,
            'message': 'Receipt scanned successfully'
        })
        
    except json.JSONDecodeError as e:
        return jsonify({
            'success': False,
            'error': 'Failed to parse receipt data',
            'message': f'Could not understand the receipt format. Please try a clearer image.'
        }), 500
    
    except Exception as e:
        print(f"Receipt scan error: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to scan receipt',
            'message': str(e)
        }), 500


