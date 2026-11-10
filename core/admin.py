from django.contrib import admin

from .models import About, Client, ContactMessage, RecentWork, Service

admin.site.register(About)
admin.site.register(Service)
admin.site.register(Client)


@admin.register(RecentWork)
class RecentWorkAdmin(admin.ModelAdmin):
    list_display = ("title", "kind", "client", "order")
    list_editable = ("order",)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "created")
    readonly_fields = ("name", "email", "message", "created")
