import requests
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework import exceptions

class RemoteUser:
    def __init__(self, user_data):
        self.id = user_data.get('id')
        self.username = user_data.get('username')
        self.email = user_data.get('email')
        self.first_name = user_data.get('first_name')
        self.last_name = user_data.get('last_name')
        self.is_authenticated = True
        self.is_staff = False 
        self.is_active = True 

    def __str__(self):
        return self.username

class RemoteTokenAuthentication(BaseAuthentication):
    keyword = 'Token'

    def authenticate(self, request):
        auth = get_authorization_header(request).split()

        if not auth or auth[0].lower() != self.keyword.lower().encode():
            return None

        if len(auth) == 1:
            msg = 'Invalid token header. No credentials provided.'
            raise exceptions.AuthenticationFailed(msg)
        elif len(auth) > 2:
            msg = 'Invalid token header. Token string should not contain spaces.'
            raise exceptions.AuthenticationFailed(msg)

        try:
            token = auth[1].decode()
        except UnicodeError:
            msg = 'Invalid token header. Token string should not contain invalid characters.'
            raise exceptions.AuthenticationFailed(msg)

        introspection_url = getattr(settings, 'AUTH_SERVICE_INTROSPECT_URL', None)
        if not introspection_url:
            raise exceptions.AuthenticationFailed('Auth service introspection URL not configured.')

        try:
            headers = {'Content-Type': 'application/json'}
            payload = {'token': token}
            response = requests.post(introspection_url, json=payload, headers=headers, timeout=5)
            response.raise_for_status()  
            user_data = response.json()
            return (RemoteUser(user_data), token)
        except requests.exceptions.RequestException as e:

            raise exceptions.AuthenticationFailed(f'Token introspection failed: {e}')
        except ValueError: 
            raise exceptions.AuthenticationFailed('Invalid response from auth service during introspection.')

    def authenticate_header(self, request):
        return self.keyword