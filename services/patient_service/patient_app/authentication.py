import requests
from django.conf import settings
from django.contrib.auth.models import User 
from rest_framework.authentication import BaseAuthentication, get_authorization_header
from rest_framework.exceptions import AuthenticationFailed

class RemoteTokenAuthentication(BaseAuthentication):
    """
    Custom authentication class to validate tokens against a remote auth_service.
    """
    keyword = 'Token'

    def authenticate(self, request):
        auth = get_authorization_header(request).split()

        if not auth or auth[0].lower() != self.keyword.lower().encode():
            return None 

        if len(auth) == 1:
            msg = 'Invalid token header. No credentials provided.'
            raise AuthenticationFailed(msg)
        elif len(auth) > 2:
            msg = 'Invalid token header. Token string should not contain spaces.'
            raise AuthenticationFailed(msg)

        try:
            token = auth[1].decode()
        except UnicodeError:
            msg = 'Invalid token header. Token string should not contain invalid characters.'
            raise AuthenticationFailed(msg)

        return self._authenticate_credentials(token)

    def _authenticate_credentials(self, key):
        introspection_url = getattr(settings, 'AUTH_SERVICE_INTROSPECT_URL', None)
        if not introspection_url:

            raise AuthenticationFailed('AUTH_SERVICE_INTROSPECT_URL is not configured in settings.')

        try:
            response = requests.post(introspection_url, data={'token': key}, timeout=5)
            if response.status_code == 200:
                user_data = response.json()
                user = User(
                    id=user_data.get('id'),
                    username=user_data.get('username'),
                    email=user_data.get('email'),
                    first_name=user_data.get('first_name', ''),
                    last_name=user_data.get('last_name', ''),
                    is_active=True 
                )
                return (user, key) 
            elif response.status_code == 401: 
                raise AuthenticationFailed(response.json().get("error", "Invalid token or user inactive."))
            response.raise_for_status() 
        except requests.exceptions.Timeout:
            raise AuthenticationFailed('Request to authentication service timed out.')
        except requests.exceptions.RequestException as e:

            raise AuthenticationFailed(f'Error connecting to authentication service.')

        raise AuthenticationFailed('Could not validate token with authentication service.')

    def authenticate_header(self, request):
        return self.keyword