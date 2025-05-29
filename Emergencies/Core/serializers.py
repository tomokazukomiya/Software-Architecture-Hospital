from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Patient, PatientFile, EmergencyVisit, VitalSign, Treatment,
    Diagnosis, Staff, InventoryItem, Prescription, Doctor,
    Nurse, Bed, Admission
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']

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

class EmergencyVisitSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.all())
    attending_physician = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True)
    triage_nurse = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True)
    
    class Meta:
        model = EmergencyVisit
        fields = '__all__'
        read_only_fields = ['arrival_time']

class VitalSignSerializer(serializers.ModelSerializer):
    visit = serializers.PrimaryKeyRelatedField(queryset=EmergencyVisit.objects.all())
    recorded_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True)
    
    class Meta:
        model = VitalSign
        fields = '__all__'
        read_only_fields = ['recorded_at']

class TreatmentSerializer(serializers.ModelSerializer):
    visit = serializers.PrimaryKeyRelatedField(queryset=EmergencyVisit.objects.all())
    administered_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True)
    
    class Meta:
        model = Treatment
        fields = '__all__'
        read_only_fields = ['administered_at']

class DiagnosisSerializer(serializers.ModelSerializer):
    visit = serializers.PrimaryKeyRelatedField(queryset=EmergencyVisit.objects.all())
    diagnosed_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True)
    
    class Meta:
        model = Diagnosis
        fields = '__all__'
        read_only_fields = ['diagnosed_at']

class StaffSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    
    class Meta:
        model = Staff
        fields = '__all__'

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['last_restocked']

class PrescriptionSerializer(serializers.ModelSerializer):
    visit = serializers.PrimaryKeyRelatedField(queryset=EmergencyVisit.objects.all())
    prescribed_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True)
    
    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ['prescribed_at']

class DoctorSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    
    class Meta:
        model = Doctor
        fields = '__all__'

class NurseSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    
    class Meta:
        model = Nurse
        fields = '__all__'

class BedSerializer(serializers.ModelSerializer):
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.all(), allow_null=True)
    doctor = serializers.PrimaryKeyRelatedField(queryset=Doctor.objects.all(), allow_null=True)
    nurse = serializers.PrimaryKeyRelatedField(queryset=Nurse.objects.all(), allow_null=True)
    
    class Meta:
        model = Bed
        fields = '__all__'

class AdmissionSerializer(serializers.ModelSerializer):
    visit = serializers.PrimaryKeyRelatedField(queryset=EmergencyVisit.objects.all())
    bed = serializers.PrimaryKeyRelatedField(queryset=Bed.objects.all(), allow_null=True)
    admitted_by = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), allow_null=True)
    
    class Meta:
        model = Admission
        fields = '__all__'
        read_only_fields = ['admission_time']