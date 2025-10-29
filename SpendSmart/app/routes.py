from flask import Blueprint, render_template, request, jsonify
import json
import os
from datetime import datetime
import re
from app.ai_categorizer import AICategorizer
from app.ai_insights import AIInsightsGenerator

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

@main.route('/')
def index():
    """Render the main page"""
    return render_template('index.html')

@main.route('/favicon.ico')
def favicon():
    """Handle favicon requests"""
    return '', 204  # No content

@main.route('/api/expenses', methods=['GET'])
def get_expenses():
    """Get all expenses"""
    try:
        expenses = load_expenses()
        return jsonify({
            'success': True,
            'data': expenses,
            'count': len(expenses)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to load expenses',
            'message': str(e)
        }), 500

@main.route('/api/expenses', methods=['POST'])
def add_expense():
    """Add a new expense"""
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
        
        # Load existing expenses
        expenses = load_expenses()
        
        # Create new expense with unique ID
        new_expense = {
            'id': get_next_id(expenses),
            'item': data['item'].strip(),
            'category': data['category'],
            'amount': float(data['amount']),
            'date': data['date'],
            'created_at': datetime.now().isoformat()
        }
        
        expenses.append(new_expense)
        
        # Save expenses
        if not save_expenses(expenses):
            return jsonify({
                'success': False,
                'error': 'Failed to save expense'
            }), 500
        
        return jsonify({
            'success': True,
            'data': new_expense,
            'message': 'Expense added successfully'
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@main.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    """Delete an expense"""
    try:
        expenses = load_expenses()
        
        # Check if expense exists
        expense_to_delete = next((e for e in expenses if e['id'] == expense_id), None)
        if not expense_to_delete:
            return jsonify({
                'success': False,
                'error': 'Expense not found'
            }), 404
        
        # Remove expense
        expenses = [e for e in expenses if e['id'] != expense_id]
        
        # Save updated expenses
        if not save_expenses(expenses):
            return jsonify({
                'success': False,
                'error': 'Failed to save changes'
            }), 500
        
        return jsonify({
            'success': True,
            'message': 'Expense deleted successfully',
            'deleted_id': expense_id
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@main.route('/api/expenses/<int:expense_id>', methods=['PUT'])
def update_expense(expense_id):
    """Update an expense"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        expenses = load_expenses()
        
        # Find expense to update
        expense_to_update = next((e for e in expenses if e['id'] == expense_id), None)
        if not expense_to_update:
            return jsonify({
                'success': False,
                'error': 'Expense not found'
            }), 404
        
        # Validate data if provided
        if any(field in data for field in ['item', 'category', 'amount', 'date']):
            # Create a copy for validation
            validation_data = expense_to_update.copy()
            validation_data.update(data)
            
            validation_errors = validate_expense_data(validation_data)
            if validation_errors:
                return jsonify({
                    'success': False,
                    'error': 'Validation failed',
                    'details': validation_errors
                }), 400
        
        # Update expense fields
        if 'item' in data:
            expense_to_update['item'] = data['item'].strip()
        if 'category' in data:
            expense_to_update['category'] = data['category']
        if 'amount' in data:
            expense_to_update['amount'] = float(data['amount'])
        if 'date' in data:
            expense_to_update['date'] = data['date']
        
        # Update timestamp
        expense_to_update['updated_at'] = datetime.now().isoformat()
        
        # Save updated expenses
        if not save_expenses(expenses):
            return jsonify({
                'success': False,
                'error': 'Failed to save changes'
            }), 500
        
        return jsonify({
            'success': True,
            'data': expense_to_update,
            'message': 'Expense updated successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': str(e)
        }), 500

@main.route('/api/expenses/<int:expense_id>', methods=['GET'])
def get_expense(expense_id):
    """Get a specific expense by ID"""
    try:
        expenses = load_expenses()
        expense = next((e for e in expenses if e['id'] == expense_id), None)
        
        if not expense:
            return jsonify({
                'success': False,
                'error': 'Expense not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': expense
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
def get_statistics():
    """Get expense statistics"""
    try:
        expenses = load_expenses()
        
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
        total_amount = sum(expense['amount'] for expense in expenses)
        
        # Category breakdown
        categories = {}
        for expense in expenses:
            category = expense['category']
            if category not in categories:
                categories[category] = {'count': 0, 'amount': 0.0}
            categories[category]['count'] += 1
            categories[category]['amount'] += expense['amount']
        
        # Recent expenses (last 5)
        recent_expenses = sorted(expenses, key=lambda x: x['date'], reverse=True)[:5]
        
        return jsonify({
            'success': True,
            'data': {
                'total_expenses': len(expenses),
                'total_amount': round(total_amount, 2),
                'categories': categories,
                'recent_expenses': recent_expenses
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to calculate statistics',
            'message': str(e)
        }), 500

@main.route('/api/categorize', methods=['POST'])
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
def get_visualization_data():
    """Get data for charts and visualizations"""
    try:
        # Get time period from query params
        period = request.args.get('period', 'month')
        if period not in ['week', 'month', 'year']:
            period = 'month'
        
        expenses = load_expenses()
        
        if not expenses:
            return jsonify({
                'success': True,
                'data': {
                    'pie_chart': [],
                    'trends': [],
                    'category_breakdown': {},
                    'total_amount': 0,
                    'period': period
                }
            })
        
        # Filter expenses based on time period
        filtered_expenses = filter_expenses_by_period(expenses, period)
        
        if not filtered_expenses:
            return jsonify({
                'success': True,
                'data': {
                    'pie_chart': [],
                    'trends': [],
                    'category_breakdown': {},
                    'total_amount': 0,
                    'period': period
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
        
        return jsonify({
            'success': True,
            'data': {
                'pie_chart': pie_chart_data,
                'trends': trends,
                'category_breakdown': pie_data,
                'total_amount': round(total_amount, 2),
                'period': period
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to generate visualization data',
            'message': str(e)
        }), 500

@main.route('/api/insights', methods=['GET'])
def get_insights():
    """Get AI-powered financial insights"""
    try:
        # Get time period from query params
        period = request.args.get('period', 'week')
        if period not in ['week', 'month', 'all']:
            period = 'week'
        
        # Load expenses
        expenses = load_expenses()
        
        # Get AI insights generator
        insights_generator = get_ai_insights()
        
        if not insights_generator:
            return jsonify({
                'success': False,
                'error': 'AI insights not available. Please set GEMINI_API_KEY environment variable.'
            }), 503
        
        # Generate insights
        insights_data = insights_generator.generate_insights(expenses, period)
        
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
def get_spending_trends():
    """Get spending trend analysis"""
    try:
        # Get days parameter
        days = int(request.args.get('days', 30))
        
        # Load expenses
        expenses = load_expenses()
        
        # Get AI insights generator
        insights_generator = get_ai_insights()
        
        if not insights_generator:
            return jsonify({
                'success': False,
                'error': 'AI insights not available. Please set GEMINI_API_KEY environment variable.'
            }), 503
        
        # Generate trends
        trends_data = insights_generator.get_spending_trends(expenses, days)
        
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
def get_budget():
    """Get current budget settings"""
    try:
        budget_data = load_budget()
        
        if not budget_data:
            return jsonify({
                'success': True,
                'data': None
            })
        
        return jsonify({
            'success': True,
            'data': budget_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to get budget',
            'message': str(e)
        }), 500

@main.route('/api/budget', methods=['POST'])
def set_budget():
    """Set monthly budget"""
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
        
        # Create budget data
        budget_data = {
            'amount': amount,
            'alert_threshold': alert_threshold,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Save budget
        save_budget(budget_data)
        
        return jsonify({
            'success': True,
            'data': budget_data,
            'message': 'Budget set successfully'
        })
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': 'Invalid data format',
            'message': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': 'Failed to set budget',
            'message': str(e)
        }), 500

@main.route('/api/budget/status', methods=['GET'])
def get_budget_status():
    """Get budget status with current spending"""
    try:
        budget_data = load_budget()
        
        if not budget_data:
            return jsonify({
                'success': True,
                'data': {
                    'budget_set': False,
                    'message': 'No budget set'
                }
            })
        
        # Get current month's expenses
        expenses = load_expenses()
        current_month = datetime.now().strftime('%Y-%m')
        
        monthly_expenses = [
            expense for expense in expenses 
            if expense['date'].startswith(current_month)
        ]
        
        total_spent = sum(float(expense['amount']) for expense in monthly_expenses)
        budget_amount = budget_data['amount']
        alert_threshold = budget_data['alert_threshold']
        
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

def load_budget():
    """Load budget data from file"""
    try:
        with open('budget_data.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return None
    except Exception as e:
        print(f"Error loading budget: {e}")
        return None

def save_budget(budget_data):
    """Save budget data to file"""
    try:
        with open('budget_data.json', 'w') as f:
            json.dump(budget_data, f, indent=2)
    except Exception as e:
        print(f"Error saving budget: {e}")
        raise e
