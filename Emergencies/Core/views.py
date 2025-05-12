from django.shortcuts import render, redirect, get_object_or_404
from .models import Patient, PatientFile
from .forms import PatientForm

def patient_list(request):
    patients = Patient.objects.all()
    return render(request, 'admin/core/patient/change_list.html', {'patients': patients})

def create_patient(request):
    if request.method == 'POST':
        form = PatientForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('admin/core/patient/change_list.html')
    else:
        form = PatientForm()
    return render(request, 'admin/core/patient/create.html', {'form': form})

def upload_file(request, patient_id):
    patient = get_object_or_404(Patient, id=patient_id)
    if request.method == 'POST' and request.FILES['uploaded_file']:
        PatientFile.objects.create(patient=patient, uploaded_file=request.FILES['uploaded_file'])
    return redirect('admin/core/patient/change_list.html')

