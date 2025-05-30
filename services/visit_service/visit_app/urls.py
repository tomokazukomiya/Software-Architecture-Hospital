from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    EmergencyVisitViewSet, VitalSignViewSet, TreatmentViewSet,
    DiagnosisViewSet, PrescriptionViewSet, BedViewSet, AdmissionViewSet
)

router = DefaultRouter()
router.register(r'emergency-visits', EmergencyVisitViewSet, basename='emergencyvisit')
router.register(r'vital-signs', VitalSignViewSet, basename='vitalsign')
router.register(r'treatments', TreatmentViewSet, basename='treatment')
router.register(r'diagnoses', DiagnosisViewSet, basename='diagnosis')
router.register(r'prescriptions', PrescriptionViewSet, basename='prescription')
router.register(r'beds', BedViewSet, basename='bed')
router.register(r'admissions', AdmissionViewSet, basename='admission')

urlpatterns = [
    path('', include(router.urls)),
]