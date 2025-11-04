"""
Email service for sending budget alerts and notifications
"""
from flask_mail import Mail, Message
from flask import current_app
import os

mail = Mail()

def init_mail(app):
    """Initialize Flask-Mail with app configuration"""
    # Email server configuration
    app.config['MAIL_SERVER'] = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    app.config['MAIL_PORT'] = int(os.environ.get('MAIL_PORT', 587))
    app.config['MAIL_USE_TLS'] = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
    app.config['MAIL_USE_SSL'] = os.environ.get('MAIL_USE_SSL', 'false').lower() == 'true'
    app.config['MAIL_USERNAME'] = os.environ.get('MAIL_USERNAME')
    app.config['MAIL_PASSWORD'] = os.environ.get('MAIL_PASSWORD')
    app.config['MAIL_DEFAULT_SENDER'] = os.environ.get('MAIL_DEFAULT_SENDER', os.environ.get('MAIL_USERNAME'))
    
    mail.init_app(app)
    return mail

def send_budget_exceeded_email(user_email, user_name, budget_amount, total_spent, month):
    """
    Send email notification when budget is exceeded
    
    Args:
        user_email: User's email address
        user_name: User's full name
        budget_amount: The set budget amount
        total_spent: Total amount spent
        month: The budget month (YYYY-MM)
    """
    try:
        exceeded_by = total_spent - budget_amount
        percentage = (total_spent / budget_amount) * 100 if budget_amount > 0 else 0
        
        subject = f"⚠️ Budget Alert: You've Exceeded Your {month} Budget"
        
        # Resolve base URL for links in emails
        base_url = os.environ.get('APP_BASE_URL') or current_app.config.get('APP_BASE_URL') or 'http://localhost:5000'

        # HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .header h1 {{
                    margin: 0;
                    font-size: 28px;
                }}
                .content {{
                    background: white;
                    padding: 30px;
                    border: 1px solid #e0e0e0;
                    border-top: none;
                }}
                .alert-box {{
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .stats {{
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }}
                .stat-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #dee2e6;
                }}
                .stat-row:last-child {{
                    border-bottom: none;
                }}
                .stat-label {{
                    font-weight: 600;
                    color: #666;
                }}
                .stat-value {{
                    font-weight: 700;
                    color: #333;
                }}
                .exceeded {{
                    color: #dc3545;
                    font-size: 18px;
                }}
                .cta-button {{
                    display: inline-block;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 12px 30px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                    font-weight: 600;
                }}
                .footer {{
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-size: 12px;
                    background: #f8f9fa;
                    border-radius: 0 0 10px 10px;
                }}
                .tips {{
                    background: #e7f3ff;
                    border-left: 4px solid #0066cc;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .tips h3 {{
                    margin-top: 0;
                    color: #0066cc;
                }}
                .tips ul {{
                    margin: 10px 0;
                    padding-left: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>⚠️ Budget Alert</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">SpendSmart Budget Notification</p>
            </div>
            
            <div class="content">
                <h2>Hi {user_name},</h2>
                
                <div class="alert-box">
                    <strong>⚠️ Budget Exceeded!</strong><br>
                    You have exceeded your monthly budget for {month}.
                </div>
                
                <div class="stats">
                    <div class="stat-row">
                        <span class="stat-label">Budget Set:</span>
                        <span class="stat-value">Rs. {budget_amount:,.2f}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Total Spent:</span>
                        <span class="stat-value exceeded">Rs. {total_spent:,.2f}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Exceeded By:</span>
                        <span class="stat-value exceeded">Rs. {exceeded_by:,.2f}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Budget Usage:</span>
                        <span class="stat-value exceeded">{percentage:.1f}%</span>
                    </div>
                </div>
                
                <div class="tips">
                    <h3>💡 Tips to Get Back on Track:</h3>
                    <ul>
                        <li>Review your recent expenses and identify areas to cut back</li>
                        <li>Set up spending alerts to track your expenses more closely</li>
                        <li>Consider adjusting your budget for next month based on your spending patterns</li>
                        <li>Use the Insights feature to analyze your spending categories</li>
                    </ul>
                </div>
                
                <p style="text-align: center;">
                    <a href="{base_url}/dashboard" class="cta-button">View Dashboard</a>
                </p>
                
                <p style="margin-top: 30px; color: #666;">
                    This is an automated alert from SpendSmart to help you stay on top of your finances.
                </p>
            </div>
            
            <div class="footer">
                <p><strong>SpendSmart</strong> - Intelligent Expense Tracker</p>
                <p>This email was sent to {user_email}</p>
                <p style="margin-top: 10px; font-size: 11px;">
                    You're receiving this because you exceeded your budget threshold.<br>
                    You can adjust your notification settings in your profile.
                </p>
            </div>
        </body>
        </html>
        """
        
        # Plain text alternative
        text_body = f"""
Budget Alert - SpendSmart

Hi {user_name},

⚠️ BUDGET EXCEEDED!

You have exceeded your monthly budget for {month}.

Budget Summary:
- Budget Set: Rs. {budget_amount:,.2f}
- Total Spent: Rs. {total_spent:,.2f}
- Exceeded By: Rs. {exceeded_by:,.2f}
- Budget Usage: {percentage:.1f}%

Tips to Get Back on Track:
• Review your recent expenses and identify areas to cut back
• Set up spending alerts to track your expenses more closely
• Consider adjusting your budget for next month
• Use the Insights feature to analyze your spending

Visit your dashboard: {base_url}/dashboard

---
SpendSmart - Intelligent Expense Tracker
This email was sent to {user_email}
        """
        
        msg = Message(
            subject=subject,
            recipients=[user_email],
            body=text_body,
            html=html_body
        )
        
        print(f"📧 Attempting to send exceeded email to {user_email}...")
        mail.send(msg)
        print(f"✓ Budget exceeded email sent successfully to {user_email}")
        return True
        
    except Exception as e:
        print(f"✗ Error sending exceeded email to {user_email}: {e}")
        import traceback
        traceback.print_exc()
        return False

def send_budget_warning_email(user_email, user_name, budget_amount, total_spent, threshold_percentage, month):
    """
    Send warning email when approaching budget threshold
    
    Args:
        user_email: User's email address
        user_name: User's full name
        budget_amount: The set budget amount
        total_spent: Total amount spent
        threshold_percentage: The alert threshold percentage
        month: The budget month (YYYY-MM)
    """
    try:
        remaining = budget_amount - total_spent
        percentage = (total_spent / budget_amount) * 100 if budget_amount > 0 else 0
        
        subject = f"⚠️ Budget Warning: {percentage:.0f}% of Your {month} Budget Used"
        
        base_url = os.environ.get('APP_BASE_URL') or current_app.config.get('APP_BASE_URL') or 'http://localhost:5000'

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px 10px 0 0;
                }}
                .content {{
                    background: white;
                    padding: 30px;
                    border: 1px solid #e0e0e0;
                    border-top: none;
                }}
                .warning-box {{
                    background: #fff3cd;
                    border-left: 4px solid #ffc107;
                    padding: 15px;
                    margin: 20px 0;
                    border-radius: 4px;
                }}
                .stats {{
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                }}
                .stat-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #dee2e6;
                }}
                .progress-bar {{
                    width: 100%;
                    height: 20px;
                    background: #e9ecef;
                    border-radius: 10px;
                    overflow: hidden;
                    margin: 15px 0;
                }}
                .progress-fill {{
                    height: 100%;
                    background: linear-gradient(90deg, #ffc107 0%, #ff9800 100%);
                    width: {percentage}%;
                    transition: width 0.3s;
                }}
                .footer {{
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-size: 12px;
                    background: #f8f9fa;
                    border-radius: 0 0 10px 10px;
                }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>⚠️ Budget Warning</h1>
                <p style="margin: 10px 0 0 0;">You're approaching your budget limit</p>
            </div>
            
            <div class="content">
                <h2>Hi {user_name},</h2>
                
                <div class="warning-box">
                    <strong>Budget Alert!</strong><br>
                    You've reached {percentage:.1f}% of your budget for {month}.
                </div>
                
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                </div>
                
                <div class="stats">
                    <div class="stat-row">
                        <span>Budget Set:</span>
                        <strong>Rs. {budget_amount:,.2f}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Spent So Far:</span>
                        <strong style="color: #ff9800;">Rs. {total_spent:,.2f}</strong>
                    </div>
                    <div class="stat-row">
                        <span>Remaining:</span>
                        <strong style="color: #28a745;">Rs. {remaining:,.2f}</strong>
                    </div>
                </div>
                
                <p>Consider reviewing your spending to stay within budget for the rest of the month.</p>
                
                <p style="text-align: center; margin-top: 30px;">
                    <a href="{base_url}/dashboard" 
                       style="display: inline-block; background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); 
                              color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: 600;">
                        Review Budget
                    </a>
                </p>
            </div>
            
            <div class="footer">
                <p><strong>SpendSmart</strong> - Intelligent Expense Tracker</p>
                <p>This email was sent to {user_email}</p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
Budget Warning - SpendSmart

Hi {user_name},

⚠️ BUDGET ALERT!

You've reached {percentage:.1f}% of your budget for {month}.

Budget Summary:
- Budget Set: Rs. {budget_amount:,.2f}
- Spent So Far: Rs. {total_spent:,.2f}
- Remaining: Rs. {remaining:,.2f}

Consider reviewing your spending to stay within budget.

Visit your dashboard: {base_url}/dashboard

---
SpendSmart - Intelligent Expense Tracker
        """
        
        msg = Message(
            subject=subject,
            recipients=[user_email],
            body=text_body,
            html=html_body
        )
        
        print(f"📧 Attempting to send warning email to {user_email}...")
        mail.send(msg)
        print(f"✓ Budget warning email sent successfully to {user_email}")
        return True
        
    except Exception as e:
        print(f"✗ Error sending warning email to {user_email}: {e}")
        import traceback
        traceback.print_exc()
        return False
