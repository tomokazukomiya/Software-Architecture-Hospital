from rest_framework import serializers
from .models import Patient, PatientFile

class PatientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class PatientFileSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.all())
    uploaded_file = serializers.FileField()
    
    class Meta:
        model = PatientFile
        fields = '__all__'
        read_only_fields = ['uploaded_at']