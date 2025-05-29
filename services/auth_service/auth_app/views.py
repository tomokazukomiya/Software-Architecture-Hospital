from django.contrib.auth.models import User
from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from .serializers import UserSerializer, RegisterSerializer


class LoginView(ObtainAuthToken):
    """
    API view for user login, returns auth token.
    """

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user, context=self.get_serializer_context()).data
        })

class RegisterViewSet(viewsets.GenericViewSet, viewsets.mixins.CreateModelMixin):
    """
    API view for user registration.
    """
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny] 

class TokenIntrospectionView(APIView):
    """
    An internal API endpoint for other services to validate a token.
    Expects a POST request with {"token": "your_token_string"}
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        token_key = request.data.get("token")
        if not token_key:
            return Response({"error": "Token not provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = Token.objects.select_related('user').get(key=token_key)
        except Token.DoesNotExist:
            return Response({"error": "Invalid token", "active": False}, status=status.HTTP_401_UNAUTHORIZED)

        if not token.user.is_active:
            return Response({"error": "User inactive or deleted", "active": False}, status=status.HTTP_401_UNAUTHORIZED)

        return Response(UserSerializer(token.user).data, status=status.HTTP_200_OK)
