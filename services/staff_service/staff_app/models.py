from django.db import models
from django.contrib.auth.models import User

class Staff(models.Model):
    ROLE_CHOICES = [
        ('TEC', 'Technician'),
        ('ADM', 'Administrator'),
        ('RES', 'Resident'),
        ('INT', 'Intern'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile')
    role = models.CharField(max_length=3, choices=ROLE_CHOICES)
    department = models.CharField(max_length=100)
    license_number = models.CharField(max_length=50, blank=True, null=True)
    specialization = models.CharField(max_length=100, blank=True, null=True) 
    hire_date = models.DateField()
    is_active = models.BooleanField(default=True)
    shift_schedule = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"{self.user.get_full_name() or self.user.username} ({self.get_role_display()})"

class Doctor(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
        ('U', 'Unknown'),
    ]

    UNIT_CHOICES = [
        ('ICU', 'Intensive Care Unit'),
        ('ER', 'Emergency Room'),
        ('CCU', 'Cardiac Care Unit'),
        ('NICU', 'Neonatal Intensive Care Unit'),
        ('PACU', 'Post-Anesthesia Care Unit'),
        ('MED-SURG', 'Medical-Surgical Unit'),
        ('L&D', 'Labor and Delivery')
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    date_of_birth = models.DateField(null=True, blank=True) 
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    badge_number = models.CharField(max_length=50, unique=True) 
    days_off = models.TextField(blank=True, null=True) 
    work_unit = models.CharField(max_length=10, choices=UNIT_CHOICES, null=True, blank=True)
    specialization = models.CharField(max_length=100, blank=True, null=True)
    license_number = models.CharField(max_length=50, blank=True, null=True) 

    def __str__(self):
        return f"Dr. {self.user.get_full_name() or self.user.username} ({self.badge_number} - {self.work_unit or 'N/A'})"

class Nurse(models.Model):
    GENDER_CHOICES = Doctor.GENDER_CHOICES 
    UNIT_CHOICES = Doctor.UNIT_CHOICES     

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='nurse_profile')
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    badge_number = models.CharField(max_length=50, unique=True) 
    days_off = models.TextField(blank=True, null=True) 
    work_unit = models.CharField(max_length=10, choices=UNIT_CHOICES, null=True, blank=True)
    license_number = models.CharField(max_length=50, blank=True, null=True)
    certification = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return f"Nurse {self.user.get_full_name() or self.user.username} ({self.badge_number} - {self.work_unit or 'N/A'})"