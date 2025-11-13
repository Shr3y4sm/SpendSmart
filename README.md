# 💰 SpendSmart - Intelligent Expense Tracker

Modern, AI-powered expense tracking with smart categorization, enhanced receipt scanning, real-time budgets, email alerts, and clean visual insights.

![Python](https://img.shields.io/badge/Python-3.8+-blue.svg) ![Flask](https://img.shields.io/badge/Flask-3.0.0-green.svg) ![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-purple.svg) ![License](https://img.shields.io/badge/License-MIT-yellow.svg)

## ✨ Highlights

- 🔐 Authentication (register/login, profile, secure sessions)
- 💰 Budget management with thresholds and live status
- 📧 Automated email alerts (warning and exceeded)
- 🤖 AI expense categorization (Google Gemini)
- 🧠 AI financial insights in compact vertical columns
- 📷 Enhanced Receipt Scanner powered by Gemini Vision (with Tesseract fallback)
- 📊 Interactive charts (distribution + trends)
- 🎨 Modern, responsive UI


## 🚀 Quick Start

### 1) Clone and setup

```powershell
git clone https://github.com/Shr3y4sm/SpendSmart.git
cd SpendSmart/SpendSmart
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 2) Environment variables (`.env`)

```env
# AI (free tier: ~1,500 requests/day)
GEMINI_API_KEY=your-gemini-api-key

# Email (optional but recommended)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-char-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com

# Flask
FLASK_ENV=development
SECRET_KEY=your-random-secret
```

### 3) Run locally

```powershell
python run.py
# Visit http://localhost:5000
```

## 📷 Enhanced Receipt Scanner (FREE)

Powered by Google Gemini Vision API with automatic fallback to Tesseract.js.

- Extracts merchant, amount, date, and line items
- Auto-selects the correct category
- Confidence indicator (High/Medium/Low)
- Works on web and mobile (camera upload)

API endpoint:

```http
POST /api/receipt/scan  (multipart/form-data, field: receipt)
```

Details: see `RECEIPT_SCANNER_UPGRADE.md`.

## 🧠 AI Insights (compact layout)

Insights are presented in four vertical columns for quick scanning: Key Insights, Recommendations, Patterns, and Alerts.

## 🔔 Email Alerts

Automatic notifications at your configured threshold (e.g., 80%) and when exceeding 100% of the monthly budget. One email per threshold per month.

## 🗂️ Project Structure

```text
SpendSmart/
├─ app/
│  ├─ __init__.py
│  ├─ models.py
│  ├─ routes.py              # includes /api/receipt/scan
│  ├─ ai_categorizer.py
│  ├─ ai_insights.py
│  ├─ static/
│  │  ├─ css/style.css
│  │  └─ js/
│  │     ├─ app.js
│  │     ├─ budget.js
│  │     ├─ charts.js
│  │     ├─ insights.js
│  │     └─ receipt-scanner.js
│  └─ templates/
│     ├─ base.html
│     └─ index.html
├─ docs/
│  ├─ DEPLOYMENT.md
│  └─ DOC.md
├─ requirements.txt
├─ run.py
└─ instance/
```

## ☁️ Deployment (Render - Free)

Render config uses `rootDir: SpendSmart` and starts with Gunicorn. See `docs/DEPLOYMENT.md` for step‑by‑step setup and environment variables.

## 🧩 Tech Stack

- Backend: Flask 3, Flask‑SQLAlchemy, Flask‑Login, Flask‑Mail
- AI: google‑generativeai (Gemini), custom insights
- Frontend: Bootstrap 5, Chart.js, Vanilla JS
- OCR: Gemini Vision (primary), Tesseract.js (fallback)

## 📚 Docs & Extras

- Full docs: `SpendSmart/docs/DOC.md`
- Deployment: `SpendSmart/docs/DEPLOYMENT.md`
- Receipt scanner upgrade: `SpendSmart/RECEIPT_SCANNER_UPGRADE.md`
- Recent fixes: `SpendSmart/BUGFIXES.md`
- Slides: `SpendSmart_Presentation.md`

## 📝 License

MIT — see `LICENSE`.

