from django.contrib.admin import AdminSite
from django.contrib.auth.models import User, Group
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin, GroupAdmin as BaseGroupAdmin

from Core.models import (
    Patient, EmergencyVisit, VitalSign, Treatment,
    Diagnosis, Bed, Admission, Staff,
    InventoryItem, Prescription, Doctor, Nurse, PatientFile
)

from Core.admin import (
    PatientAdmin, EmergencyVisitAdmin, TreatmentAdmin,
    DiagnosisAdmin, BedAdmin, AdmissionAdmin, StaffAdmin,
    InventoryItemAdmin, PrescriptionAdmin, DoctorAdmin, NurseAdmin
)

class CustomAdminSite(AdminSite):
    site_header = "Emergencies Admin"
    site_title = "Emergencies Portal"
    index_title = "Welcome to Emergencies Management"

custom_site = CustomAdminSite(name='mycustomadmin')

custom_site.register(User, BaseUserAdmin)
custom_site.register(Group, BaseGroupAdmin) 
custom_site.register(Patient, PatientAdmin)
custom_site.register(EmergencyVisit, EmergencyVisitAdmin)
custom_site.register(VitalSign) 
custom_site.register(Treatment, TreatmentAdmin)
custom_site.register(Diagnosis, DiagnosisAdmin)
custom_site.register(Bed, BedAdmin)
custom_site.register(Admission, AdmissionAdmin)
custom_site.register(Staff, StaffAdmin)
custom_site.register(InventoryItem, InventoryItemAdmin)
custom_site.register(Prescription, PrescriptionAdmin)
custom_site.register(Doctor, DoctorAdmin)
custom_site.register(Nurse, NurseAdmin)

from django.contrib import admin 
class PatientFileAdmin(admin.ModelAdmin):
    list_display = ('patient', 'uploaded_file', 'uploaded_at')
    search_fields = ('patient__first_name', 'patient__last_name', 'uploaded_file')
    raw_id_fields = ('patient',)
custom_site.register(PatientFile, PatientFileAdmin)