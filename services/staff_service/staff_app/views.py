from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Staff, Doctor, Nurse
from .serializers import StaffSerializer, DoctorSerializer, NurseSerializer

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all().select_related('user')
    serializer_class = StaffSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    @action(detail=False, methods=['get'])
    def count(self, request):
        count = self.get_queryset().count()
        return Response({'count': count})

class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.all().select_related('user')
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

class NurseViewSet(viewsets.ModelViewSet):
    queryset = Nurse.objects.all().select_related('user')
    serializer_class = NurseSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']