from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RegisterViewSet, TokenIntrospectionView, UserDetailView, UserViewSet
from .api import CustomAuthToken

router = DefaultRouter()
router.register(r'register', RegisterViewSet, basename='register')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', CustomAuthToken.as_view(), name='auth-login'),
    path('introspect/', TokenIntrospectionView.as_view(), name='token-introspect'),
    path('user/', UserDetailView.as_view(), name='user-detail'),
]