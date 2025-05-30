from rest_framework import viewsets
from .models import Patient, PatientFile
from .serializers import PatientSerializer, PatientFileSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().select_related() 
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'delete']

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