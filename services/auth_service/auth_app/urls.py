from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterViewSet, LoginView, TokenIntrospectionView

router = DefaultRouter()
router.register(r'register', RegisterViewSet, basename='register')

urlpatterns = [
    path('login/', LoginView.as_view(), name='auth-login'),
    path('introspect/', TokenIntrospectionView.as_view(), name='token-introspect'),
    path('', include(router.urls)),
]