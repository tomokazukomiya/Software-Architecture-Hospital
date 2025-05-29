from rest_framework import viewsets, permissions
from .models import Staff, Doctor, Nurse
from .serializers import StaffSerializer, DoctorSerializer, NurseSerializer

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all().select_related('user')
    serializer_class = StaffSerializer
    permission_classes = [permissions.IsAuthenticated]

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all().select_related('user')
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]

class NurseViewSet(viewsets.ModelViewSet):
    queryset = Nurse.objects.all().select_related('user')
    serializer_class = NurseSerializer
    permission_classes = [permissions.IsAuthenticated]