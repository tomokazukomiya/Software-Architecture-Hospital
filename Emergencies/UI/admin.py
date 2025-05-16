from django.contrib import admin
from django.template.response import TemplateResponse
from django.urls import path
from django.db.models import Count, F 
from Core.models import (
    EmergencyVisit, Patient, Staff, InventoryItem, Bed, Doctor, Nurse,
    VitalSign, Treatment, Diagnosis, Admission, Prescription
)
from Core.admin import (
    PatientAdmin, EmergencyVisitAdmin, BedAdmin, StaffAdmin, InventoryItemAdmin,
    DoctorAdmin, NurseAdmin, VitalSignInline, TreatmentAdmin, DiagnosisAdmin,
    AdmissionAdmin, PrescriptionAdmin
)
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache


class CustomAdminSite(admin.AdminSite):
    @method_decorator(never_cache)
    def logout(self, request, extra_context=None):
        """
        Override the logout view to handle doctor logout properly
        """
        from django.contrib.auth.views import LogoutView
        defaults = {
            'extra_context': {
                **self.each_context(request),
                'title': 'Logout',
                **(extra_context or {}),
            },
        }
        if self.logout_template is not None:
            defaults['template_name'] = self.logout_template
        return LogoutView.as_view(**defaults)(request)

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [

            path('logout/', self.logout, name='logout'),
        ]
        return custom_urls + urls

    @method_decorator(never_cache)
    def index(self, request, extra_context=None):
        triage_level_choices = EmergencyVisit.TRIAGE_LEVEL_CHOICES
        triage_counts_from_db = EmergencyVisit.objects.values('triage_level').annotate(count=Count('id')).order_by('triage_level')
        triage_data_map = {item['triage_level']: item['count'] for item in triage_counts_from_db}
        
        triage_labels = [label for value, label in triage_level_choices]
        triage_data = [triage_data_map.get(value, 0) for value, label in triage_level_choices]

        total_staff_count = Staff.objects.count()

        context = {
            **self.each_context(request),
            'emergency_count': EmergencyVisit.objects.filter(discharge_time__isnull=True).count(),
            'patient_count': Patient.objects.count(),
            'staff_count': total_staff_count,
            'low_inventory_count': InventoryItem.objects.filter(quantity__lt=F('minimum_stock')).count(),
            'recent_visits': EmergencyVisit.objects.select_related('patient').order_by('-arrival_time')[:10],
            
            'triage_labels': triage_labels,
            'triage_data': triage_data,
            
            'bed_data': [
                Bed.objects.filter(status='AVAIL').count(),
                Bed.objects.filter(status='OCCUP').count(),
                Bed.objects.filter(status='MAINT').count(),
            ],

        }
        if extra_context:
            context.update(extra_context)
        return TemplateResponse(request, 'admin/index.html', context)

custom_site = CustomAdminSite(name='myadmin') 

custom_site.register(Patient, PatientAdmin)
custom_site.register(EmergencyVisit, EmergencyVisitAdmin)
custom_site.register(Bed, BedAdmin)
custom_site.register(Staff, StaffAdmin)
custom_site.register(InventoryItem, InventoryItemAdmin)
custom_site.register(Doctor, DoctorAdmin)
custom_site.register(Nurse, NurseAdmin)
custom_site.register(VitalSign)
custom_site.register(Treatment, TreatmentAdmin)
custom_site.register(Diagnosis, DiagnosisAdmin)
custom_site.register(Admission, AdmissionAdmin)
custom_site.register(Prescription, PrescriptionAdmin)