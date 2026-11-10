"""Fill an empty database (e.g. a new Postgres on Vercel) with the portfolio content.

    python manage.py migrate
    python manage.py seed_content
"""
from django.core.management.base import BaseCommand

from core.models import About, RecentWork, Service


class Command(BaseCommand):
    help = "Load the default About / Services / Projects content (replaces existing)."

    def handle(self, *args, **options):
        a = About.objects.first() or About()
        a.short_description = "Software Engineer – Java, Spring Boot, Angular & AI/RAG"
        a.description = (
            "I build secure, high-traffic enterprise web applications for Bangladesh government and public-sector clients, "
            "including the Ministry of Education (EMIS), University of Rajshahi, Gazipur City Corporation, Payra Port and Biman Bangladesh Airlines.\n"
            "Beyond full-stack development with Spring Boot, Angular, PostgreSQL and Oracle, I now work in the AI & Automation R&D team, "
            "fine-tuning AI models to extract insights from scanned documents and building a Retrieval-Augmented Generation (RAG) system. "
            "I am also exploring Next.js and NestJS. Before industry I taught engineering for over four years; I hold a B.Sc. in EEE and an M.Sc. in CSE."
        )
        a.image = "about/Julkar_Profile.png"
        a.cv = "about/Julkar_Nain_CV.pdf"
        a.save()

        Service.objects.all().delete()
        for n, d, i in [
            ("Backend & API Development", "Secure REST APIs with Java, Spring Boot, Spring Security (JWT, RBAC) and Spring Data JPA, backed by PostgreSQL or Oracle.", "icon-gears"),
            ("Full-Stack Web Applications", "End-to-end enterprise web apps with Angular or Next.js front ends, reporting (PDF/Excel) and Docker deployment.", "icon-laptop"),
            ("AI & RAG Solutions", "Fine-tuning models for data extraction from scanned documents and Retrieval-Augmented Generation for smarter automation.", "icon-lightbulb"),
        ]:
            Service.objects.create(name=n, description=d, icon=i)

        RecentWork.objects.all().delete()
        for o, (t, c, d, tech, img) in enumerate([
            ("EMIS – Education Management Information System", "Directorate of Secondary and Higher Education, Ministry of Education", "National platform with SSO, dashboards, PDS update, iBAS integration, BCS cadre transfers and MPO EFT updates for thousands of institutions.", "Spring Boot, Angular, Oracle, PostgreSQL", "works/emis.jpg"),
            ("University of Rajshahi – e-Exam & Result System", "University of Rajshahi", "Exam management and result publication portal handling semester and annual results at peak traffic, with optimised SQL and indexing.", "Spring Boot, Angular, PostgreSQL, Oracle", "works/ru.jpg"),
            ("Water Supply Billing & New Connection System", "Gazipur City Corporation", "Citizen-facing portal for new water connection applications, complaints, monthly bills and online payment, in Bangla.", "Spring Boot, Angular, PostgreSQL", "works/gcc.jpg"),
            ("Cloud Based Accounting Software", "Payra Port Authority", "Cloud accounting application for the port authority with secure role-based login.", "Java, Spring Boot, Angular", "works/payra.jpg"),
            ("Biman Bangladesh Airlines Portal", "Biman Bangladesh Airlines", "Custom internal software with secure staff authentication, built by Addie Soft Limited.", "Java, Spring Boot, Angular", "works/biman.jpg"),
        ]):
            RecentWork.objects.create(title=t, client=c, description=d, tech=tech, image=img, order=o)
        for o, (t, d, tech, img, live, repo) in enumerate([
            ("BookNook – Online Library", "Full-stack library app: browse by genre, borrow and return books with atomic stock updates, a no-double-borrow rule, curator CRUD dashboard, JWT + Google login and dark/light theme. Separate Express REST API.", "Next.js, Express.js, MongoDB, JWT, BetterAuth, Tailwind CSS", "works/booknook.jpg", "https://booknook-abc.vercel.app/", "https://github.com/julkar929/booknook-clients"),
            ("FitLog – Workout Library", "Dark, responsive gym companion: browse 12 lifts fetched from an API, build today's plan, save workouts for later and track minutes and calories, persisted in localStorage.", "Next.js, TypeScript, Tailwind CSS", "works/myfitlogs.jpg", "https://myfitlogs.vercel.app/", "https://github.com/julkar929/fitLog"),
            ("বাজার দর (BazarDor)", "Bangla-first grocery price tracker for Bangladesh: live price ticker, daily risers and fallers, category pages with sorting, and protected product details with division-wise prices. BetterAuth login (email, Google, GitHub).", "Next.js 15, TypeScript, MongoDB, BetterAuth, DaisyUI", "works/bazardor.jpg", "https://bazardor-orpin.vercel.app/", "https://github.com/julkar929/bazardor"),
        ]):
            RecentWork.objects.create(kind="learning", title=t, description=d, tech=tech, image=img, live_url=live, repo_url=repo, order=10 + o)
        RecentWork.objects.create(
            kind="experimental", order=20, title="DristiScan – AI Marksheet Scanner",
            description="Experimental R&D app that digitises handwritten marksheets: scan roll numbers and marks with Google Gemini or Gemma 3 27B, store them in PostgreSQL and expose a REST API. Includes a teacher AI assistant (RAG) and a Bangla/English UI.",
            tech="Gemini, Gemma 3 27B, OCR, RAG, PostgreSQL, REST API, Swagger",
            image="works/dristiscan.jpg", live_url="https://julkarocr.vercel.app/")
        self.stdout.write(self.style.SUCCESS("Content loaded."))
