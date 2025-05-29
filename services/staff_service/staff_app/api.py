from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Doctor, Nurse, Staff
from .serializers import DoctorSerializer, NurseSerializer, StaffSerializer

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

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all().select_related('user')
    serializer_class = StaffSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']