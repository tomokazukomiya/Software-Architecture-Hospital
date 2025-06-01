from django.utils.deprecation import MiddlewareMixin

class FixInvalidHostMiddleware(MiddlewareMixin):
    def process_request(self, request):
        print(">>> FixInvalidHostMiddleware attivo")
        host = request.META.get("HTTP_HOST", "")
        if ":" in host:
            hostname = host.split(":")[0]
            print(f">>> Host prima: {host} => dopo: {hostname}")
            request.META["HTTP_HOST"] = hostname