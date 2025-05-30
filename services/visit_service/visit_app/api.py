from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import (
    EmergencyVisit, VitalSign, Treatment,
    Diagnosis, Prescription, Bed, Admission
)
from .serializers import (
    EmergencyVisitSerializer, VitalSignSerializer,
    TreatmentSerializer, DiagnosisSerializer,
    PrescriptionSerializer, BedSerializer,
    AdmissionSerializer
)
from django.db import models


class EmergencyVisitViewSet(viewsets.ModelViewSet):
    queryset = EmergencyVisit.objects.all()
    serializer_class = EmergencyVisitSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'patient_id': ['exact'],
        'triage_level': ['exact', 'lte', 'gte'],
        'arrival_time': ['date', 'gte', 'lte'],
        'is_admitted': ['exact'],
        'attending_physician_id': ['exact'],
        'triage_nurse_id': ['exact'],
    }
    search_fields = ['chief_complaint', 'initial_observation']
    ordering_fields = ['arrival_time', 'triage_level']
    ordering = ['-arrival_time']
    http_method_names = ['get', 'post', 'patch', 'delete']

    @action(detail=True, methods=['patch'])
    def discharge(self, request, pk=None):
        visit = self.get_object()
        if visit.discharge_time:
            return Response(
                {"detail": "Visit already discharged"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(
            visit,
            data={
                'discharge_time': timezone.now(),
                'discharge_diagnosis': request.data.get('discharge_diagnosis'),
                'discharge_instructions': request.data.get('discharge_instructions')
            },
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        queryset = self.filter_queryset(
            self.get_queryset().filter(discharge_time__isnull=True)
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        stats = {
            'total': self.get_queryset().count(),
            'active': self.get_queryset().filter(discharge_time__isnull=True).count(),
            'admitted': self.get_queryset().filter(is_admitted=True).count(),
            'by_triage_level': dict(
                self.get_queryset().values_list('triage_level')
                .annotate(count=models.Count('id'))
                .order_by('triage_level')
            ),
        }
        return Response(stats)

class VitalSignViewSet(viewsets.ModelViewSet):
    serializer_class = VitalSignSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['visit_id']
    ordering_fields = ['recorded_at']
    ordering = ['-recorded_at']
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        queryset = VitalSign.objects.all()
        visit_id = self.request.query_params.get('visit_id')
        if visit_id:
            queryset = queryset.filter(visit_id=visit_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(recorded_by_id=self.request.user.id)

class TreatmentViewSet(viewsets.ModelViewSet):
    serializer_class = TreatmentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['visit_id', 'treatment_type']
    search_fields = ['name', 'description']
    ordering_fields = ['administered_at']
    ordering = ['-administered_at']
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_queryset(self):
        return Treatment.objects.all()

    def perform_create(self, serializer):
        serializer.save(administered_by_id=self.request.user.id)

class DiagnosisViewSet(viewsets.ModelViewSet):
    serializer_class = DiagnosisSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['visit_id', 'is_primary']
    search_fields = ['code', 'description']
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_queryset(self):
        return Diagnosis.objects.all()

    def perform_create(self, serializer):
        serializer.save(diagnosed_by_id=self.request.user.id)

class PrescriptionViewSet(viewsets.ModelViewSet):
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['visit_id', 'is_dispensed']
    search_fields = ['medication']
    ordering_fields = ['prescribed_at']
    ordering = ['-prescribed_at']
    http_method_names = ['get', 'post', 'patch', 'delete']

    def get_queryset(self):
        return Prescription.objects.all()

    def perform_create(self, serializer):
        serializer.save(prescribed_by_id=self.request.user.id)

    @action(detail=True, methods=['patch'])
    def dispense(self, request, pk=None):
        prescription = self.get_object()
        if prescription.is_dispensed:
            return Response(
                {"detail": "Prescription already dispensed"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        prescription.is_dispensed = True
        prescription.save()
        serializer = self.get_serializer(prescription)
        return Response(serializer.data)

class BedViewSet(viewsets.ModelViewSet):
    queryset = Bed.objects.all()
    serializer_class = BedSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = {
        'status': ['exact'],
        'location': ['exact', 'icontains'],
        'is_isolation': ['exact'],
        'patient_id': ['exact', 'isnull'],
    }
    search_fields = ['bed_number', 'special_equipment']
    ordering_fields = ['bed_number', 'last_cleaned']
    ordering = ['bed_number']
    http_method_names = ['get', 'post', 'patch', 'delete']

    @action(detail=False, methods=['get'])
    def available(self, request):
        queryset = self.filter_queryset(
            self.get_queryset().filter(status='AVAIL')
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        stats = {
            'total': self.get_queryset().count(),
            'available': self.get_queryset().filter(status='AVAIL').count(),
            'occupied': self.get_queryset().filter(status='OCCUP').count(),
            'by_location': dict(
                self.get_queryset().values_list('location')
                .annotate(count=models.Count('id'))
                .order_by('location')
            ),
        }
        return Response(stats)

    @action(detail=True, methods=['patch'])
    def clean(self, request, pk=None):
        bed = self.get_object()
        bed.last_cleaned = timezone.now()
        bed.save()
        serializer = self.get_serializer(bed)
        return Response(serializer.data)

class AdmissionViewSet(viewsets.ModelViewSet):
    queryset = Admission.objects.all()
    serializer_class = AdmissionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = {
        'visit_id': ['exact'],
        'bed_id': ['exact', 'isnull'],
        'department': ['exact', 'icontains'],
        'admission_time': ['date', 'gte', 'lte'],
        'discharge_time': ['date', 'gte', 'lte', 'isnull'],
    }
    ordering_fields = ['admission_time', 'discharge_time']
    ordering = ['-admission_time']
    http_method_names = ['get', 'post', 'patch', 'delete']

    @action(detail=True, methods=['patch'])
    def discharge(self, request, pk=None):
        admission = self.get_object()
        if admission.discharge_time:
            return Response(
                {"detail": "Patient already discharged"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(
            admission,
            data={'discharge_time': timezone.now()},
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Libera il letto se esiste
        if admission.bed:
            admission.bed.patient_id = None
            admission.bed.status = 'AVAIL'
            admission.bed.save()
        
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def current(self, request):
        queryset = self.filter_queryset(
            self.get_queryset().filter(discharge_time__isnull=True)
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def department_stats(self, request):
        stats = dict(
            Admission.objects.values_list('department')
            .annotate(
                count=models.Count('id'),
                current=models.Count('id', filter=models.Q(discharge_time__isnull=True))
            )
            .order_by('department')
        )
        return Response(stats)