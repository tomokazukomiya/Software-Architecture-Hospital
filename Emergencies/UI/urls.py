from django.db import models
from django.urls import path
from UI import views

urlpatterns = [
    path('doctor_view/', views.doctor_view, name='doctor_view'),
    path('api_tester/', views.api_tester, name='api_tester')
]

