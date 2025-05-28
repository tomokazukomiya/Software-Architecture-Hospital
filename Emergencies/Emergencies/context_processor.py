from django.urls import reverse, NoReverseMatch
from django.utils.translation import gettext_lazy as _
from typing import Dict, List, TypedDict, Optional, Any
from UI.admin import custom_site as admin_site_instance
from django.apps import apps
from django.conf import settings
from django.http import HttpRequest
import logging 
from Core.models import Patient, EmergencyVisit, Bed, Staff, InventoryItem, Doctor, Nurse, PatientFile

def safe_reverse(url_name: str, args: Optional[list] = None, kwargs: Optional[dict] = None) -> Optional[str]:
    """Safely reverses a URL, returning None if NoReverseMatch."""
    try:
        return reverse(url_name, args=args, kwargs=kwargs)
    except NoReverseMatch:

        return None

DEFAULT_APP_ICON = "fas fa-folder"
DEFAULT_MODEL_ICON = "fas fa-cube"

JAZZMIN_SETTINGS_FROM_CONF = getattr(settings, "JAZZMIN_SETTINGS", {})
JAZZMIN_ICONS = JAZZMIN_SETTINGS_FROM_CONF.get("icons", {})

APP_GROUPS_CONFIG = {
    "STAFF_MANAGEMENT": {
        "name": _("Staff Management"),
        "icon": JAZZMIN_ICONS.get("auth", DEFAULT_APP_ICON),
        "models": ["auth.user", "auth.group", "core.staff", "core.doctor", "core.nurse"],
        "order": 1,
    },
    "EMERGENCY_OPERATIONS": {
        "name": _("Emergency Operations"),
        "icon": JAZZMIN_ICONS.get("core.emergencyvisit", DEFAULT_APP_ICON),
        "models": ["core.patient", "core.emergencyvisit", "core.vitalsign", "core.treatment", "core.diagnosis", "core.prescription", "core.patientfile"],
        "order": 2,
    },
    "HOSPITAL_RESOURCES": {
        "name": _("Hospital Resources"),
        "icon": "fas fa-hospital",
        "models": ["core.bed", "core.admission", "core.inventoryitem"],
        "order": 3,
    },
}


class JazzminModelItem(TypedDict):
    name: str
    url: Optional[str]
    icon: str
    permissions: List[str]

class JazzminAppGroup(TypedDict):
    name: str
    icon: str
    models: List[JazzminModelItem]

def get_jazzmin_custom_menu(request: HttpRequest) -> List[JazzminAppGroup]:
    user = request.user
    final_menu_structure: List[JazzminAppGroup] = []

    if not hasattr(user, 'is_active') or not user.is_active or \
       not hasattr(user, 'is_staff') or not user.is_staff:
        return final_menu_structure

    def _has_any_permission(perm_list: List[str]) -> bool:
        if not hasattr(user, 'has_perm'):
            return False
        return any(user.has_perm(perm) for perm in perm_list)

    app_model_details: Dict[str, List[Dict[str, Any]]] = {}

    for model, model_admin in admin_site_instance._registry.items():
        app_label = model._meta.app_label
        model_name = model._meta.model_name

        required_perms = [
            f"{app_label}.view_{model_name}",
            f"{app_label}.change_{model_name}",
        ]

        if not _has_any_permission(required_perms): 
            continue

        changelist_url_name = f"admin:{app_label}_{model_name}_changelist"
        resolved_changelist_url = safe_reverse(changelist_url_name)

        if not resolved_changelist_url:
            continue

        model_info = {
            "verbose_name_plural": model._meta.verbose_name_plural,
            "model_name": model_name,
            "app_label": app_label,
            "changelist_url": resolved_changelist_url,
            "permissions_checked": required_perms,
        }

        if app_label not in app_model_details:
            app_model_details[app_label] = []
        app_model_details[app_label].append(model_info)

    sorted_group_keys = sorted(APP_GROUPS_CONFIG.keys(), key=lambda gk: APP_GROUPS_CONFIG[gk].get("order", 99))

    for group_key in sorted_group_keys:
        group_config = APP_GROUPS_CONFIG[group_key]
        group_name = group_config["name"]
        group_icon = group_config["icon"]
        group_models_identifiers = group_config["models"] 

        jazzmin_models_list_for_group: List[JazzminModelItem] = []

        models_to_display_in_group = []
        for app_label_key, models_in_app in app_model_details.items():
            for model_data in models_in_app:
                model_identifier = f"{model_data['app_label']}.{model_data['model_name']}"
                if model_identifier in group_models_identifiers:
                    models_to_display_in_group.append(model_data)
        
        if not models_to_display_in_group:
            continue

        sorted_models_info_for_app = sorted(
            models_to_display_in_group,
            key=lambda m_info: str(m_info["verbose_name_plural"]).lower()
        )

        for model_data in sorted_models_info_for_app:
            model_icon_lookup_key = f"{model_data['app_label']}.{model_data['model_name']}"
            model_specific_icon = JAZZMIN_ICONS.get(model_icon_lookup_key, DEFAULT_MODEL_ICON)


            menu_item: JazzminModelItem = {
                "name": str(_(model_data["verbose_name_plural"])).capitalize(),
                "url": model_data["changelist_url"],
                "icon": model_specific_icon,
                "permissions": model_data["permissions_checked"],
            }
            jazzmin_models_list_for_group.append(menu_item)

        if jazzmin_models_list_for_group:
            app_group: JazzminAppGroup = {
                "name": str(group_name), 
                "icon": group_icon,
                "models": jazzmin_models_list_for_group,
            }
            final_menu_structure.append(app_group)

    return final_menu_structure

def get_dashboard_infographics_data(request: HttpRequest) -> Dict[str, Any]:
    logging.info("get_dashboard_infographics_data context processor called.")
    context_data: Dict[str, Any] = {}
    user = request.user

    if not user.is_authenticated or not user.is_staff or not hasattr(user, 'has_perm'):
        logging.info("User not authenticated or not staff, returning empty context.")
        return context_data

    # Data for "Active Emergencies"
    if user.has_perm('Core.view_emergencyvisit'):
        context_data['emergency_count'] = EmergencyVisit.objects.filter(discharge_time__isnull=True).count()
    else:
        logging.debug("User lacks Core.view_emergencyvisit permission.")
        context_data['emergency_count'] = 0

    # Data for "Total Patients"
    if user.has_perm('Core.view_patient'):
        context_data['patient_count'] = Patient.objects.count()
    else:
        logging.debug("User lacks Core.view_patient permission.")
        context_data['patient_count'] = 0

    # Data for "Medical Staff"
    if user.has_perm('Core.view_staff'):
        context_data['staff_count'] = Staff.objects.count() 
    else:
        logging.debug("User lacks Core.view_staff permission.")
        context_data['staff_count'] = 0

    # Data for "Low Stock Items"
    if user.has_perm('Core.view_inventoryitem'):
        LOW_STOCK_THRESHOLD = 10 
        context_data['low_inventory_count'] = InventoryItem.objects.filter(quantity__lt=LOW_STOCK_THRESHOLD).count()
        logging.debug(f"Low inventory count: {context_data['low_inventory_count']}")
    else:
        logging.debug("User lacks Core.view_inventoryitem permission.")
        context_data['low_inventory_count'] = 0

    # Data for Triage Chart
    if user.has_perm('Core.view_emergencyvisit'):
        triage_labels = []
        triage_data_counts = []
        try:
            triage_field = EmergencyVisit._meta.get_field('triage_level')
            if hasattr(triage_field, 'choices') and triage_field.choices:
                for value, display_name in triage_field.choices:
                    count = EmergencyVisit.objects.filter(triage_level=value, discharge_time__isnull=True).count() 
                    triage_labels.append(str(display_name))
                    triage_data_counts.append(count)
        except Exception as e:
             logging.error(f"Error fetching triage data: {e}")
             triage_labels = []
             triage_data_counts = []

        context_data['triage_labels'] = triage_labels
        context_data['triage_data'] = triage_data_counts
    else:
        logging.debug("User lacks Core.view_emergencyvisit permission for triage chart.")
        context_data['triage_labels'] = []
        context_data['triage_data'] = []

    # Data for Bed Chart
    if user.has_perm('Core.view_bed'):
        try:

            available_beds = Bed.objects.filter(status='AVAIL').count() 
            occupied_beds = Bed.objects.filter(status='OCCUP').count() 
            maintenance_beds = Bed.objects.filter(status='MAINT').count() 
            context_data['bed_data'] = [available_beds, occupied_beds, maintenance_beds]
        except Exception as e:
            logging.error(f"Error fetching bed data: {e}")
            context_data['bed_data'] = [0, 0, 0]
    else:
        logging.debug("User lacks Core.view_bed permission for bed chart.")
        context_data['bed_data'] = [0, 0, 0]

    if user.has_perm('Core.view_emergencyvisit'):
        context_data['recent_visits'] = EmergencyVisit.objects.select_related('patient').order_by('-arrival_time')[:5]
    else:
        context_data['recent_visits'] = []
        logging.debug("User lacks Core.view_emergencyvisit permission for recent visits.")

    logging.info(f"Context data prepared: {context_data.keys()}")
    return context_data