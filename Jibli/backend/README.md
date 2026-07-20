# Jibli FastAPI Backend

## Setup

```bash
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m playwright install chromium
```

Product-link price auto-fetch (`/quick-order/preview`, `/products/preview`) uses a real headless Chromium browser to load AliExpress/Shein/Temu pages, since these sites block plain server requests and render price client-side. The `playwright install chromium` step downloads the browser binary — without it, preview falls back to a plain HTTP fetch, which works for the product name/image sometimes but almost never for AliExpress's price.

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

## Deploying To Render

Render's build step only runs `pip install`, which does not download the Chromium browser Playwright needs. Set Render's **Build Command** to:

```bash
bash build.sh
```

(`build.sh` in this folder runs `pip install -r requirements.txt` and then `playwright install --with-deps chromium`.) Without this, price auto-fetch silently falls back to a plain HTTP request, which rarely works for AliExpress.

Render's free tier has very little RAM (512 MB), and each headless Chromium instance is heavy. The backend only ever renders one page at a time to protect against this, but if the whole service starts crashing/restarting after this change, that's the free-tier RAM limit being hit — the fix is upgrading the Render plan.
