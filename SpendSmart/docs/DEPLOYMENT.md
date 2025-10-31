# SpendSmart Deployment Guide - Render

## 🚀 Deploy to Render (Free)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub account

### Step 3: Deploy Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your **SpendSmart** repository
3. Configure:
   - **Name:** `spendsmartapp` (or your choice)
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Runtime:** `Python 3`
   - **Root Directory:** `SpendSmart`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn run:app`

### Step 4: Set Environment Variables
Click **"Environment"** tab and add:

| Variable | Value |
|----------|-------|
| `FLASK_ENV` | `production` |
| `SECRET_KEY` | Generate random string (click "Generate") |
| `GEMINI_API_KEY` | Your Gemini API key |
| `MAIL_SERVER` | `smtp.gmail.com` |
| `MAIL_PORT` | `587` |
| `MAIL_USE_TLS` | `true` |
| `MAIL_USERNAME` | `your-email@gmail.com` |
| `MAIL_PASSWORD` | Your Gmail app password |
| `MAIL_DEFAULT_SENDER` | `your-email@gmail.com` |

### Step 5: Deploy!
1. Click **"Create Web Service"**
2. Wait 2-3 minutes for deployment
3. Your app will be live at: `https://spendsmartapp.onrender.com`

---

## 📝 Important Notes

### Database
- SQLite works on Render but resets when service restarts
- For persistent data, upgrade to PostgreSQL (still free):
  1. Create new **PostgreSQL** database on Render
  2. Copy **Internal Database URL**
  3. Add environment variable: `DATABASE_URL` = `<your-database-url>`
  4. Update `app/__init__.py` to use PostgreSQL

### Free Tier Limitations
- ⚠️ Service sleeps after 15 minutes of inactivity
- First request after sleep takes 30-50 seconds to wake up
- 750 hours/month (plenty for portfolio/testing)

### Custom Domain (Optional)
1. Go to **Settings** → **Custom Domain**
2. Add your domain
3. Update DNS records as shown

---

## 🐛 Troubleshooting

### Build Fails
- Check Python version in logs
- Verify `requirements.txt` is correct
- Check for missing dependencies

### App Crashes on Start
- Review logs in Render dashboard
- Verify environment variables are set
- Check `gunicorn` is in requirements.txt

### Database Issues
- SQLite resets on restart (upgrade to PostgreSQL)
- Check database file permissions
- Verify `instance/` directory exists

---

## 🔄 Updating Your App

```bash
# Make changes locally
git add .
git commit -m "Update description"
git push origin main
```

Render auto-deploys on push! 🎉

---

## ✅ Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create Render account
- [ ] Create Web Service
- [ ] Set all environment variables
- [ ] Deploy and test
- [ ] Check email alerts work
- [ ] Test budget notifications
- [ ] Verify AI features work

---

**Your app will be live at:** `https://YOUR-APP-NAME.onrender.com` 🌐
