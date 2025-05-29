from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .api import (
    CustomAuthToken, RegisterViewSet,
    PatientViewSet, PatientFileViewSet, EmergencyVisitViewSet,
    VitalSignViewSet, TreatmentViewSet, DiagnosisViewSet,
    StaffViewSet, InventoryItemViewSet, PrescriptionViewSet,
    DoctorViewSet, NurseViewSet, BedViewSet, AdmissionViewSet
)

router = DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'patient-files', PatientFileViewSet)
router.register(r'emergency-visits', EmergencyVisitViewSet)
router.register(r'vital-signs', VitalSignViewSet)
router.register(r'treatments', TreatmentViewSet)
router.register(r'diagnoses', DiagnosisViewSet)
router.register(r'staff', StaffViewSet)
router.register(r'inventory', InventoryItemViewSet)
router.register(r'prescriptions', PrescriptionViewSet)
router.register(r'doctors', DoctorViewSet)
router.register(r'nurses', NurseViewSet)
router.register(r'beds', BedViewSet)
router.register(r'admissions', AdmissionViewSet)

urlpatterns = [
    path('auth/login/', CustomAuthToken.as_view(), name='api-auth-login'),
    path('auth/register/', RegisterViewSet.as_view({'post': 'create'}), name='api-auth-register'),
    path('', include(router.urls)),
]