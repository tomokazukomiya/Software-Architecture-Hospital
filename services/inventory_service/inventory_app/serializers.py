from .models import InventoryItem
from rest_framework import serializers

class InventoryItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryItem
        fields = '__all__'
        read_only_fields = ['last_restocked']