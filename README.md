# Julkar Nain – Portfolio (Django)

Personal portfolio built with Django. Content for About / Services / Projects / Testimonials / Contact messages is
editable in the Django admin; profile, skills, experience and education live in `core/content.py`.

## Run locally
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser   # for /admin
python manage.py runserver
```
Open http://127.0.0.1:8000

## Deploy on Vercel
1. Push this folder to a GitHub repo (the `db.sqlite3` and `media/` folders must be included).
2. vercel.com -> Add New -> Project -> import the repo. Vercel detects Django from `manage.py` automatically.
3. Project -> Settings -> Environment Variables, add:
   - `DJANGO_SECRET_KEY` = a long random string (`python -c "import secrets;print(secrets.token_urlsafe(50))"`)
   - (optional) `DJANGO_ALLOWED_HOSTS` = `yourdomain.com,.vercel.app` if you use a custom domain
   - (optional) `DJANGO_CSRF_TRUSTED_ORIGINS` = `https://yourdomain.com`
4. Deploy. Static files are collected and served from the Vercel CDN automatically.

### Receive contact-form messages in your inbox (recommended on Vercel)
Create a Gmail **App Password** (Google Account -> Security -> 2-Step Verification -> App passwords) and add in Vercel:
`DJANGO_EMAIL_USER` = your Gmail address, `DJANGO_EMAIL_PASSWORD` = the app password,
(optional) `DJANGO_CONTACT_TO` = the address that should receive messages (default: your Gmail).
Each message is e-mailed to you with the visitor's address as Reply-To. No database needed.

### Limits on Vercel
Vercel's filesystem is read-only. With the bundled SQLite the whole site (About, Projects, Skills, CV) works,
but the **contact form and /admin cannot save data**. To enable them, add a free Postgres (Neon / Supabase /
Vercel Marketplace) and set `DATABASE_URL`, then run once from your computer:
```bash
export DATABASE_URL="postgresql://..."
python manage.py migrate
python manage.py createsuperuser
python manage.py seed_content      # loads the default About / Services / Projects
```
Uploaded images (admin) are not stored on Vercel; add project images to `media/works/` in the repo and commit.
Edit profile / skills / experience text in `core/content.py`.
