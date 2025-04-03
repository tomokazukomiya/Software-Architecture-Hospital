from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
        ('U', 'Unknown'),
    ]
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    address = models.TextField()
    phone_number = models.CharField(max_length=20)
    emergency_contact_name = models.CharField(max_length=200)
    emergency_contact_phone = models.CharField(max_length=20)
    blood_type = models.CharField(max_length=5, blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    pre_existing_conditions = models.TextField(blank=True, null=True)
    insurance_info = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.date_of_birth})"

class EmergencyVisit(models.Model):
    TRIAGE_LEVEL_CHOICES = [
        (1, 'Resuscitation (Immediate)'),
        (2, 'Emergency (Very Urgent)'),
        (3, 'Urgent'),
        (4, 'Less Urgent'),
        (5, 'Non-Urgent'),
    ]
    
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE)
    arrival_time = models.DateTimeField(auto_now_add=True)
    triage_level = models.IntegerField(choices=TRIAGE_LEVEL_CHOICES)
    chief_complaint = models.TextField()
    initial_observation = models.TextField(blank=True, null=True)
    discharge_time = models.DateTimeField(blank=True, null=True)
    discharge_diagnosis = models.TextField(blank=True, null=True)
    discharge_instructions = models.TextField(blank=True, null=True)
    is_admitted = models.BooleanField(default=False)
    attending_physician = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='attending_visits')
    triage_nurse = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='triaged_visits')
    
    def __str__(self):
        return f"{self.patient} - {self.get_triage_level_display()} - {self.arrival_time}"

class VitalSign(models.Model):
    visit = models.ForeignKey(EmergencyVisit, on_delete=models.CASCADE, related_name='vital_signs')
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    recorded_at = models.DateTimeField(auto_now_add=True)
    temperature = models.DecimalField(max_digits=4, decimal_places=1, blank=True, null=True)
    heart_rate = models.PositiveIntegerField(blank=True, null=True)
    blood_pressure_systolic = models.PositiveIntegerField(blank=True, null=True)
    blood_pressure_diastolic = models.PositiveIntegerField(blank=True, null=True)
    respiratory_rate = models.PositiveIntegerField(blank=True, null=True)
    oxygen_saturation = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        blank=True, null=True
    )
    pain_level = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        blank=True, null=True
    )
    gcs_score = models.PositiveIntegerField(
        validators=[MinValueValidator(3), MaxValueValidator(15)],
        blank=True, null=True,
        help_text="Glasgow Coma Scale score (3-15)"
    )
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Vitals for {self.visit.patient} at {self.recorded_at}"

class Treatment(models.Model):
    TREATMENT_TYPE_CHOICES = [
        ('MED', 'Medication'),
        ('PROC', 'Procedure'),
        ('TEST', 'Diagnostic Test'),
        ('OTHER', 'Other'),
    ]
    
    visit = models.ForeignKey(EmergencyVisit, on_delete=models.CASCADE, related_name='treatments')
    treatment_type = models.CharField(max_length=5, choices=TREATMENT_TYPE_CHOICES)
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    administered_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    administered_at = models.DateTimeField(auto_now_add=True)
    dosage = models.CharField(max_length=100, blank=True, null=True)
    outcome = models.TextField(blank=True, null=True)
    complications = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.get_treatment_type_display()}: {self.name} for {self.visit.patient}"

class Diagnosis(models.Model):
    visit = models.ForeignKey(EmergencyVisit, on_delete=models.CASCADE, related_name='diagnoses')
    code = models.CharField(max_length=20, help_text="ICD-10 code")
    description = models.TextField()
    diagnosed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    diagnosed_at = models.DateTimeField(auto_now_add=True)
    is_primary = models.BooleanField(default=False)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.code}: {self.description} for {self.visit.patient}"

class Bed(models.Model):
    BED_STATUS_CHOICES = [
        ('AVAIL', 'Available'),
        ('OCCUP', 'Occupied'),
        ('MAINT', 'Maintenance'),
        ('RESERV', 'Reserved'),
    ]
    
    bed_number = models.CharField(max_length=10, unique=True)
    status = models.CharField(max_length=6, choices=BED_STATUS_CHOICES, default='AVAIL')
    location = models.CharField(max_length=100)
    is_isolation = models.BooleanField(default=False)
    special_equipment = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"Bed {self.bed_number} ({self.get_status_display()})"

class Admission(models.Model):
    visit = models.OneToOneField(EmergencyVisit, on_delete=models.CASCADE, related_name='admission')
    bed = models.ForeignKey(Bed, on_delete=models.SET_NULL, null=True)
    admitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    admission_time = models.DateTimeField(auto_now_add=True)
    discharge_time = models.DateTimeField(blank=True, null=True)
    admitting_diagnosis = models.TextField()
    department = models.CharField(max_length=100)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Admission of {self.visit.patient} to {self.department}"

class Staff(models.Model):
    ROLE_CHOICES = [
        ('DOC', 'Doctor'),
        ('NUR', 'Nurse'),
        ('TEC', 'Technician'),
        ('ADM', 'Administrator'),
        ('RES', 'Resident'),
        ('INT', 'Intern'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=3, choices=ROLE_CHOICES)
    department = models.CharField(max_length=100)
    license_number = models.CharField(max_length=50, blank=True, null=True)
    specialization = models.CharField(max_length=100, blank=True, null=True)
    hire_date = models.DateField()
    is_active = models.BooleanField(default=True)
    shift_schedule = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.user.get_full_name()} ({self.get_role_display()})"

class InventoryItem(models.Model):
    CATEGORY_CHOICES = [
        ('MED', 'Medication'),
        ('EQUIP', 'Equipment'),
        ('SUPP', 'Medical Supplies'),
        ('OTHER', 'Other'),
    ]
    
    name = models.CharField(max_length=200)
    category = models.CharField(max_length=5, choices=CATEGORY_CHOICES)
    description = models.TextField(blank=True, null=True)
    quantity = models.PositiveIntegerField()
    unit = models.CharField(max_length=20)
    minimum_stock = models.PositiveIntegerField()
    last_restocked = models.DateTimeField(auto_now=True)
    supplier = models.CharField(max_length=200, blank=True, null=True)
    location = models.CharField(max_length=100, blank=True, null=True)
    expiry_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return f"{self.name} ({self.quantity} {self.unit})"

class Prescription(models.Model):
    visit = models.ForeignKey(EmergencyVisit, on_delete=models.CASCADE, related_name='prescriptions')
    medication = models.CharField(max_length=200)
    dosage = models.CharField(max_length=100)
    frequency = models.CharField(max_length=100)
    duration = models.CharField(max_length=100)
    prescribed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    prescribed_at = models.DateTimeField(auto_now_add=True)
    instructions = models.TextField(blank=True, null=True)
    is_dispensed = models.BooleanField(default=False)
    refills = models.PositiveIntegerField(default=0)

    def __str__(self):
        return f"{self.medication} for {self.visit.patient}"