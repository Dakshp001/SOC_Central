# Project Setup Guide

This guide provides step-by-step instructions to set up and run the **backend** and **frontend** of the project.

---

## Backend Setup

### Prerequisites
- Python 3.8 or higher
- `pip` installed

### Steps

1. **Navigate to the Backend Directory**
   Open your terminal and run:
   ```bash
   cd backend
   ```

2. **Create a Virtual Environment**
   Create and activate a virtual environment named `venv`:
   ```bash
   python -m venv venv
   ```
   - **On Windows:**
     ```bash
     venv\Scripts\activate
     ```
   - **On macOS/Linux:**
     ```bash
     source venv/bin/activate
     ```

3. **Install Dependencies**
   Install the required packages from `requirements.txt`:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run Database Migrations**
   Apply the database migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create Cache Table**
   Set up the cache table:
   ```bash
   python manage.py createcachetable
   ```

6. **Create Superadmin**
   Create a superadmin account for the Django admin panel:
   ```bash
   python manage.py create_superadmin
   ```

7. **Start the Development Server**
   Run the backend server:
   ```bash
   python manage.py runserver
   ```

---

## Frontend Setup

### Prerequisites
- Node.js (v16 or higher)
- `npm` or `yarn` installed

### Steps

1. **Navigate to the Frontend Directory**
   Open a new terminal and run:
   ```bash
   cd soccentral
   ```

2. **Install Dependencies**
   Install the required packages:
   ```bash
   npm install
   ```

3. **Start the Development Server**
   Run the frontend in development mode:
   ```bash
   npm run dev
   ```

---

## Notes
- Ensure the backend server is running before starting the frontend.
- The backend will be available at `http://127.0.0.1:8000/`.
- The frontend will be available at `http://localhost:3000/` (or another port if specified).

---

## Troubleshooting
- If you encounter dependency conflicts, try deleting the `node_modules` folder and reinstalling dependencies.
- Ensure your virtual environment is activated before running backend commands.