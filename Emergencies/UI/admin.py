from django.contrib import admin
from django.template.response import TemplateResponse
from django.urls import path
from django.db.models import Count, Case, When, IntegerField
from Core.models import EmergencyVisit, Patient, Staff, InventoryItem, Bed
from django.db import models
from django.contrib import admin
from django.views.decorators.cache import never_cache

class CustomAdminSite(admin.AdminSite):
    @never_cache
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
            path('custom-dashboard/', self.admin_view(self.custom_dashboard),
                name='custom_dashboard'),
            path('logout/', self.logout, name='logout'),
        ]
        return custom_urls + urls

    def custom_dashboard(self, request):
        context = {
            **self.each_context(request),
            'emergency_count': EmergencyVisit.objects.filter(discharge_time__isnull=True).count(),
            'patient_count': Patient.objects.count(),
            'staff_count': Staff.objects.count(),
            'low_inventory_count': InventoryItem.objects.filter(quantity__lt=models.F('minimum_stock')).count(),
            'recent_visits': EmergencyVisit.objects.select_related('patient').order_by('-arrival_time')[:10],
            
            'triage_labels': ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'],
            'triage_data': list(EmergencyVisit.objects
                .values('triage_level')
                .annotate(count=Count('triage_level'))
                .order_by('triage_level')
                .values_list('count', flat=True)),
            
            'bed_data': [
                Bed.objects.filter(status='AVAIL').count(),
                Bed.objects.filter(status='OCCUP').count(),
                Bed.objects.filter(status='MAINT').count(),
            ]
        }
        return TemplateResponse(request, 'templates/admin/index.html', context)