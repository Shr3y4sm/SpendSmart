# 💰 SpendSmart - Intelligent Expense Tracker# 💰 SpendSmart - Intelligent Expense Tracker



A modern, AI-powered expense tracking web application with comprehensive budget management, automated email alerts, and financial insights. Built with Flask, SQLAlchemy, and Google Gemini AI.A modern, AI-powered expense tracking web application with comprehensive budget management, automated email alerts, and financial insights. Built with Flask, SQLAlchemy, and Google Gemini AI.



![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)

![Flask](https://img.shields.io/badge/Flask-3.0.0-green.svg)![Flask](https://img.shields.io/badge/Flask-3.0.0-green.svg)

![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.0-purple.svg)![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.0-purple.svg)

![AI](https://img.shields.io/badge/AI-Gemini-orange.svg)![AI](https://img.shields.io/badge/AI-Gemini-orange.svg)

![License](https://img.shields.io/badge/License-MIT-yellow.svg)![License](https://img.shields.io/badge/License-MIT-yellow.svg)



---## ✨ Key Features



## ✨ Features### 🔐 User Authentication

- Secure user registration and login

### 🔐 User Authentication- Password hashing with Werkzeug

- Secure registration and login system- Session-based authentication (Flask-Login)

- Password hashing with Werkzeug- User profile management

- Session-based authentication (Flask-Login)- User-specific data isolation

- User profile management

- User-specific data isolation### 💰 Budget Management

- Monthly budget setting with customizable thresholds

### 💰 Budget Management- Real-time spending tracking

- Monthly budget setting with customizable thresholds (50-100%)- Visual progress bars with status indicators (Safe/Warning/Exceeded)

- Real-time spending tracking- Budget status dashboard

- Visual progress bars with color-coded status (Safe/Warning/Exceeded)

- Budget status dashboard### 📧 Automated Email Alerts

- Remaining budget calculations- Warning emails when reaching budget threshold (e.g., 80%)

- Critical alerts when exceeding 100% of budget

### 📧 Automated Email Alerts- Beautiful HTML email templates

- **Warning emails** when reaching budget threshold (e.g., 80%)- Smart alert system (one email per threshold per month)

- **Critical alerts** when exceeding 100% of budget- Works with Gmail, Outlook, Yahoo, and custom SMTP

- Beautiful HTML email templates with spending summaries

- Smart alert system (one email per threshold per month)### 🤖 AI-Powered Features

- Works with Gmail, Outlook, Yahoo, and custom SMTP servers- **Smart Categorization**: Automatic expense categorization using Google Gemini AI

- **Financial Insights**: AI-generated spending analysis and recommendations

### 🤖 AI-Powered Features- **Pattern Recognition**: Identify spending trends and behavioral patterns

- **Smart Categorization**: Automatic expense categorization using Google Gemini AI- **Personalized Tips**: Actionable advice to improve financial health

- **Financial Insights**: AI-generated spending analysis and personalized recommendations

- **Pattern Recognition**: Identify spending trends and behavioral patterns### 📷 Receipt Scanner

- **Confidence Scores**: Get categorization suggestions with confidence levels- OCR text extraction from receipt images (Tesseract.js)

- Auto-fill expense form with extracted data

### 📷 Receipt Scanner- Amount and date detection

- OCR text extraction from receipt images (Tesseract.js)- Merchant identification

- Auto-fill expense form with extracted data

- Automatic amount and date detection### 📊 Data Visualization

- Merchant/item identification- Interactive pie charts for spending distribution

- Supports JPG, PNG image formats- Monthly trend line charts

- Real-time updates

### 📊 Data Visualization- Color-coded categories

- Interactive pie charts for spending distribution- Responsive design

- Monthly trend line charts

- Real-time chart updates### � Modern UI/UX

- Color-coded categories- Clean, professional dashboard design

- Hover tooltips with detailed information- Statistics cards (Today/Week/Month/Total)

- Responsive design for all devices- Responsive layout for all devices

- Smooth animations and transitions

### 🎨 Modern UI/UX- Touch-friendly mobile interface

- Clean, professional dashboard design

- Statistics cards (Today/Week/Month/Total)## 🚀 Quick Start

- Responsive layout for desktop, tablet, and mobile

- Smooth animations and transitions### Prerequisites

- Touch-friendly mobile interface- Python 3.8 or higher

- Bootstrap 5.3.0 based design system- pip (Python package manager)

- Git

---

### Installation

## 🚀 Quick Start

1. **Clone the repository**

### Prerequisites   ```bash

- Python 3.8 or higher   git clone https://github.com/Shr3y4sm/SpendSmart.git

- pip (Python package manager)   cd SpendSmart/SpendSmart

- Git   ```



### Installation2. **Create virtual environment**

   ```bash

1. **Clone the repository**   python -m venv venv

   ```bash   # Windows

   git clone https://github.com/Shr3y4sm/SpendSmart.git   .\venv\Scripts\Activate.ps1

   cd SpendSmart/SpendSmart   # Mac/Linux

   ```   source venv/bin/activate

   ```

2. **Create virtual environment**

   ```bash3. **Install dependencies**

   python -m venv venv   ```bash

      pip install -r requirements.txt

   # Windows   ```

   .\venv\Scripts\Activate.ps1

   4. **Configure environment variables**

   # Mac/Linux   

   source venv/bin/activate   Create a `.env` file in the root directory:

   ```   ```env

   # AI Features

3. **Install dependencies**   GEMINI_API_KEY=your-gemini-api-key-here

   ```bash   

   pip install -r requirements.txt   # Email Alerts

   ```   MAIL_SERVER=smtp.gmail.com

   MAIL_PORT=587

4. **Configure environment variables**   MAIL_USE_TLS=true

      MAIL_USERNAME=your-email@gmail.com

   Create a `.env` file in the `SpendSmart` directory:   MAIL_PASSWORD=your-app-password

      MAIL_DEFAULT_SENDER=your-email@gmail.com

   ```env   

   # AI Features (Optional - app works without it)   # Flask Config

   GEMINI_API_KEY=your-gemini-api-key-here   FLASK_ENV=development

      SECRET_KEY=your-secret-key-here

   # Email Alerts (Required for email notifications)   ```

   MAIL_SERVER=smtp.gmail.com

   MAIL_PORT=5875. **Run the application**

   MAIL_USE_TLS=true   ```bash

   MAIL_USERNAME=your-email@gmail.com   python run.py

   MAIL_PASSWORD=your-16-char-app-password   ```

   MAIL_DEFAULT_SENDER=your-email@gmail.com

   6. **Access the application**

   # Flask Configuration   - Open browser: `http://localhost:5000`

   FLASK_ENV=development   - Register a new account

   SECRET_KEY=your-random-secret-key-here   - Start tracking your expenses!

   ```

### Getting API Keys

5. **Run the application**

   ```bash**Gemini API Key** (for AI features):

   python run.py1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)

   ```2. Sign in with Google account

3. Click "Create API Key"

6. **Access the application**4. Copy and add to `.env` file

   - Open browser: **http://localhost:5000**

   - Register a new account**Gmail App Password** (for email alerts):

   - Start tracking your expenses!1. Enable 2-Step Verification in Google Account

2. Go to Security → 2-Step Verification → App passwords

---3. Select "Mail" and generate password

4. Copy 16-character password to `.env` file

## 🔑 Getting API Keys

## 📁 Project Structure

### Gemini API Key (for AI features)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)```

2. Sign in with your Google accountvibecoding/

3. Click "Create API Key"├── app/

4. Copy the key and add to `.env` file│   ├── __init__.py          # Flask app initialization

│   ├── routes.py            # API endpoints and routes

### Gmail App Password (for email alerts)│   ├── templates/

1. Enable **2-Step Verification** in Google Account Settings│   │   └── index.html       # Main HTML template

2. Go to **Security → 2-Step Verification → App passwords**│   └── static/

3. Select "Mail" and generate password│       ├── css/

4. Copy the 16-character password (no spaces) to `.env` file│       │   └── style.css    # Custom styles

│       └── js/

---│           └── app.js       # Frontend JavaScript logic

├── run.py                   # Application entry point

## 📁 Project Structure├── requirements.txt         # Python dependencies

├── expenses_data.json       # Expense data storage (auto-created)

```└── README.md               # This file

SpendSmart/```

├── app/

│   ├── __init__.py              # Flask app initialization## 🔧 API Endpoints

│   ├── routes.py                # API endpoints & page routes

│   ├── models.py                # Database models (User, Expense, Budget)| Method | Endpoint | Description |

│   ├── ai_categorizer.py        # AI categorization engine|--------|----------|-------------|

│   ├── ai_insights.py           # AI insights generator| GET | `/` | Main application page |

│   ├── email_service.py         # Email notification service| GET | `/api/expenses` | Get all expenses |

│   ├── templates/               # HTML templates| POST | `/api/expenses` | Add a new expense |

│   │   ├── base.html           # Base template with navbar| PUT | `/api/expenses/<id>` | Update an expense |

│   │   ├── index.html          # Main dashboard| DELETE | `/api/expenses/<id>` | Delete an expense |

│   │   ├── login.html          # Login page

│   │   ├── register.html       # Registration page### Example API Request

│   │   └── profile.html        # User profile

│   └── static/                  # Static assets**Add Expense:**

│       ├── css/```json

│       │   └── style.css       # Custom stylesPOST /api/expenses

│       └── js/Content-Type: application/json

│           ├── app.js          # Core functionality

│           ├── budget.js       # Budget management{

│           ├── charts.js       # Data visualization  "item": "Coffee",

│           ├── insights.js     # AI insights  "category": "Food & Dining",

│           ├── edit.js         # Edit functionality  "amount": 5.50,

│           └── receipt-scanner.js  # OCR scanner  "date": "2025-10-24"

├── instance/}

│   └── spendsmartusers.db      # SQLite database (auto-created)```

├── docs/

│   └── README.md               # Comprehensive documentation## 💡 How It Works

├── .env                         # Environment variables (create this)

├── .gitignore                   # Git ignore rules1. **Add Expenses**: Use the form to input expense details (item name, category, amount, date)

├── requirements.txt             # Python dependencies2. **View Statistics**: Automatically calculated totals for today, this week, and all time

├── run.py                       # Application entry point3. **Category Analysis**: Visual breakdown showing which categories consume most of your budget

├── LICENSE                      # MIT License4. **Manage Expenses**: View all expenses in a sortable table with delete functionality

└── README.md                    # This file5. **Data Persistence**: All expenses are saved to a JSON file on the backend

```

## 🎨 Technologies Used

---

- **Backend**: Flask 3.0.0 (Python web framework)

## 🔧 API Reference- **Frontend**: 

  - HTML5

### Authentication Endpoints  - Bootstrap 5.3.0 (CSS framework)

| Method | Endpoint | Description |  - Vanilla JavaScript (ES6+)

|--------|----------|-------------|- **Icons**: Bootstrap Icons

| GET | `/register` | Registration page |- **Storage**: JSON file-based storage with localStorage backup

| POST | `/register` | Create new account |

| GET | `/login` | Login page |## 🔮 Future Enhancements (Roadmap)

| POST | `/login` | Authenticate user |

| GET | `/logout` | Logout current user |### Level 2 - Smart Features

| GET | `/profile` | User profile page (protected) |- 🤖 AI-powered expense categorization

- 📊 Advanced data visualizations (charts and graphs)

### Expense Management- 📤 Export data to CSV/PDF

| Method | Endpoint | Description |- 🔍 Search and filter capabilities

|--------|----------|-------------|

| GET | `/` | Main dashboard (protected) |### Level 3 - Intelligent Insights

| GET | `/dashboard` | Dashboard page (protected) |- 💬 AI-driven spending insights and recommendations

| GET | `/api/expenses` | Get user's expenses |- 📅 Monthly budget planning

| POST | `/api/expenses` | Add new expense |- 🎯 Spending goals and alerts

| PUT | `/api/expenses/<id>` | Update expense |- 📈 Trend analysis

| DELETE | `/api/expenses/<id>` | Delete expense |

### Level 4 - Advanced Features

### Budget & AI Features- 👥 User authentication and multi-user support

| Method | Endpoint | Description |- ☁️ Cloud storage integration

|--------|----------|-------------|- 📱 Progressive Web App (PWA)

| GET | `/api/budget` | Get current month budget |- 🌐 Multiple currency support

| POST | `/api/budget` | Set monthly budget |

| GET | `/api/budget/status` | Get budget status with spending |## 🤝 Contributing

| POST | `/api/categorize` | AI-powered categorization |

| POST | `/api/categorize/suggestions` | Get category suggestions |Contributions are welcome! Feel free to submit issues and pull requests.

| GET | `/api/insights` | Get AI financial insights |

| GET | `/api/insights?period=week` | Get insights for specific period |## 📄 License

| GET | `/api/visualization/data?period=month` | Get chart data |

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

## 🎨 Technology Stack

Built with ❤️ for better financial awareness

### Backend

- **Flask 3.0.0** - Micro web framework## 📞 Support

- **Flask-SQLAlchemy 3.1.1** - SQL ORM

- **Flask-Login 0.6.3** - User session managementIf you encounter any issues or have questions, please open an issue on GitHub.

- **Flask-Mail 0.9.1** - Email notifications

- **Flask-Bcrypt 1.0.1** - Password hashing---

- **Flask-CORS 4.0.0** - Cross-origin requests

- **Google Generative AI 0.3.2** - AI features**Happy Expense Tracking! 💰✨**

- **SQLite** - Lightweight database

### Frontend
- **Bootstrap 5.3.0** - Responsive UI framework
- **Chart.js** - Interactive data visualization
- **Tesseract.js** - OCR text extraction
- **Bootstrap Icons** - Icon library
- **Vanilla JavaScript (ES6+)** - Client-side logic

---

## 📊 Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username (indexed)
- `email` - Unique email address (indexed)
- `password_hash` - Hashed password
- `full_name` - User's full name
- `created_at`, `updated_at` - Timestamps

### Expenses Table
- `id` - Primary key
- `user_id` - Foreign key to users (indexed)
- `item` - Expense name
- `category` - Expense category
- `amount` - Expense amount
- `date` - Expense date (indexed)
- `created_at`, `updated_at` - Timestamps

### Budgets Table
- `id` - Primary key
- `user_id` - Foreign key to users (indexed)
- `month` - Budget month in YYYY-MM format (indexed)
- `amount` - Budget amount
- `alert_threshold` - Alert percentage (50-100)
- `warning_email_sent` - Email tracking flag
- `exceeded_email_sent` - Email tracking flag
- `created_at`, `updated_at` - Timestamps
- **Unique constraint**: (user_id, month)

---

## 💡 Usage Examples

### Adding an Expense
1. Navigate to the dashboard
2. Fill in the expense form:
   - **Item**: "Grocery Shopping"
   - **Category**: "Food & Dining" (or use AI categorization)
   - **Amount**: 45.99
   - **Date**: Select date
3. Click "Add Expense"
4. Expense appears in the table and charts update

### Setting a Budget
1. Go to the Budget section
2. Enter monthly budget amount: 5000
3. Set alert threshold: 80% (optional)
4. Click "Set Budget"
5. System automatically tracks spending

### Using Receipt Scanner
1. Click "Choose Receipt Image" button
2. Select a receipt photo (JPG/PNG)
3. Click "Extract Text" to process
4. Form auto-fills with extracted data
5. Review and submit

### Viewing AI Insights
1. Navigate to Insights section
2. Select time period (Week/Month/All)
3. Review AI-generated insights
4. Follow personalized recommendations

---

## 🛠️ Troubleshooting

### Port Already in Use
Edit `run.py` and change the port:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### Virtual Environment Issues (Windows)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Email Alerts Not Working
- Verify `.env` file credentials
- Check Gmail App Password (16 characters, no spaces, no dashes)
- Ensure 2-Step Verification is enabled
- Review terminal logs for SMTP errors

### AI Features Not Working
- Verify `GEMINI_API_KEY` in `.env` file
- Check API key validity at [Google AI Studio](https://makersuite.google.com/app/apikey)
- Check API quota limits
- **Note**: App falls back to rule-based categorization if AI is unavailable

### Database Issues
- Database auto-creates on first run at `instance/spendsmartusers.db`
- To reset: Stop app, delete database file, restart app
- Backup database before major changes

---

## 🔒 Security Features

- ✅ Password hashing with Werkzeug (bcrypt)
- ✅ Session-based authentication (Flask-Login)
- ✅ Protected routes with `@login_required` decorator
- ✅ User data isolation (users only see their own data)
- ✅ SQL injection prevention (SQLAlchemy parameterized queries)
- ✅ CSRF protection
- ✅ Environment variables for sensitive data
- ✅ `.env` file excluded from version control
- ✅ Secure password requirements (minimum 8 characters)

---

## 📚 Documentation

For comprehensive documentation, see [`docs/README.md`](./SpendSmart/docs/README.md) which includes:
- Detailed feature explanations
- Complete API documentation
- Setup and configuration guides
- Usage examples and best practices
- Troubleshooting guides
- Security best practices

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Shreyas M**
- GitHub: [@Shr3y4sm](https://github.com/Shr3y4sm)
- Repository: [SpendSmart](https://github.com/Shr3y4sm/SpendSmart)

---

## 🙏 Acknowledgments

- Google Gemini AI for intelligent categorization
- Flask community for excellent documentation
- Bootstrap team for the UI framework
- Chart.js for beautiful visualizations
- Tesseract.js for OCR capabilities

---

## 📞 Support

If you encounter any issues or have questions:
- Check the [Troubleshooting](#-troubleshooting) section
- Review the comprehensive documentation in `docs/README.md`
- Check existing GitHub Issues
- Create a new issue with detailed information

---

**Built with ❤️ using Flask, AI, and modern web technologies**

*Last Updated: October 30, 2025*
