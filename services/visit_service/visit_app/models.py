from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class EmergencyVisit(models.Model):
    TRIAGE_LEVEL_CHOICES = [
        (1, 'Resuscitation (Immediate)'),
        (2, 'Emergency (Very Urgent)'), 
        (3, 'Urgent'),
        (4, 'Less Urgent'),
        (5, 'Non-Urgent'),
    ]
    
    patient_id = models.IntegerField(help_text="Patient ID from the patient service")
    arrival_time = models.DateTimeField(auto_now_add=True)
    triage_level = models.IntegerField(
        choices=TRIAGE_LEVEL_CHOICES,
        default=3,
        help_text="Urgency level (1=Highest, 5=Lowest)"
    )
    chief_complaint = models.TextField(help_text="Main reason for the visit")
    initial_observation = models.TextField(
        blank=True, 
        null=True,
        help_text="Initial triage observations"
    )
    discharge_time = models.DateTimeField(
        blank=True, 
        null=True,
        help_text="Date/Time of discharge"
    )
    discharge_diagnosis = models.TextField(
        blank=True, 
        null=True,
        help_text="Final diagnosis"
    )
    discharge_instructions = models.TextField(
        blank=True, 
        null=True,
        help_text="Instructions for the patient"
    )
    is_admitted = models.BooleanField(default=False, help_text="If the patient was admitted")
    attending_physician_id = models.IntegerField(null=True, blank=True, help_text="Attending physician ID from the staff service")
    triage_nurse_id = models.IntegerField(null=True, blank=True, help_text="Triage nurse ID from the staff service")
    
    class Meta:
        ordering = ['-arrival_time']
        verbose_name = "Emergency Visit"
        verbose_name_plural = "Emergency Visits"
        indexes = [
            models.Index(fields=['patient_id']),
            models.Index(fields=['arrival_time']),
            models.Index(fields=['triage_level']),
            models.Index(fields=['is_admitted']),
        ]

    def __str__(self):
        return f"ER Visit #{self.id} - Patient {self.patient_id}"

class VitalSign(models.Model):
    visit = models.ForeignKey(
        EmergencyVisit,
        on_delete=models.CASCADE,
        related_name='vital_signs',
        help_text="Associated emergency visit"
    )
    recorded_by_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID of the user who recorded the vital signs"
    )
    recorded_at = models.DateTimeField(auto_now_add=True)
    temperature = models.DecimalField(
        max_digits=4, 
        decimal_places=1, 
        blank=True, 
        null=True,
        help_text="Temperature in °C"
    )
    heart_rate = models.PositiveIntegerField(
        blank=True, 
        null=True,
        help_text="Heartbeats per minute",
        validators=[MinValueValidator(20), MaxValueValidator(300)]
    )
    blood_pressure_systolic = models.PositiveIntegerField(
        blank=True, 
        null=True,
        help_text="Systolic pressure (mmHg)",
        validators=[MinValueValidator(50), MaxValueValidator(300)]
    )
    blood_pressure_diastolic = models.PositiveIntegerField(
        blank=True, 
        null=True,
        help_text="Diastolic pressure (mmHg)",
        validators=[MinValueValidator(30), MaxValueValidator(200)]
    )
    respiratory_rate = models.PositiveIntegerField(
        blank=True, 
        null=True,
        help_text="Respiratory rate (breaths/min)",
        validators=[MinValueValidator(5), MaxValueValidator(60)]
    )
    oxygen_saturation = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        blank=True, 
        null=True,
        help_text="O2 Saturation %"
    )
    pain_level = models.PositiveIntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        blank=True, 
        null=True,
        help_text="Pain level (0-10)"
    )
    gcs_score = models.PositiveIntegerField(
        validators=[MinValueValidator(3), MaxValueValidator(15)],
        blank=True, 
        null=True,
        help_text="Glasgow Coma Scale (3-15)"
    )
    notes = models.TextField(
        blank=True, 
        null=True,
        help_text="Additional notes"
    )

    class Meta:
        ordering = ['-recorded_at']
        verbose_name = "Vital Sign"
        verbose_name_plural = "Vital Signs"

    def __str__(self):
        return f"Vitals for Visit #{self.visit_id} at {self.recorded_at}"

class Treatment(models.Model):
    TREATMENT_TYPE_CHOICES = [
        ('MED', 'Medication'),
        ('PROC', 'Procedure'),
        ('TEST', 'Diagnostic Test'),
        ('OTHER', 'Other'),
    ]
    
    visit = models.ForeignKey(
        EmergencyVisit,
        on_delete=models.CASCADE,
        related_name='treatments',
        help_text="Associated emergency visit"
    )
    treatment_type = models.CharField(
        max_length=5,
        choices=TREATMENT_TYPE_CHOICES,
        help_text="Type of treatment"
    )
    name = models.CharField(
        max_length=200,
        help_text="Name of the treatment"
    )
    description = models.TextField(
        blank=True, 
        null=True,
        help_text="Detailed description"
    )
    administered_by_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID of the staff who administered"
    )
    administered_at = models.DateTimeField(auto_now_add=True)
    dosage = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Dosage (if medication)"
    )
    outcome = models.TextField(
        blank=True, 
        null=True,
        help_text="Outcome of the treatment"
    )
    complications = models.TextField(
        blank=True, 
        null=True,
        help_text="Any complications"
    )

    class Meta:
        ordering = ['-administered_at']
        verbose_name = "Treatment"
        verbose_name_plural = "Treatments"

    def __str__(self):
        return f"{self.get_treatment_type_display()}: {self.name} (Visit #{self.visit_id})"

class Diagnosis(models.Model):
    visit = models.ForeignKey(
        EmergencyVisit,
        on_delete=models.CASCADE,
        related_name='diagnoses',
        help_text="Associated emergency visit"
    )
    code = models.CharField(
        max_length=20,
        help_text="ICD-10 Code"
    )
    description = models.TextField(help_text="Description of the diagnosis")
    diagnosed_by_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID of the diagnosing physician"
    )
    diagnosed_at = models.DateTimeField(auto_now_add=True)
    is_primary = models.BooleanField(default=False, help_text="If it is the primary diagnosis")
    notes = models.TextField(
        blank=True, 
        null=True,
        help_text="Additional notes"
    )

    class Meta:
        ordering = ['-diagnosed_at']
        verbose_name = "Diagnosis"
        verbose_name_plural = "Diagnoses"
        indexes = [
            models.Index(fields=['code']),
        ]

    def __str__(self):
        return f"{self.code}: {self.description[:50]} (Visit #{self.visit_id})"

class Prescription(models.Model):
    visit = models.ForeignKey(
        EmergencyVisit,
        on_delete=models.CASCADE,
        related_name='prescriptions',
        help_text="Associated emergency visit"
    )
    medication = models.CharField(
        max_length=200,
        help_text="Name of the medication"
    )
    dosage = models.CharField(
        max_length=100,
        help_text="Dosage (e.g., 500mg)"
    )
    frequency = models.CharField(
        max_length=100,
        help_text="Frequency (e.g., 3 times a day)"
    )
    duration = models.CharField(
        max_length=100,
        help_text="Duration (e.g., 7 days)"
    )
    prescribed_by_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID of the prescribing physician"
    )
    prescribed_at = models.DateTimeField(auto_now_add=True)
    instructions = models.TextField(
        blank=True, 
        null=True,
        help_text="Additional instructions"
    )
    is_dispensed = models.BooleanField(default=False, help_text="If the medication has been dispensed")
    refills = models.PositiveIntegerField(default=0, help_text="Number of allowed refills")

    class Meta:
        ordering = ['-prescribed_at']
        verbose_name = "Prescription"
        verbose_name_plural = "Prescriptions"

    def __str__(self):
        return f"{self.medication} for Visit #{self.visit_id}"

class Bed(models.Model):
    BED_STATUS_CHOICES = [
        ('AVAIL', 'Available'),
        ('OCCUP', 'Occupied'),
        ('MAINT', 'Maintenance'),
        ('RESERV', 'Reserved'),
    ]
    
    patient_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID of the assigned patient"
    )
    doctor_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID of the responsible physician"
    )
    nurse_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID of the responsible nurse"
    )
    bed_number = models.CharField(
        max_length=10,
        unique=True,
        help_text="Bed number/identifier"
    )
    status = models.CharField(
        max_length=6,
        choices=BED_STATUS_CHOICES,
        default='AVAIL',
        help_text="Current status of the bed"
    )
    location = models.CharField(max_length=100, help_text="Location/Department")
    is_isolation = models.BooleanField(default=False, help_text="If it is an isolation bed")
    special_equipment = models.TextField(
        blank=True, 
        null=True,
        help_text="Special equipment available"
    )
    last_cleaned = models.DateTimeField(auto_now_add=True, help_text="Last cleaning/sanitization")

    class Meta:
        ordering = ['bed_number']
        verbose_name = "Bed"
        verbose_name_plural = "Beds"
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['location']),
            models.Index(fields=['is_isolation']),
        ]

    def __str__(self):
        return f"Bed {self.bed_number} ({self.get_status_display()})"

class Admission(models.Model):
    visit = models.OneToOneField(
        EmergencyVisit,
        on_delete=models.CASCADE,
        related_name='admission',
        help_text="Associated emergency visit"
    )
    bed = models.ForeignKey(
        Bed,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Assigned bed"
    )
    admitted_by_id = models.IntegerField(help_text="ID of the admitting staff member")
    admission_time = models.DateTimeField(auto_now_add=True)
    discharge_time = models.DateTimeField(
        blank=True, 
        null=True,
        help_text="Date/Time of discharge"
    )
    admitting_diagnosis = models.TextField(help_text="Diagnosis at admission")
    department = models.CharField(max_length=100, help_text="Admitting department")
    notes = models.TextField(
        blank=True, 
        null=True,
        help_text="Additional notes"
    )

    class Meta:
        ordering = ['-admission_time']
        verbose_name = "Admission"
        verbose_name_plural = "Admissions"
        indexes = [
            models.Index(fields=['admission_time']),
            models.Index(fields=['discharge_time']),
            models.Index(fields=['department']),
        ]

    def __str__(self):
        return f"Admission #{self.id} for Visit #{self.visit_id}"