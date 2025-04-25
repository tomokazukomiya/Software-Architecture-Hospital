from django.db import models
from django.urls import path
from UI import views

urlpatterns = [
    path('doctor_view/', views.doctor_view, name='doctor_view')
]