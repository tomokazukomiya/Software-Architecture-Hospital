from django.db import models

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
