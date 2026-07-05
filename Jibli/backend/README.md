# Jibli FastAPI Backend

## Setup

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create `backend/.env`:

```env
SUPABASE_URL=https://pgjigmdistwnhrwytycr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_ORIGIN=http://localhost:5174
```

Use the Supabase `service_role` key only in this backend file. Never put it in React.

## Run

```bash
uvicorn app.main:app --reload
```

API runs at:

```txt
http://localhost:8000
```

Docs:

```txt
http://localhost:8000/docs
```

## Create The Admin Account

Make sure `backend/.env` has `SUPABASE_SERVICE_ROLE_KEY`, then run:

```bash
.\.venv\Scripts\python.exe scripts\create_admin.py
```

The script creates or updates `sayanzzz2004@gmail.com`, confirms the email, and sets the matching profile role to `admin`. It prompts for the password so the password is not stored in the repo.

## Create Or Repair Supabase Tables

Open Supabase, go to **SQL Editor**, paste the full contents of:

```txt
../supabase/schema.sql
```

Then click **Run**. The file is safe to run again because it uses `if not exists` where possible.

After running it, verify the backend can see all required tables:

```bash
cd backend
.\.venv\Scripts\python.exe scripts\check_schema.py
```

If this says `Invalid API key`, replace `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env` with the full secret key from Supabase. Use the secret key only in `backend/.env`, never in React.
