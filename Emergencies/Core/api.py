from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User 
from rest_framework.permissions import IsAuthenticated 
from rest_framework.parsers import MultiPartParser, FormParser
from django.db import models
from django.db.models import Prefetch
from .models import (
    Patient, PatientFile, EmergencyVisit, VitalSign, Treatment,
    Diagnosis, Staff, InventoryItem, Prescription, Doctor,
    Nurse, Bed, Admission
)
from .serializers import (
    UserSerializer, PatientSerializer, PatientFileSerializer,
    EmergencyVisitSerializer, VitalSignSerializer, TreatmentSerializer,
    DiagnosisSerializer, StaffSerializer, InventoryItemSerializer,
    PrescriptionSerializer, DoctorSerializer, NurseSerializer,
    BedSerializer, AdmissionSerializer
) 
from rest_framework.authentication import SessionAuthentication

## Authentication API ##
class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return

class CustomAuthToken(ObtainAuthToken):
    authentication_classes = (CsrfExemptSessionAuthentication,)

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                         context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data
        })

class RegisterViewSet(viewsets.GenericViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.create_user(**serializer.validated_data)
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'user': UserSerializer(user, context=self.get_serializer_context()).data,
            'token': token.key
        }, status=status.HTTP_201_CREATED)

## Model ViewSets ##
class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().select_related()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']
    filterset_fields = ['last_name', 'gender']

    def get_queryset(self):
        queryset = super().get_queryset()
        last_name = self.request.query_params.get('last_name')
        if last_name:
            queryset = queryset.filter(last_name__icontains=last_name)
        return queryset

class PatientFileViewSet(viewsets.ModelViewSet):
    queryset = PatientFile.objects.all().select_related('patient')
    serializer_class = PatientFileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    http_method_names = ['get', 'post', 'delete']

    def perform_create(self, serializer):
        serializer.save(patient_id=self.request.data.get('patient'))

class EmergencyVisitViewSet(viewsets.ModelViewSet):
    queryset = EmergencyVisit.objects.all().select_related(
        'patient', 'attending_physician', 'triage_nurse'
    ).prefetch_related(
        'vital_signs', 'treatments', 'diagnoses', 'prescriptions'
    )
    serializer_class = EmergencyVisitSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']
    filterset_fields = ['triage_level', 'is_admitted']

    @action(detail=False, methods=['get'])
    def active(self, request):
        active_visits = self.get_queryset().filter(discharge_time__isnull=True)
        serializer = self.get_serializer(active_visits, many=True)
        return Response(serializer.data)

class VitalSignViewSet(viewsets.ModelViewSet):
    queryset = VitalSign.objects.all().select_related('visit', 'recorded_by')
    serializer_class = VitalSignSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        queryset = super().get_queryset()
        visit_id = self.request.query_params.get('visit_id')
        if visit_id:
            queryset = queryset.filter(visit_id=visit_id)
        return queryset.order_by('-recorded_at')

class TreatmentViewSet(viewsets.ModelViewSet):
    queryset = Treatment.objects.all().select_related('visit', 'administered_by')
    serializer_class = TreatmentSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

class DiagnosisViewSet(viewsets.ModelViewSet):
    queryset = Diagnosis.objects.all().select_related('visit', 'diagnosed_by')
    serializer_class = DiagnosisSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all().select_related('user')
    serializer_class = StaffSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all()
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']
    filterset_fields = ['category', 'quantity']

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        low_stock_items = self.get_queryset().filter(quantity__lte=models.F('minimum_stock'))
        serializer = self.get_serializer(low_stock_items, many=True)
        return Response(serializer.data)

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all().select_related('visit', 'prescribed_by')
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all().select_related('user')
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

class NurseViewSet(viewsets.ModelViewSet):
    queryset = Nurse.objects.all().select_related('user')
    serializer_class = NurseSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

class BedViewSet(viewsets.ModelViewSet):
    queryset = Bed.objects.all().select_related('patient', 'doctor', 'nurse')
    serializer_class = BedSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']
    filterset_fields = ['status', 'location', 'is_isolation']

    @action(detail=False, methods=['get'])
    def available(self, request):
        available_beds = self.get_queryset().filter(status='AVAIL')
        serializer = self.get_serializer(available_beds, many=True)
        return Response(serializer.data)

class AdmissionViewSet(viewsets.ModelViewSet):
    queryset = Admission.objects.all().select_related(
        'visit', 'bed', 'admitted_by'
    ).prefetch_related(
        Prefetch('visit__patient', queryset=Patient.objects.only('first_name', 'last_name'))
    )
    serializer_class = AdmissionSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

    @action(detail=False, methods=['get'])
    def current(self, request):
        current_admissions = self.get_queryset().filter(discharge_time__isnull=True)
        serializer = self.get_serializer(current_admissions, many=True)
        return Response(serializer.data)