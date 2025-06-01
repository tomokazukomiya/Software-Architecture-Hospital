from rest_framework import viewsets
from .models import Patient, PatientFile
from .serializers import PatientSerializer, PatientFileSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.all().select_related() 
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        queryset = super().get_queryset()
        last_name = self.request.query_params.get('last_name')
        if last_name:
            queryset = queryset.filter(last_name__icontains=last_name)
        return queryset
    
    @action(detail=False, methods=['get'])
    def count(self, request):
        count = self.get_queryset().count()
        return Response({'count': count}, status=status.HTTP_200_OK)

class PatientFileViewSet(viewsets.ModelViewSet):
    queryset = PatientFile.objects.all().select_related('patient')
    serializer_class = PatientFileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    def perform_create(self, serializer):
        serializer.save(patient_id=self.request.data.get('patient'))