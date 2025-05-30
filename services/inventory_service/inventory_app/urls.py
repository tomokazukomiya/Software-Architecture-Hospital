from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryItemViewSet

router = DefaultRouter()
router.register(r'inventoryitems', InventoryItemViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
