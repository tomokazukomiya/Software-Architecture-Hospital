from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PatientViewSet, PatientFileViewSet

router = DefaultRouter()
router.register(r'patients', PatientViewSet, basename='patient')
router.register(r'patient-files', PatientFileViewSet, basename='patientfile')

urlpatterns = [
    path('', include(router.urls)),
]