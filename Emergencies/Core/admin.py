from django.contrib import admin
from .models import (
    Patient, EmergencyVisit, VitalSign, Treatment, 
    Diagnosis, Bed, Admission, Staff, 
    InventoryItem, Prescription, Doctor, Nurse
)
from django.utils import timezone

class PatientAdmin(admin.ModelAdmin):
    list_display = ('last_name', 'first_name', 'date_of_birth', 'gender', 'phone_number')
    search_fields = ('last_name', 'first_name', 'phone_number', 'emergency_contact_phone')
    list_filter = ('gender',)
    fieldsets = (
        ('Personal Information', {
            'fields': ('first_name', 'last_name', 'date_of_birth', 'gender')
        }),
        ('Contact Information', {
            'fields': ('address', 'phone_number', 'emergency_contact_name', 'emergency_contact_phone')
        }),
        ('Medical Information', {
            'fields': ('blood_type', 'allergies', 'pre_existing_conditions')
        }),
        ('Insurance', {
            'fields': ('insurance_info',),
            'classes': ('collapse',)
        }),
    )

class VitalSignInline(admin.TabularInline):
    model = VitalSign
    extra = 0
    fields = ('recorded_at', 'temperature', 'heart_rate', 'blood_pressure_systolic', 
              'blood_pressure_diastolic', 'respiratory_rate', 'oxygen_saturation', 'pain_level')
    readonly_fields = ('recorded_at',)

class TreatmentInline(admin.TabularInline):
    model = Treatment
    extra = 0
    fields = ('treatment_type', 'name', 'administered_at', 'administered_by', 'outcome')
    readonly_fields = ('administered_at',)

class DiagnosisInline(admin.TabularInline):
    model = Diagnosis
    extra = 0
    fields = ('code', 'description', 'is_primary', 'diagnosed_by')
    readonly_fields = ('diagnosed_at',)

class EmergencyVisitAdmin(admin.ModelAdmin):
    list_display = ('patient', 'get_triage_level_display', 'discharge_time', 'is_admitted')
    list_filter = ('triage_level', 'is_admitted')
    search_fields = ('patient__first_name', 'patient__last_name', 'chief_complaint')
    inlines = [VitalSignInline, TreatmentInline, DiagnosisInline]
    fieldsets = (
        (None, {
            'fields': ('patient', 'triage_level', 'triage_nurse')
        }),
        ('Medical Information', {
            'fields': ('chief_complaint', 'initial_observation')
        }),
        ('Discharge Information', {
            'fields': ('discharge_time', 'discharge_diagnosis', 'discharge_instructions', 'is_admitted', 'attending_physician')
        }),
    )
    raw_id_fields = ('patient',)

class TreatmentAdmin(admin.ModelAdmin):
    list_display = ('visit', 'treatment_type', 'name', 'administered_at', 'administered_by')
    list_filter = ('treatment_type', 'administered_at')
    search_fields = ('name', 'visit__patient__first_name', 'visit__patient__last_name')
    raw_id_fields = ('visit', 'administered_by')

class DiagnosisAdmin(admin.ModelAdmin):
    list_display = ('visit', 'code', 'description', 'is_primary', 'diagnosed_by')
    list_filter = ('is_primary',)
    search_fields = ('code', 'description', 'visit__patient__first_name', 'visit__patient__last_name')
    raw_id_fields = ('visit', 'diagnosed_by')

class BedAdmin(admin.ModelAdmin):
    list_display = ('bed_number', 'status', 'location', 'is_isolation')
    list_filter = ('status', 'is_isolation', 'location')
    search_fields = ('bed_number', 'special_equipment')

class AdmissionAdmin(admin.ModelAdmin):
    list_display = ('visit', 'bed', 'admission_time', 'department', 'discharge_time')
    list_filter = ('department', 'admission_time')
    search_fields = ('visit__patient__first_name', 'visit__patient__last_name', 'department')
    raw_id_fields = ('visit', 'bed', 'admitted_by')

class StaffAdmin(admin.ModelAdmin):
    list_display = ('user', 'get_full_name', 'role', 'department', 'is_active')
    list_filter = ('role', 'department', 'is_active')
    search_fields = ('user__first_name', 'user__last_name', 'license_number')
    fieldsets = (
        ('User Information', {
            'fields': ('user',)
        }),
        ('Professional Information', {
            'fields': ('role', 'department', 'license_number', 'specialization')
        }),
        ('Employment Details', {
            'fields': ('hire_date', 'is_active', 'shift_schedule')
        }),
    )
    
    def get_full_name(self, obj):
        return obj.user.get_full_name()
    get_full_name.short_description = 'Full Name'

class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'quantity', 'unit', 'minimum_stock', 'last_restocked')
    list_filter = ('category',)
    search_fields = ('name', 'description', 'supplier')
    actions = ['mark_as_restocked']
    
    def mark_as_restocked(self, request, queryset):
        queryset.update(last_restocked=timezone.now())
        self.message_user(request, f"Updated restock time for {queryset.count()} items.")
    mark_as_restocked.short_description = "Mark selected items as restocked"

class PrescriptionAdmin(admin.ModelAdmin):
    list_display = ('visit', 'medication', 'dosage', 'prescribed_by', 'prescribed_at', 'is_dispensed')
    list_filter = ('is_dispensed', 'prescribed_at')
    search_fields = ('medication', 'visit__patient__first_name', 'visit__patient__last_name')
    raw_id_fields = ('visit', 'prescribed_by')


class DoctorAdmin(admin.ModelAdmin):
    list_display = ('user__first_name', 'user__last_name', 'date_of_birth', 'gender')
    list_filter = ('badge_number', 'work_unit')
    search_fields = ('user__first_name', 'user__last_name', 'badge_number', 'work_unit')


class NurseAdmin(admin.ModelAdmin):
    list_display = ('user__first_name', 'user__last_name', 'date_of_birth', 'gender')
    list_filter = ('badge_number', 'work_unit')
    search_fields = ('user__first_name', 'user__last_name', 'badge_number', 'work_unit')


admin.site.register(Patient, PatientAdmin)
admin.site.register(EmergencyVisit, EmergencyVisitAdmin)
admin.site.register(VitalSign)
admin.site.register(Treatment, TreatmentAdmin)
admin.site.register(Diagnosis, DiagnosisAdmin)
admin.site.register(Bed, BedAdmin)
admin.site.register(Admission, AdmissionAdmin)
admin.site.register(Staff, StaffAdmin)
admin.site.register(InventoryItem, InventoryItemAdmin)
admin.site.register(Prescription, PrescriptionAdmin)
admin.site.register(Doctor, DoctorAdmin)
admin.site.register(Nurse, NurseAdmin)