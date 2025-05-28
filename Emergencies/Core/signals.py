from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from Core.models import Doctor
from datetime import date

@receiver(post_save, sender=User)
def create_doctor_for_superuser(sender, instance, created, **kwargs):
    if created and instance.is_superuser:
        Doctor.objects.create(
            user=instance,
            date_of_birth=date(1980, 1, 1),
            gender='U',
            address="Default Address",
            phone_number="0000000000",
            badge_number="00000",
            days_off=date(2099, 12, 31),
            work_unit='ER'
        )
