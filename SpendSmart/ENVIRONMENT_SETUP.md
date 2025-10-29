# 🔧 Environment Setup Guide

## Setting up your Gemini API Key

### Step 1: Create a `.env` file

Create a file named `.env` in the project root directory with the following content:

```env
# SpendSmart Environment Variables
GEMINI_API_KEY=your-actual-gemini-api-key-here

# Flask Configuration  
FLASK_ENV=development
SECRET_KEY=dev-secret-key-change-in-production
```

### Step 2: Get your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Replace `your-actual-gemini-api-key-here` in your `.env` file with the real key

### Step 3: Verify Setup

Run this command to test if your API key is loaded:

```bash
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print('GEMINI_API_KEY loaded:', 'Yes' if os.getenv('GEMINI_API_KEY') else 'No')"
```

### Step 4: Start the Application

```bash
python run.py
```

## Example `.env` file:

```env
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FLASK_ENV=development
SECRET_KEY=your-secret-key-here
```

## Important Notes:

- ✅ The `.env` file is automatically ignored by git for security
- ✅ Never commit your actual API keys to version control
- ✅ The app works without the API key (uses fallback categorization)
- ✅ AI features are enhanced when the API key is properly configured

## Troubleshooting:

If you get "GEMINI_API_KEY loaded: No":
1. Make sure the `.env` file is in the project root directory
2. Check that the file name is exactly `.env` (not `.env.txt`)
3. Verify the API key format in the file
4. Restart the Flask application after creating the file
