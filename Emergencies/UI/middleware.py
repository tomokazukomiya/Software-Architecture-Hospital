from django.urls import reverse, resolve, NoReverseMatch
from django.http import HttpResponseRedirect, Http404, HttpResponseForbidden
from django.shortcuts import redirect
from Core.models import Staff, Doctor
import logging

logger = logging.getLogger(__name__)

class StaffAccessControlMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

        self.authenticated_allowed_url_names = {
            'admin:logout',
            'admin:password_change',
            'admin:password_change_done',
            'admin:index',
            'admin:app_list',
            'admin:login',
            'admin:jazzmin_logout',
        }

        self.doctor_only_url_names = {
            'doctor_view',
        }

        self.login_path = self._safe_reverse('admin:login')
        self.doctor_view_path = self._safe_reverse('doctor_view')
        self.admin_index_path = self._safe_reverse('admin:index')

        if not self.login_path:
            logger.critical("Admin login URL ('admin:login') could not be resolved. Middleware will likely fail.")
        if not self.admin_index_path:
            logger.critical("Admin index URL ('admin:index') could not be resolved. Middleware redirection might fail.")
        if not self.doctor_view_path:
             logger.warning("Doctor view URL ('doctor_view') could not be resolved. Doctor redirection might fail.")

    def _safe_reverse(self, name, default=None):
        try:
            return reverse(name)
        except NoReverseMatch:
            logger.error(f"URL name '{name}' could not be resolved during middleware init. Check urls.py.")
            return default

    def __call__(self, request):
        if request.path.startswith('/api/'):
            logger.debug(f"Allowing API request to pass through: {request.path}")
            return self.get_response(request)

        if request.path == reverse('admin:logout'):
            logger.debug(f"Allowing logout request for {request.user}")
            return self.get_response(request)
            
        if not request.user.is_authenticated:
            if request.path in [self.login_path, reverse('admin:logout')]:
                logger.debug(f"Allowing unauthenticated access to login/logout page: {request.path}")
                return self.get_response(request)
            
        if not request.user.is_authenticated:
            if self.login_path and request.path == self.login_path:
                logger.debug(f"Allowing unauthenticated access to login page: {request.path}")
                return self.get_response(request)
            else:
                redirect_url = self.login_path
                if not redirect_url:
                    logger.error("Login path not resolved, cannot redirect unauthenticated user.")
                    return HttpResponseForbidden("Access Denied. Cannot determine login page.")

                logger.debug(f"Unauthenticated user accessing '{request.path}'. Redirecting to login: {redirect_url}")
                if request.path == redirect_url:
                    logger.error(f"Potential redirect loop detected for unauthenticated user at {request.path}. Denying access.")
                    return HttpResponseForbidden("Access Denied. Login redirect loop prevented.")
                return redirect(redirect_url)

        if request.user.is_superuser:
            logger.debug(f"Allowing superuser {request.user} access to {request.path}")
            return self.get_response(request)

        try:
            resolver_match = resolve(request.path_info)
            full_url_name = resolver_match.view_name
            if resolver_match.namespace:
                full_url_name = f"{resolver_match.namespace}:{full_url_name}"
        except Http404:
            logger.debug(f"Path '{request.path_info}' not resolved. Passing through middleware.")
            return self.get_response(request)
        except Exception as e:
            logger.error(f"Error resolving URL '{request.path_info}': {e}")
            if self.admin_index_path and request.path != self.admin_index_path:
                 return redirect(self.admin_index_path)
            else:
                 return HttpResponseForbidden("Access Denied due to URL resolution error.")

        if full_url_name in self.authenticated_allowed_url_names:
            logger.debug(f"Allowing authenticated user {request.user} access to common page: {full_url_name}")
            return self.get_response(request)

        is_doctor = hasattr(request.user, 'doctor')
        logger.debug(f"User {request.user} check: IsDoctor={is_doctor}")

        is_allowed = False
        redirect_target_name = None

        if is_doctor:
            if full_url_name in self.doctor_only_url_names:
                is_allowed = True
            elif full_url_name.startswith('admin:'):
                is_allowed = False
                redirect_target_name = 'doctor_view'
            else:
                is_allowed = True
                logger.debug(f"Allowing doctor access to non-admin/non-doctor view: {full_url_name}")

        else:
            if full_url_name in self.doctor_only_url_names:
                is_allowed = False
                redirect_target_name = 'admin:index'
            elif full_url_name.startswith('admin:'):
                 is_allowed = True
                 logger.debug(f"Allowing staff access to admin view: {full_url_name}")
            else:
                 is_allowed = True
                 logger.debug(f"Allowing staff access to non-admin view: {full_url_name}")

        if is_allowed:
            logger.debug(f"Access GRANTED for {request.user} (IsDoctor: {is_doctor}) to {full_url_name or request.path}.")
            return self.get_response(request)
        else:
            if not redirect_target_name:
                redirect_target_name = 'doctor_view' if is_doctor else 'admin:index'

            logger.warning(f"Access DENIED for {request.user} (IsDoctor: {is_doctor}) to {full_url_name or request.path}. Redirecting to '{redirect_target_name}'.")

            try:
                target_path = self._safe_reverse(redirect_target_name)
                if not target_path:
                     raise NoReverseMatch

                if request.path == target_path:
                    logger.error(f"Potential redirect loop detected for {request.user} at {request.path} trying to redirect to {redirect_target_name}. Denying access with 403.")
                    return HttpResponseForbidden("Access Denied. Redirect loop prevented.")

                return redirect(redirect_target_name)

            except NoReverseMatch:
                logger.error(f"Redirect target '{redirect_target_name}' not found. Falling back to admin:index.")
                fallback_redirect_path = self.admin_index_path
                if fallback_redirect_path and request.path != fallback_redirect_path:
                    return redirect(self.admin_index_path)
                else:
                    logger.critical(f"Cannot redirect user {request.user} from {request.path}. No valid redirect target found.")
                    return HttpResponseForbidden("Access Denied. Cannot redirect.")