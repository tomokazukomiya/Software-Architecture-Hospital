#middleware file
from django.urls import reverse

class StaffAccessControlMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.doctor_allowed_url_names = {'doctor_view', 'logout'} 

        self.always_allowed_paths = [
            reverse('login'),
        ]



