# 💰 SpendSmart - Complete Documentation

## Overview
SpendSmart is an intelligent expense tracking application with AI-powered categorization, budget management, email alerts, and comprehensive financial insights. Built with Flask, SQLAlchemy, and Google Gemini AI.

---

## 🚀 Quick Start

### Installation & Setup

1. **Clone and Navigate**
   ```bash
   cd SpendSmart
   ```

2. **Create Virtual Environment**
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1  # Windows
   source venv/bin/activate      # Mac/Linux
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment** (Create `.env` file)
   ```env
   # AI Features
   GEMINI_API_KEY=your-gemini-api-key-here
   
   # Email Alerts
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=true
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=your-app-password
   MAIL_DEFAULT_SENDER=your-email@gmail.com
   
   # Flask Config
   FLASK_ENV=development
   SECRET_KEY=your-secret-key-here
   ```

5. **Run Application**
   ```bash
   python run.py
   ```

6. **Access Application**
   - Open browser: `http://localhost:5000`
   - Register a new account
   - Start tracking expenses!

---

## 🔐 Authentication System

### Features
- ✅ User registration with validation
- ✅ Secure login/logout with Flask-Login
- ✅ Password hashing (Werkzeug)
- ✅ Session-based authentication
- ✅ User profile management
- ✅ Protected routes
- ✅ User-specific data isolation

### Database Schema

**Users Table:**
- `id` - Primary key
- `username` - Unique username (indexed)
- `email` - Unique email (indexed)
- `password_hash` - Hashed password
- `full_name` - User's full name
- `created_at` / `updated_at` - Timestamps

**Expenses Table:**
- `id` - Primary key
- `user_id` - Foreign key to users
- `item` - Expense name
- `category` - Expense category
- `amount` - Expense amount
- `date` - Expense date
- `created_at` / `updated_at` - Timestamps

**Budgets Table:**
- `id` - Primary key
- `user_id` - Foreign key to users
- `month` - Budget month (YYYY-MM)
- `amount` - Budget amount
- `alert_threshold` - Alert percentage (50-100)
- `warning_email_sent` - Email tracking flag
- `exceeded_email_sent` - Email tracking flag
- `created_at` / `updated_at` - Timestamps
- Unique constraint: (user_id, month)

### First-Time Setup
1. Navigate to registration page
2. Create account with:
   - Full Name
   - Username (3-20 characters)
   - Email address
   - Password (min 8 characters)
3. Login with credentials
4. Start tracking!

---

## 📧 Email Alert System

### Features
- ✅ Automatic budget warning emails (threshold-based)
- ✅ Automatic budget exceeded emails
- ✅ Beautiful HTML email templates
- ✅ Smart alert system (one email per threshold per month)
- ✅ Email tracking to prevent spam
- ✅ Works for all registered users

### Email Configuration

#### Gmail Setup (Recommended)
1. Enable 2-Step Verification in Google Account
2. Generate App Password:
   - Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password
3. Update `.env`:
   ```env
   MAIL_SERVER=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USE_TLS=true
   MAIL_USERNAME=your-email@gmail.com
   MAIL_PASSWORD=16-char-app-password
   ```

#### Other Providers
**Outlook:**
```env
MAIL_SERVER=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USE_TLS=true
```

**Yahoo:**
```env
MAIL_SERVER=smtp.mail.yahoo.com
MAIL_PORT=587
MAIL_USE_TLS=true
```

### How It Works
1. **Warning Email** - Sent when spending reaches alert threshold (e.g., 80%)
2. **Exceeded Email** - Sent when spending exceeds 100% of budget
3. **Smart Tracking** - Each email sent only once per month
4. **Automatic Checks** - Triggered when adding/updating expenses

### Testing Email Alerts
1. Set budget: Rs. 1000 with 80% threshold
2. Add expense: Rs. 850 → Warning email sent (85%)
3. Add expense: Rs. 200 → Exceeded email sent (105%)
4. Check your email inbox!

---

## 🤖 AI-Powered Features

### AI Categorization
- **Automatic categorization** using Google Gemini AI
- **Smart suggestions** with confidence scores
- **Fallback rule-based** categorization
- **Real-time categorization** as you type

#### How to Use:
1. Get Gemini API Key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env`: `GEMINI_API_KEY=your-key`
3. Click 🤖 button or type item name for auto-categorization

#### Examples:
- "pizza" → Food & Dining (95%)
- "uber ride" → Transportation (90%)
- "netflix" → Entertainment (85%)

### AI Financial Insights
- **Intelligent spending analysis** with personalized insights
- **Pattern recognition** and trend analysis
- **Actionable recommendations** for improvement
- **Multi-period analysis** (week/month/all time)

#### Insight Categories:
1. **📊 Key Insights** - Spending patterns
2. **🎯 Recommendations** - Actionable advice
3. **📈 Patterns** - Behavioral trends
4. **⚠️ Alerts** - Budget warnings

---

## 💰 Budget Management

### Features
- ✅ Monthly budget setting
- ✅ Configurable alert thresholds (50-100%)
- ✅ Real-time spending tracking
- ✅ Visual progress bars with status indicators
- ✅ Remaining budget calculations
- ✅ Email notifications

### Budget Status States

**Safe (Green):**
- Spending < Alert Threshold
- On track status
- No alerts

**Warning (Yellow):**
- Spending ≥ Alert Threshold
- Warning email sent
- Review spending recommendation

**Exceeded (Red):**
- Spending ≥ 100%
- Critical alert
- Immediate action required

### API Endpoints
```
GET  /api/budget        - Get current budget
POST /api/budget        - Set monthly budget
GET  /api/budget/status - Get budget status with spending
```

---

## 📷 Receipt Scanner (Gemini Vision + OCR)

Primary extraction uses Google Gemini Vision API with automatic fallback to Tesseract.js when the API is unavailable. This significantly improves accuracy and returns structured data ready to auto‑fill the expense form.

### Features

- ✅ Gemini Vision extraction of merchant, amount, date, and line items
- ✅ Automatic category suggestion with confidence
- ✅ Tesseract.js fallback if Vision API fails
- ✅ Auto-fill expense form with confidence badge
- ✅ Works with JPG/PNG receipts and mobile camera uploads

### How to Use

1. Click "Choose Receipt Image" and select a photo (or use your phone camera)
2. Preview appears
3. Click "Extract Text"
4. If Vision API succeeds, fields are auto-filled with structured data; otherwise OCR fallback runs
5. Review, adjust if needed, and submit

### API Endpoint

```http
POST /api/receipt/scan   (multipart/form-data, field: receipt)
```

Response (example):

```json
{
   "merchant": "Walmart",
   "amount": 42.83,
   "date": "2025-10-28",
   "category": "Groceries",
   "confidence": 0.91,
   "items": [
      { "name": "Milk", "qty": 1, "price": 4.99 },
      { "name": "Eggs", "qty": 1, "price": 3.49 }
   ]
}
```

Troubleshooting:

- Ensure `GEMINI_API_KEY` is set in `.env`
- Use well-lit photos; avoid heavy glare and extreme angles
- Large images are automatically resized; max size ~5MB
---

## 📊 Data Visualization

### Charts Implemented
1. **🍰 Spending Distribution (Pie Chart)**
   - Interactive doughnut chart
   - Color-coded categories
   - Percentage breakdowns
   - Hover tooltips

2. **📈 Monthly Trends (Line Chart)**
   - Dynamic spending trends
   - Smooth line with fill area
   - Point markers
   - Responsive design

### Features
- Real-time updates
- Interactive tooltips
- Responsive design
- Professional styling

---

## 🎨 Modern UI/UX Design

### Design System
**Colors:**
- Primary: #0d6efd (Blue)
- Success: #198754 (Green)
- Warning: #ffc107 (Yellow)
- Danger: #dc3545 (Red)
- Neutral: Grays

**Typography:**
- Font: Inter, system fonts
- Weights: 400-700
- Consistent hierarchy

**Layout:**
- Border Radius: 12px (cards), 8px (buttons)
- Shadows: Subtle with hover effects
- Spacing: Consistent padding/margins
- Transitions: 0.3s ease

### Key Components
- Modern navigation bar
- Statistics cards (Today/Week/Month/Total)
- Professional form design
- Clean data tables
- Responsive layout
- Touch-friendly mobile design

---

## 🔧 API Reference

### Expense Management
```
GET    /api/expenses           - Get all expenses
POST   /api/expenses           - Add new expense
PUT    /api/expenses/{id}      - Update expense
DELETE /api/expenses/{id}      - Delete expense
```

### AI Features
```
POST   /api/categorize         - AI categorization
POST   /api/categorize/suggestions - Get category suggestions
GET    /api/insights           - Get AI insights
GET    /api/insights?period=week - Get period insights
```

### Receipt Scanning
``` 
POST   /api/receipt/scan       - Parse receipt image (Gemini Vision + OCR fallback)
```

### Visualization
```
GET    /api/visualization/data?period=month - Get chart data
```

### Budget
```
GET    /api/budget             - Get current budget
POST   /api/budget             - Set budget
GET    /api/budget/status      - Get budget status
```

---

## 🛠️ Troubleshooting

### Port Already in Use
```python
# Edit run.py
app.run(debug=True, port=5001)  # Change port
```

### Virtual Environment Issues
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Email Not Sending
1. Check `.env` credentials
2. Verify App Password (Gmail)
3. Check SMTP settings
4. Review terminal logs for errors

### AI Features Not Working
1. Verify `GEMINI_API_KEY` in `.env`
2. Check API key validity
3. Review API quota limits
4. Falls back to rule-based categorization

### Database Issues
- Database auto-creates on first run
- Located at: `instance/spendsmartusers.db`
- Backup database before major changes

---

## 📁 Project Structure

```
SpendSmart/
├── app/
│   ├── __init__.py           - Flask app initialization
│   ├── routes.py             - API endpoints & pages
│   ├── models.py             - Database models
│   ├── ai_categorizer.py     - AI categorization
│   ├── ai_insights.py        - AI insights generator
│   ├── email_service.py      - Email notifications
│   ├── static/               - CSS, JS, assets
│   └── templates/            - HTML templates
├── instance/
│   └── spendsmartusers.db   - SQLite database
├── docs/                     - Documentation
├── .env                      - Environment variables
├── requirements.txt          - Dependencies
└── run.py                    - Application entry point
```

---

## 🚦 Technology Stack

### Backend
- **Flask 3.0.0** - Web framework
- **Flask-SQLAlchemy 3.1.1** - ORM
- **Flask-Login 0.6.3** - Authentication
- **Flask-Mail 0.9.1** - Email notifications
- **Flask-Bcrypt 1.0.1** - Password hashing
- **Google Generative AI** - AI features

### Frontend
- **Bootstrap 5.3.0** - UI framework
- **Chart.js** - Data visualization
- **Tesseract.js** - OCR processing
- **Vanilla JavaScript** - Interactivity

### Database
- **SQLite** - Development database
- **SQLAlchemy ORM** - Database operations

---

## 🎯 Feature Checklist

✅ User authentication & registration  
✅ Session-based login/logout  
✅ User-specific data isolation  
✅ Expense CRUD operations  
✅ AI-powered categorization  
✅ Budget management  
✅ Email alert system  
✅ Receipt scanner (OCR)  
✅ Data visualization (charts)  
✅ AI financial insights  
✅ Responsive modern UI  
✅ Real-time updates  
✅ Progress tracking  
✅ Multi-period analysis  

---

## 📝 Usage Examples

### Adding an Expense
1. Fill item name: "Grocery Shopping"
2. Select category: "Food & Dining"
3. Enter amount: 45.99
4. Choose date: Today
5. Click "Add Expense"

### Setting a Budget
1. Go to Budget section
2. Enter amount: 5000
3. Set threshold: 80%
4. Click "Set Budget"
5. System tracks spending automatically

### Viewing Insights
1. Navigate to Insights section
2. Select period: Week/Month/All
3. Review AI-generated insights
4. Follow recommendations

---

## 🔒 Security Features

- Password hashing with Werkzeug
- Session-based authentication
- Protected routes with `@login_required`
- User data isolation
- SQL injection prevention (SQLAlchemy)
- CSRF protection
- Environment variable security
- `.env` excluded from version control

---

## 📞 Support & Contribution

### Getting Help
- Check troubleshooting section
- Review terminal logs for errors
- Verify environment configuration
- Test with sample data

### Best Practices
- Keep API keys secure
- Regular database backups
- Update dependencies regularly
- Monitor email quota limits
- Test features after updates

---

## 📜 License

See LICENSE file for details.

---

**Built with ❤️ using Flask, AI, and modern web technologies**

*Last Updated: October 30, 2025*
