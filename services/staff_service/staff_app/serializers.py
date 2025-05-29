from rest_framework import serializers
from .models import Staff, Doctor, Nurse

class StaffSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField()

    class Meta:
        model = Staff
        fields = '__all__'
        
class DoctorSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField()
    class Meta:
        model = Doctor
        fields = '__all__'

class NurseSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField()
    class Meta:
        model = Nurse
        fields = '__all__'