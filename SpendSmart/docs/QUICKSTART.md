# SpendSmart - Quick Start Guide

## 🚀 Getting Your App Running in 3 Steps

### Step 1: Set Up Virtual Environment
Open PowerShell in the project directory and run:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

### Step 2: Install Dependencies
```powershell
pip install -r requirements.txt
```

### Step 3: Run the Application
```powershell
python run.py
```

Then open your browser and go to: **http://localhost:5000**

---

## 📝 Usage Tips

### Adding an Expense
1. Fill in the item name (e.g., "Morning Coffee")
2. Select a category from the dropdown
3. Enter the amount (e.g., 5.50)
4. Choose the date (defaults to today)
5. Click "Add Expense"

### Viewing Analytics
- **Today's Spending**: Shows total spent today
- **This Week**: Shows total spent from Sunday to today
- **Total Expenses**: Shows all-time spending
- **Category Breakdown**: Visual bars showing spending per category

### Managing Expenses
- All expenses appear in the table below
- Click the trash icon to delete an expense
- Expenses are automatically sorted by date (newest first)

---

## 🛠️ Troubleshooting

### Port Already in Use?
If port 5000 is busy, edit `run.py` and change:
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Changed to 5001
```

### Virtual Environment Issues?
If you can't activate the venv, try:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Missing Dependencies?
Make sure you installed Flask:
```powershell
pip install Flask==3.0.0
```

---

## 📊 Sample Data for Testing

Try adding these expenses to test the app:

| Item | Category | Amount | Date |
|------|----------|--------|------|
| Grocery Shopping | Food & Dining | 45.99 | Today |
| Gas | Transportation | 50.00 | Today |
| Movie Tickets | Entertainment | 24.50 | Yesterday |
| Electric Bill | Bills & Utilities | 85.00 | This Week |
| Coffee | Food & Dining | 5.50 | Today |

---

## 🎯 What's Next?

Once Level 1 is working, you can extend the app with:
- AI categorization of expenses
- Data visualization with charts
- Budget planning features
- Export to CSV/PDF
- And much more!

Happy tracking! 💰✨
