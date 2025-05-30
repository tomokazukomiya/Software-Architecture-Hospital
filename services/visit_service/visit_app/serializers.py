from rest_framework import serializers
import requests
import logging
import os
from .models import (
    EmergencyVisit, VitalSign, Treatment, Diagnosis, Prescription, Bed, Admission
)

logger = logging.getLogger(__name__)

STAFF_SERVICE_BASE_URL = os.getenv("STAFF_SERVICE_URL", "http://staff_service:8000/api/")
PATIENT_SERVICE_BASE_URL = os.getenv("PATIENT_SERVICE_URL", "http://patient_service:8000/api/")
AUTH_SERVICE_BASE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth_service:8000/api/")
INTERNAL_SERVICE_TOKEN = os.getenv("INTERNAL_SERVICE_TOKEN")

def _get_auth_header():
    if not INTERNAL_SERVICE_TOKEN:
        logger.warning("INTERNAL_SERVICE_TOKEN is not configured. Calls between services might fail or not be authenticated.")
        return {}
    return {"Authorization": f"Bearer {INTERNAL_SERVICE_TOKEN}"}

def _make_authenticated_request(url, entity_type, entity_id, field_name_for_error="entity"):
    auth_header = _get_auth_header()
    if not entity_id:
        return None

    full_url = f"{url.rstrip('/')}/{entity_type.strip('/')}/{entity_id}/"
    
    try:
        response = requests.get(full_url, headers=auth_header, timeout=3)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            logger.warning(f"{entity_type.capitalize()} with ID {entity_id} not found at {full_url}.")
        else:
            logger.error(f"HTTP error {e.response.status_code} while retrieving {entity_type} {entity_id} from {full_url}: {e.response.text}")
        return {"id": entity_id, "error": f"Could not retrieve details for {field_name_for_error}."}
    except requests.exceptions.RequestException as e:
        logger.error(f"Request error while retrieving {entity_type} {entity_id} from {full_url}: {e}")
        return {"id": entity_id, "error": f"Communication error while retrieving details for {field_name_for_error}."}

def _validate_external_entity(url, entity_type, entity_id, field_name):
    auth_header = _get_auth_header()
    if entity_id is None:
        return entity_id
        
    if not auth_header and entity_id:
        logger.error(f"Cannot validate {entity_type} {entity_id}: INTERNAL_SERVICE_TOKEN is not configured.")
    
    full_url = f"{url.rstrip('/')}/{entity_type.strip('/')}/{entity_id}/"

    try:
        response = requests.get(full_url, headers=auth_header, timeout=2)
        response.raise_for_status()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            raise serializers.ValidationError({field_name: f"{entity_type.capitalize().rstrip('s')} con ID {entity_id} non trovato."})
        raise serializers.ValidationError({field_name: f"Errore ({e.response.status_code}) nel validare {entity_type.capitalize().rstrip('s')} con ID {entity_id}."})
    except requests.exceptions.RequestException:
        raise serializers.ValidationError({field_name: f"Errore di comunicazione nel validare {entity_type.capitalize().rstrip('s')} con ID {entity_id}."})
    return entity_id

class EmergencyVisitSerializer(serializers.ModelSerializer):
    patient_id = serializers.IntegerField()
    attending_physician_id = serializers.IntegerField(allow_null=True, required=False)
    triage_nurse_id = serializers.IntegerField(allow_null=True, required=False)

    patient_details = serializers.SerializerMethodField(read_only=True)
    attending_physician_details = serializers.SerializerMethodField(read_only=True)
    triage_nurse_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = EmergencyVisit
        fields = [
            'id', 'patient_id', 'arrival_time', 'triage_level', 'chief_complaint',
            'initial_observation', 'discharge_time', 'discharge_diagnosis',
            'discharge_instructions', 'is_admitted',
            'attending_physician_id', 'triage_nurse_id',
            'patient_details', 'attending_physician_details', 'triage_nurse_details'
        ]
        read_only_fields = ['arrival_time', 'discharge_time']

    def get_patient_details(self, obj):
        return _make_authenticated_request(
            PATIENT_SERVICE_BASE_URL, "patients", obj.patient_id, "patient"
        )

    def get_attending_physician_details(self, obj):
        return _make_authenticated_request(
            STAFF_SERVICE_BASE_URL, "doctors", obj.attending_physician_id, "attending physician"
        )

    def get_triage_nurse_details(self, obj):
        return _make_authenticated_request(
            STAFF_SERVICE_BASE_URL, "nurses", obj.triage_nurse_id, "triage nurse"
        )

    def validate_patient_id(self, value):
        return _validate_external_entity(
            PATIENT_SERVICE_BASE_URL, "patients", value, "patient_id"
        )
    def validate_attending_physician_id(self, value):
        return _validate_external_entity(
            STAFF_SERVICE_BASE_URL, "doctors", value, "attending_physician_id"
        )
    def validate_triage_nurse_id(self, value):
        return _validate_external_entity(
            STAFF_SERVICE_BASE_URL, "nurses", value, "triage_nurse_id"
        )

class VitalSignSerializer(serializers.ModelSerializer):
    visit_id = serializers.IntegerField(source='visit.id', read_only=True, required=False)
    recorded_by_id = serializers.IntegerField(allow_null=True, required=False)
    recorded_by_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = VitalSign
        fields = [
            'id', 'visit', 'visit_id',
            'recorded_by_id', 'recorded_at',
            'temperature', 'heart_rate', 'blood_pressure_systolic',
            'blood_pressure_diastolic', 'respiratory_rate', 'oxygen_saturation',
            'pain_level', 'gcs_score', 'notes', 'recorded_by_details'
        ]
        read_only_fields = ['recorded_at', 'visit_id']
        extra_kwargs = {
            'visit': {'queryset': EmergencyVisit.objects.all(), 'write_only': False}
        }


    def get_recorded_by_details(self, obj):
        return _make_authenticated_request(
            AUTH_SERVICE_BASE_URL, "users", obj.recorded_by_id, "recording user"
        )

    def validate_recorded_by_id(self, value):
        return _validate_external_entity(
            AUTH_SERVICE_BASE_URL, "users", value, "recorded_by_id"
        )

class TreatmentSerializer(serializers.ModelSerializer):
    visit_id = serializers.IntegerField(source='visit.id', read_only=True, required=False)
    administered_by_id = serializers.IntegerField(allow_null=True, required=False)
    administered_by_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Treatment
        fields = [
            'id', 'visit', 'visit_id', 'treatment_type', 'name', 'description',
            'administered_by_id', 'administered_at', 'dosage',
            'outcome', 'complications', 'administered_by_details'
        ]
        read_only_fields = ['administered_at', 'visit_id']
        extra_kwargs = {
            'visit': {'queryset': EmergencyVisit.objects.all(), 'write_only': False}
        }

    def get_administered_by_details(self, obj):
        return _make_authenticated_request(
            AUTH_SERVICE_BASE_URL, "users", obj.administered_by_id, "administering user"
        )

    def validate_administered_by_id(self, value):
        return _validate_external_entity(
            AUTH_SERVICE_BASE_URL, "users", value, "administered_by_id"
        )

class DiagnosisSerializer(serializers.ModelSerializer):
    visit_id = serializers.IntegerField(source='visit.id', read_only=True, required=False)
    diagnosed_by_id = serializers.IntegerField(allow_null=True, required=False)
    diagnosed_by_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Diagnosis
        fields = [
            'id', 'visit', 'visit_id', 'code', 'description', 'diagnosed_by_id',
            'diagnosed_at', 'is_primary', 'notes', 'diagnosed_by_details'
        ]
        read_only_fields = ['diagnosed_at', 'visit_id']
        extra_kwargs = {
            'visit': {'queryset': EmergencyVisit.objects.all(), 'write_only': False}
        }

    def get_diagnosed_by_details(self, obj):
        return _make_authenticated_request(
            AUTH_SERVICE_BASE_URL, "users", obj.diagnosed_by_id, "diagnosing physician"
        )

    def validate_diagnosed_by_id(self, value):
        return _validate_external_entity(
            AUTH_SERVICE_BASE_URL, "users", value, "diagnosed_by_id"
        )

class PrescriptionSerializer(serializers.ModelSerializer):
    visit_id = serializers.IntegerField(source='visit.id', read_only=True, required=False)
    prescribed_by_id = serializers.IntegerField(allow_null=True, required=False)
    prescribed_by_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Prescription
        fields = [
            'id', 'visit', 'visit_id', 'medication', 'dosage', 'frequency', 'duration',
            'prescribed_by_id', 'prescribed_at', 'instructions', 'is_dispensed',
            'refills', 'prescribed_by_details'
        ]
        read_only_fields = ['prescribed_at', 'visit_id']
        extra_kwargs = {
            'visit': {'queryset': EmergencyVisit.objects.all(), 'write_only': False}
        }

    def get_prescribed_by_details(self, obj):
        return _make_authenticated_request(
            AUTH_SERVICE_BASE_URL, "users", obj.prescribed_by_id, "prescribing physician"
        )

    def validate_prescribed_by_id(self, value):
        return _validate_external_entity(
            AUTH_SERVICE_BASE_URL, "users", value, "prescribed_by_id"
        )

class BedSerializer(serializers.ModelSerializer):
    patient_id = serializers.IntegerField(allow_null=True, required=False)
    doctor_id = serializers.IntegerField(allow_null=True, required=False)
    nurse_id = serializers.IntegerField(allow_null=True, required=False)

    patient_details = serializers.SerializerMethodField(read_only=True)
    doctor_details = serializers.SerializerMethodField(read_only=True)
    nurse_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Bed
        fields = [
            'id', 'bed_number', 'status', 'location', 'is_isolation',
            'special_equipment', 'last_cleaned',
            'patient_id', 'doctor_id', 'nurse_id',
            'patient_details', 'doctor_details', 'nurse_details'
        ]

    def get_patient_details(self, obj):
        return _make_authenticated_request(
            PATIENT_SERVICE_BASE_URL, "patients", obj.patient_id, "patient"
        )

    def get_doctor_details(self, obj):
        return _make_authenticated_request(
            STAFF_SERVICE_BASE_URL, "doctors", obj.doctor_id, "doctor"
        )

    def get_nurse_details(self, obj):
        return _make_authenticated_request(
            STAFF_SERVICE_BASE_URL, "nurses", obj.nurse_id, "nurse"
        )

    def validate_patient_id(self, value):
        return _validate_external_entity(
            PATIENT_SERVICE_BASE_URL, "patients", value, "patient_id"
        )
    def validate_doctor_id(self, value):
        return _validate_external_entity(
            STAFF_SERVICE_BASE_URL, "doctors", value, "doctor_id"
        )
    def validate_nurse_id(self, value):
        return _validate_external_entity(
            STAFF_SERVICE_BASE_URL, "nurses", value, "nurse_id"
        )

class AdmissionSerializer(serializers.ModelSerializer):
    visit_id = serializers.IntegerField(source='visit.id', read_only=True, required=False)
    bed_id = serializers.IntegerField(source='bed.id', allow_null=True, required=False, read_only=True)
    admitted_by_id = serializers.IntegerField(required=False)
    admitted_by_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Admission
        fields = [
            'id', 'visit', 'visit_id', 'bed', 'bed_id', 'admitted_by_id',
            'admission_time', 'discharge_time', 'admitting_diagnosis',
            'department', 'notes', 'admitted_by_details'
        ]
        read_only_fields = ['admission_time', 'visit_id', 'bed_id']
        extra_kwargs = {
            'visit': {'queryset': EmergencyVisit.objects.all(), 'write_only': False},
            'bed': {'queryset': Bed.objects.all(), 'allow_null': True, 'required': False, 'write_only': False}
        }


    def get_admitted_by_details(self, obj):
        return _make_authenticated_request(
            AUTH_SERVICE_BASE_URL, "users", obj.admitted_by_id, "admitting user"
        )

    def validate_admitted_by_id(self, value):
        return _validate_external_entity(
            AUTH_SERVICE_BASE_URL, "users", value, "admitted_by_id"
        )
