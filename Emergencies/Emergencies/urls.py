"""
URL configuration for Emergencies project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
# Rimuovi l'import di admin se usi solo custom_site
# from django.contrib import admin
from django.urls import path
from django.views.generic import RedirectView
from django.urls import include
from Core.views import patient_list, create_patient, upload_file
from UI.admin import custom_site


urlpatterns = [
    path('admin/', custom_site.urls),
    path('', RedirectView.as_view(url='/admin/login/', permanent=False)),
    path('ui/', include('UI.urls')),
    path('core/patient/', patient_list, name='patient_list'),
    path('core/patient/create/', create_patient, name='create_patient'),
    path('core/patient/<int:patient_id>/upload/', upload_file, name='upload_file')

]
