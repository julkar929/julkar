from django.db import models


class About(models.Model):
    short_description = models.TextField()
    description = models.TextField()
    image = models.ImageField(upload_to="about")
    cv = models.FileField(upload_to="about", blank=True, help_text="PDF CV for the Download CV button")

    class Meta:
        verbose_name = "About me"
        verbose_name_plural = "About me"

    def __str__(self):
        return "About me"


class Service(models.Model):
    name = models.CharField(max_length=100, verbose_name="Service name")
    description = models.TextField(verbose_name="About Service")
    icon = models.CharField(max_length=40, default="icon-wallet",
                            help_text="Line-icon class, e.g. icon-wallet, icon-laptop, icon-gears")

    class Meta:
        ordering = ["id"]

    def __str__(self):
        return self.name


class RecentWork(models.Model):
    title = models.CharField(max_length=100, verbose_name="Work title")
    client = models.CharField(max_length=150, blank=True)
    description = models.TextField(blank=True)
    tech = models.CharField(max_length=250, blank=True, help_text="Comma separated, e.g. Spring Boot, Angular")
    image = models.ImageField(upload_to="works")
    kind = models.CharField(max_length=20, default="work", choices=[("work", "Professional project"), ("learning", "Learning project"), ("experimental", "Experimental project")])
    live_url = models.URLField(blank=True)
    repo_url = models.URLField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "id"]

    def tech_list(self):
        return [t.strip() for t in self.tech.split(",") if t.strip()]

    def __str__(self):
        return self.title


class Client(models.Model):
    name = models.CharField(max_length=100, verbose_name="Client name")
    description = models.TextField(verbose_name="Client say")
    image = models.ImageField(upload_to="clients", blank=True)

    def __str__(self):
        return self.name


class ContactMessage(models.Model):
    name = models.CharField(max_length=120)
    email = models.EmailField()
    message = models.TextField()
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created"]

    def __str__(self):
        return f"{self.name} <{self.email}>"
