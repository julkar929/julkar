from django.conf import settings
from django.core import mail  # noqa: F401
from django.core.mail import EmailMessage
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.generic import TemplateView

from . import content
from .models import About, Client, ContactMessage, RecentWork, Service


class HomeTemplateView(TemplateView):
    template_name = "home.html"

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context.update(
            about=About.objects.first(),
            services=Service.objects.all(),
            works=RecentWork.objects.filter(kind="work"),
            learning=RecentWork.objects.filter(kind__in=["learning", "experimental"]),
            clients=Client.objects.all(),
            profile=content.PROFILE,
            stats=content.STATS,
            skills=content.SKILLS,
            experience=content.EXPERIENCE,
            education=content.EDUCATION,
            certifications=content.CERTIFICATIONS,
        )
        return context


@require_POST
def contact(request):
    name = request.POST.get("name", "").strip()
    email = request.POST.get("email", "").strip()
    message = request.POST.get("message", "").strip()
    if not (name and email and message):
        return JsonResponse({"type": "danger", "message": "Please fill in all fields."}, status=400)
    saved = sent = False
    try:  # save in the database (not possible on read-only SQLite, e.g. Vercel)
        ContactMessage.objects.create(name=name[:120], email=email[:254], message=message[:5000])
        saved = True
    except Exception:
        pass
    if settings.EMAIL_HOST_USER:  # forward to the inbox
        try:
            EmailMessage(
                subject="Portfolio message from %s" % name[:80],
                body="Name: %s\nEmail: %s\n\n%s" % (name, email, message[:5000]),
                to=[settings.CONTACT_RECEIVER], reply_to=[email],
            ).send()
            sent = True
        except Exception:
            pass
    if not (saved or sent):
        return JsonResponse({
            "type": "warning",
            "message": "Sorry, your message could not be sent right now. Please email me at %s." % content.PROFILE["email"],
        }, status=503)
    return JsonResponse({"type": "success", "message": "Thanks! Your message has been sent. I will reply soon."})
