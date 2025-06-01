from rest_framework import serializers
from django.contrib.auth.models import User 
from .models import Staff, Doctor, Nurse
import requests
import os
import logging

logger = logging.getLogger(__name__)

AUTH_SERVICE_BASE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8000/api/auth/")

def _get_auth_header_from_context(context):
    request = context.get('request')
    if request and hasattr(request, 'auth') and request.auth:
        return {'Authorization': f'Token {request.auth}'}
    logger.warning("Il contesto del serializer non ha una richiesta o un token di autenticazione per la chiamata inter-servizio.")
    return {}

def _validate_user_from_auth_service(user_id, context):
    if not user_id:
        raise serializers.ValidationError({"user_id": "L'ID utente non può essere vuoto."})

    user_detail_url = f"{AUTH_SERVICE_BASE_URL.rstrip('/')}/users/{user_id}/"
    headers = _get_auth_header_from_context(context)

    try:
        response = requests.get(user_detail_url, headers=headers, timeout=3)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            raise serializers.ValidationError({"user_id": f"Utente con ID {user_id} non trovato nel servizio di autenticazione."})
        else:
            logger.error(f"Errore HTTP {e.response.status_code} dal servizio di autenticazione per l'utente {user_id}: {e.response.text}")
            raise serializers.ValidationError({"user_id": f"Errore ({e.response.status_code}) durante la validazione dell'utente con ID {user_id}."})
    except requests.exceptions.RequestException as e:
        logger.error(f"Errore di richiesta al servizio di autenticazione per l'utente {user_id}: {str(e)}")
        raise serializers.ValidationError({"user_id": f"Errore di comunicazione durante la validazione dell'utente con ID {user_id}."})


class StaffSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True)
    user_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Staff
        fields = [
            'id', 'user_id', 'user_details', 'role', 'department', 
            'license_number', 'specialization', 'hire_date', 
            'is_active', 'shift_schedule'
        ]

    def get_user_details(self, obj):
        if obj.user:
            return {
                "id": obj.user.id,
                "username": obj.user.username,
                "email": obj.user.email,
                "first_name": obj.user.first_name,
                "last_name": obj.user.last_name,
            }
        return None

    def validate_user_id(self, value):
        user_data_from_auth = _validate_user_from_auth_service(value, self.context)
        self.context['validated_user_data_from_auth'] = user_data_from_auth
        return value

    def create(self, validated_data):
        auth_user_data = self.context.get('validated_user_data_from_auth')
        if not auth_user_data:
            raise serializers.ValidationError("Dati utente dal servizio di autenticazione non trovati nel contesto.")
        
        user_id_from_auth = auth_user_data.get('id')
        if not user_id_from_auth:
            raise serializers.ValidationError({"user_id": "ID utente non presente nei dati recuperati dal servizio di autenticazione."})

        validated_data.pop('user_id', None) 

        if Staff.objects.filter(user_id=user_id_from_auth).exists():
            raise serializers.ValidationError({
                "user_id": f"Un profilo Staff esiste già per l'utente con ID {user_id_from_auth}."
            })

        local_user, created = User.objects.update_or_create(
            id=user_id_from_auth, 
            defaults={
                'username': auth_user_data.get('username'),
                'email': auth_user_data.get('email', ''),
                'first_name': auth_user_data.get('first_name', ''),
                'last_name': auth_user_data.get('last_name', ''),
                'is_active': auth_user_data.get('is_active', True),
            }
        )
        
        staff_instance = Staff.objects.create(user=local_user, **validated_data)
        return staff_instance

    def update(self, instance, validated_data):
        auth_user_data = self.context.get('validated_user_data_from_auth')

        if 'user_id' in validated_data:
            if not auth_user_data:
                 raise serializers.ValidationError("Dati utente per l'aggiornamento non trovati nel contesto.")

            new_user_id_from_auth = auth_user_data.get('id')
            if not new_user_id_from_auth:
                raise serializers.ValidationError({"user_id": "ID utente non presente nei dati recuperati per l'aggiornamento."})

            if Staff.objects.filter(user_id=new_user_id_from_auth).exclude(pk=instance.pk).exists():
                raise serializers.ValidationError({
                    "user_id": f"L'utente con ID {new_user_id_from_auth} è già associato a un altro profilo Staff."
                })

            validated_data.pop('user_id')
            local_user, created = User.objects.update_or_create(
                id=new_user_id_from_auth,
                defaults={
                    'username': auth_user_data.get('username'),
                    'email': auth_user_data.get('email', ''),
                    'first_name': auth_user_data.get('first_name', ''),
                    'last_name': auth_user_data.get('last_name', ''),
                    'is_active': auth_user_data.get('is_active', True),
                }
            )
            instance.user = local_user
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance

class DoctorSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True)
    user_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id', 'user_id', 'user_details', 'date_of_birth', 'gender', 
            'address', 'phone_number', 'badge_number', 'days_off', 
            'work_unit', 'specialization', 'license_number'
        ]
    
    def get_user_details(self, obj):
        if obj.user:
            return {
                "id": obj.user.id, "username": obj.user.username, "email": obj.user.email,
                "first_name": obj.user.first_name, "last_name": obj.user.last_name
            }
        return None

    def validate_user_id(self, value):
        user_data_from_auth = _validate_user_from_auth_service(value, self.context)
        self.context['validated_user_data_from_auth_doctor'] = user_data_from_auth
        return value

    def create(self, validated_data):
        auth_user_data = self.context.get('validated_user_data_from_auth_doctor')
        if not auth_user_data:
            raise serializers.ValidationError("Dati utente (dottore) dal servizio di autenticazione non trovati.")

        user_id_from_auth = auth_user_data.get('id')
        if not user_id_from_auth:
            raise serializers.ValidationError({"user_id": "ID utente (dottore) non presente nei dati recuperati."})

        validated_data.pop('user_id', None)

        if Doctor.objects.filter(user_id=user_id_from_auth).exists():
            raise serializers.ValidationError({
                "user_id": f"Un profilo Dottore esiste già per l'utente con ID {user_id_from_auth}."
            })

        local_user, _ = User.objects.update_or_create(
            id=user_id_from_auth,
            defaults={
                'username': auth_user_data.get('username'), 'email': auth_user_data.get('email', ''),
                'first_name': auth_user_data.get('first_name', ''), 'last_name': auth_user_data.get('last_name', ''),
                'is_active': auth_user_data.get('is_active', True)
            }
        )
        doctor_instance = Doctor.objects.create(user=local_user, **validated_data)
        return doctor_instance

    def update(self, instance, validated_data):
        auth_user_data = self.context.get('validated_user_data_from_auth_doctor')
        if 'user_id' in validated_data:
            if not auth_user_data:
                raise serializers.ValidationError("Dati utente (dottore) per l'aggiornamento non trovati.")
            
            new_user_id_from_auth = auth_user_data.get('id')
            if not new_user_id_from_auth:
                raise serializers.ValidationError({"user_id": "ID utente (dottore) non presente nei dati recuperati per l'aggiornamento."})

            if Doctor.objects.filter(user_id=new_user_id_from_auth).exclude(pk=instance.pk).exists():
                raise serializers.ValidationError({
                    "user_id": f"L'utente con ID {new_user_id_from_auth} è già associato a un altro profilo Dottore."
                })

            validated_data.pop('user_id')
            local_user, _ = User.objects.update_or_create(
                id=new_user_id_from_auth,
                defaults={
                    'username': auth_user_data.get('username'), 'email': auth_user_data.get('email', ''),
                    'first_name': auth_user_data.get('first_name', ''), 'last_name': auth_user_data.get('last_name', ''),
                    'is_active': auth_user_data.get('is_active', True)
                }
            )
            instance.user = local_user
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class NurseSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(write_only=True)
    user_details = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Nurse
        fields = [
            'id', 'user_id', 'user_details', 'date_of_birth', 'gender', 
            'address', 'phone_number', 'badge_number', 'days_off', 
            'work_unit', 'license_number', 'certification'
        ]

    def get_user_details(self, obj):
        if obj.user:
            return {
                "id": obj.user.id, "username": obj.user.username, "email": obj.user.email,
                "first_name": obj.user.first_name, "last_name": obj.user.last_name
            }
        return None

    def validate_user_id(self, value):
        user_data_from_auth = _validate_user_from_auth_service(value, self.context)
        self.context['validated_user_data_from_auth_nurse'] = user_data_from_auth
        return value

    def create(self, validated_data):
        auth_user_data = self.context.get('validated_user_data_from_auth_nurse')
        if not auth_user_data:
            raise serializers.ValidationError("Dati utente (infermiere) dal servizio di autenticazione non trovati.")

        user_id_from_auth = auth_user_data.get('id')
        if not user_id_from_auth:
            raise serializers.ValidationError({"user_id": "ID utente (infermiere) non presente nei dati recuperati."})

        validated_data.pop('user_id', None)

        if Nurse.objects.filter(user_id=user_id_from_auth).exists():
            raise serializers.ValidationError({
                "user_id": f"Un profilo Infermiere esiste già per l'utente con ID {user_id_from_auth}."
            })

        local_user, _ = User.objects.update_or_create(
            id=user_id_from_auth,
            defaults={
                'username': auth_user_data.get('username'), 'email': auth_user_data.get('email', ''),
                'first_name': auth_user_data.get('first_name', ''), 'last_name': auth_user_data.get('last_name', ''),
                'is_active': auth_user_data.get('is_active', True)
            }
        )
        nurse_instance = Nurse.objects.create(user=local_user, **validated_data)
        return nurse_instance

    def update(self, instance, validated_data):
        auth_user_data = self.context.get('validated_user_data_from_auth_nurse')
        if 'user_id' in validated_data:
            if not auth_user_data:
                raise serializers.ValidationError("Dati utente (infermiere) per l'aggiornamento non trovati.")

            new_user_id_from_auth = auth_user_data.get('id')
            if not new_user_id_from_auth:
                raise serializers.ValidationError({"user_id": "ID utente (infermiere) non presente nei dati recuperati per l'aggiornamento."})

            if Nurse.objects.filter(user_id=new_user_id_from_auth).exclude(pk=instance.pk).exists():
                raise serializers.ValidationError({
                    "user_id": f"L'utente con ID {new_user_id_from_auth} è già associato a un altro profilo Infermiere."
                })

            validated_data.pop('user_id')
            local_user, _ = User.objects.update_or_create(
                id=new_user_id_from_auth,
                defaults={
                    'username': auth_user_data.get('username'), 'email': auth_user_data.get('email', ''),
                    'first_name': auth_user_data.get('first_name', ''), 'last_name': auth_user_data.get('last_name', ''),
                    'is_active': auth_user_data.get('is_active', True)
                }
            )
            instance.user = local_user
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance