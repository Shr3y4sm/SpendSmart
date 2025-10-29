# SpendSmart – Smart Expense Tracker 💰

A modern, intelligent expense tracking web application built with Flask backend and Bootstrap frontend. Track your expenses, visualize spending patterns, and gain insights into your financial habits.

![SpendSmart](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Flask](https://img.shields.io/badge/Flask-3.0.0-green.svg)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3.0-purple.svg)

## 🌟 Features

### Level 1 - Manual Entry Tracker (Current Implementation)

- ✅ **Expense Management**: Add, view, and delete expenses with ease
- 📊 **Real-time Analytics**: 
  - Today's spending total
  - This week's spending total
  - Overall expense tracking
- 📈 **Category Breakdown**: Visual progress bars showing spending by category
- 🎨 **Clean UI**: Modern, responsive design using Bootstrap 5
- 💾 **Dual Storage**: Backend JSON storage with localStorage backup
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile

### Included Categories
- 🍔 Food & Dining
- 🚗 Transportation
- 🛍️ Shopping
- 🎬 Entertainment
- 💡 Bills & Utilities
- ⚕️ Healthcare
- 📚 Education
- 📦 Others

## 🚀 Getting Started

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vibecoding
   ```

2. **Create a virtual environment** (recommended)
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install dependencies**
   ```powershell
   pip install -r requirements.txt
   ```

### Running the Application

1. **Start the Flask server**
   ```powershell
   python run.py
   ```

2. **Open your browser**
   Navigate to: `http://localhost:5000`

3. **Start tracking expenses!** 🎉

## 📁 Project Structure

```
vibecoding/
├── app/
│   ├── __init__.py          # Flask app initialization
│   ├── routes.py            # API endpoints and routes
│   ├── templates/
│   │   └── index.html       # Main HTML template
│   └── static/
│       ├── css/
│       │   └── style.css    # Custom styles
│       └── js/
│           └── app.js       # Frontend JavaScript logic
├── run.py                   # Application entry point
├── requirements.txt         # Python dependencies
├── expenses_data.json       # Expense data storage (auto-created)
└── README.md               # This file
```

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Main application page |
| GET | `/api/expenses` | Get all expenses |
| POST | `/api/expenses` | Add a new expense |
| PUT | `/api/expenses/<id>` | Update an expense |
| DELETE | `/api/expenses/<id>` | Delete an expense |

### Example API Request

**Add Expense:**
```json
POST /api/expenses
Content-Type: application/json

{
  "item": "Coffee",
  "category": "Food & Dining",
  "amount": 5.50,
  "date": "2025-10-24"
}
```

## 💡 How It Works

1. **Add Expenses**: Use the form to input expense details (item name, category, amount, date)
2. **View Statistics**: Automatically calculated totals for today, this week, and all time
3. **Category Analysis**: Visual breakdown showing which categories consume most of your budget
4. **Manage Expenses**: View all expenses in a sortable table with delete functionality
5. **Data Persistence**: All expenses are saved to a JSON file on the backend

## 🎨 Technologies Used

- **Backend**: Flask 3.0.0 (Python web framework)
- **Frontend**: 
  - HTML5
  - Bootstrap 5.3.0 (CSS framework)
  - Vanilla JavaScript (ES6+)
- **Icons**: Bootstrap Icons
- **Storage**: JSON file-based storage with localStorage backup

## 🔮 Future Enhancements (Roadmap)

### Level 2 - Smart Features
- 🤖 AI-powered expense categorization
- 📊 Advanced data visualizations (charts and graphs)
- 📤 Export data to CSV/PDF
- 🔍 Search and filter capabilities

### Level 3 - Intelligent Insights
- 💬 AI-driven spending insights and recommendations
- 📅 Monthly budget planning
- 🎯 Spending goals and alerts
- 📈 Trend analysis

### Level 4 - Advanced Features
- 👥 User authentication and multi-user support
- ☁️ Cloud storage integration
- 📱 Progressive Web App (PWA)
- 🌐 Multiple currency support

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

Built with ❤️ for better financial awareness

## 📞 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**Happy Expense Tracking! 💰✨**