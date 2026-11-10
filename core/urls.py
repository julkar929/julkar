from django.urls import path

from .views import HomeTemplateView, contact

urlpatterns = [
    path("", HomeTemplateView.as_view(), name="home"),
    path("contact/", contact, name="contact"),
]
