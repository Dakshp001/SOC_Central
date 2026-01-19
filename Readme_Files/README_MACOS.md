## SOC Central — macOS Setup Guide

This guide helps you set up SOC Central on macOS, including PostgreSQL, backend (Django), and frontend (Vite/React) with environment variables.

### Prerequisites
- macOS 12+ (Intel or Apple Silicon)
- Admin rights and internet connectivity

### 1) Install system dependencies
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Update brew and install tooling
brew update
brew install python@3.11 postgresql@14 git node

# Optional: use fnm/nvm for Node management
brew install fnm
fnm install --lts
fnm use --lts

# Verify versions
python3 --version
pip3 --version
node -v
npm -v
psql --version
```

Note: After installing `postgresql@14`, Homebrew prints service commands. Keep them handy.

### 2) Clone the repository
```bash
git clone <your-fork-or-origin-url> SOC-Central
cd SOC-Central
```

### 3) PostgreSQL setup (local)
Start PostgreSQL and create a database/user that matches the app defaults, or use a single `DATABASE_URL`.

```bash
# Start Postgres via brew
brew services start postgresql@14

# Create a role and database (change password as desired)
createuser --superuser $USER || true
psql -U $USER -d postgres -c "CREATE USER soc_central_user WITH PASSWORD 'SecurePassword123!';" || true
psql -U $USER -d postgres -c "CREATE DATABASE soc_central_db OWNER soc_central_user;" || true

# Test connection
psql "postgresql://soc_central_user:SecurePassword123!@localhost:5432/soc_central_db" -c "SELECT 1;"
```

If you prefer a single URL, set `DATABASE_URL` in the backend `.env` (see below) instead of individual `DB_*` variables.

### 4) Backend setup (Django)
```bash
cd backend

# Create and activate a virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate

# Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Create a .env file
cp env.production.backup .env || true
```

Edit `.env` to include your local development values. See the examples below.

Run database migrations and create the cache table:
```bash
python manage.py migrate
python manage.py createcachetable
```

Create an admin user (optional if `CREATE_SUPER_ADMIN=True` is set):
```bash
python manage.py createsuperuser
```

Run the backend locally:
```bash
python manage.py runserver 0.0.0.0:8000
```

### 5) Frontend setup (Vite/React)
```bash
cd ../socentral
npm ci || npm install

# Create a local env if needed (Vite reads from .env.local)
cp .env.example .env.local 2>/dev/null || true

npm run dev
# Vite will start on http://localhost:5173 by default
```

Ensure the frontend API base URL points to `http://localhost:8000` when developing locally.

### 6) Environment variable examples

Backend `backend/.env` (local development):
```bash
# Core
DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production

# URLs
FRONTEND_URL=http://localhost:5173
API_BASE_URL=http://localhost:8000

# Database (choose ONE approach)
# A) Single DATABASE_URL
# DATABASE_URL=postgres://soc_central_user:SecurePassword123!@localhost:5432/soc_central_db

# B) Individual DB settings (used when DATABASE_URL is not set)
DB_NAME=soc_central_db
DB_USER=soc_central_user
DB_PASSWORD=SecurePassword123!
DB_HOST=localhost
DB_PORT=5432
DB_SSL_MODE=prefer

# Email (use console backend when EMAIL_HOST_USER empty)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
DEFAULT_FROM_EMAIL=noreply@soccentral.com

# JWT / Auth settings are driven by defaults in settings.py

# Optional: Google Gemini (dev/testing only; avoid committing real keys)
GEMINI_API_KEY=your-gemini-api-key

# Optional: Twilio SMS
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
SMS_SERVICE_ENABLED=False

# Super admin bootstrap (dev convenience)
CREATE_SUPER_ADMIN=True
SUPER_ADMIN_EMAIL=admin@soccentral.com
SUPER_ADMIN_PASSWORD=SuperAdmin123!
```

Frontend `socentral/.env.local` example (keys may vary by implementation):
```bash
# Ensure the app points to your local backend
VITE_API_BASE_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173
```

### 7) CORS and CSRF during local development
The backend is configured to allow common localhost ports when `DEBUG=True`. Ensure your frontend uses `http://localhost:5173` (or your Vite port) and backend uses `http://localhost:8000`.

### 8) Running tests (optional)
```bash
cd backend
pytest -q || python -m pytest -q
```

There are also helper test scripts at the repository root (e.g., `test_*` files) that you can run with Python.

### 9) Common troubleshooting on macOS
- Postgres fails to start after install:
  - Run: `brew services restart postgresql@14`
  - Check logs: `tail -n 200 $(brew --prefix)/var/log/postgres.log 2>/dev/null || echo "See pg logs in $(brew --prefix)/var/postgresql@14"`
- psql cannot connect (role or DB missing):
  - Recreate: `psql -U $USER -d postgres -c "CREATE USER soc_central_user WITH PASSWORD 'SecurePassword123!';"`
  - Recreate DB: `psql -U $USER -d postgres -c "CREATE DATABASE soc_central_db OWNER soc_central_user;"`
- SSL mode errors on local Postgres:
  - Set `DB_SSL_MODE=disable` temporarily in `.env` or use `prefer` (default). For `DATABASE_URL`, append `?sslmode=disable`.
- Port already in use (8000 or 5173):
  - Find process: `lsof -i :8000` then `kill -9 <pid>` (replace port as needed).
- Emails not sending locally:
  - Leave `EMAIL_HOST_USER` empty to use console backend (logs emails to console). In production, set real SMTP credentials.

### 10) Production notes (quick reference)
- Use `DATABASE_URL` with managed Postgres and set `DEBUG=False`.
- Provide `SECRET_KEY`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `FRONTEND_URL`.
- Review CORS/CSRF domains in `backend/core/settings.py`.
- Run `python manage.py collectstatic` and `python manage.py createcachetable`.

### 11) Useful commands
```bash
# Backend
cd backend && source .venv/bin/activate
python manage.py showmigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 0.0.0.0:8000

# Frontend
cd ../socentral
npm run dev
npm run build
```

You’re set! Start the backend on port 8000 and the frontend on 5173, then visit `http://localhost:5173`.


