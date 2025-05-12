from django.template.response import TemplateResponse
from django.utils.translation import gettext_lazy as _
from Core.models import Bed, Doctor#, Email
from django.shortcuts import render
from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import get_object_or_404

@login_required
@user_passes_test(lambda u: u.is_staff)
def doctor_view(request, doctor_id=None):
        if doctor_id is None:
            doctor = get_object_or_404(Doctor, user=request.user)
        else:
            doctor = get_object_or_404(Doctor, id=doctor_id)
        
        assigned_beds = Bed.objects.filter(doctor=doctor, status='OCCUP').select_related(
            'patient', 'nurse', 'doctor'
        ).prefetch_related(
            'patient__emergencyvisit_set',
            'patient__emergencyvisit_set__vital_signs',
            'patient__emergencyvisit_set__treatments',
            'patient__emergencyvisit_set__diagnoses'
        )
        
        context = {
            'title': 'Doctor Dashboard',
            'doctor': doctor,
            'assigned_beds': assigned_beds,
        }

        return TemplateResponse(request, 'admin/doctor_view.html', context)

def send_test_email(email):
    template = 'email/test_email.html'
    context = {
        'subject': "This is a test email",
        'to_email': email,
    }
    send_email.delay(template, context)  # Delay execution using Celery (optional)




