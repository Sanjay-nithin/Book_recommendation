from django.urls import path
from .views import *
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("auth/register/", register_view, name="register"),
    path('auth/login/', login_view, name="Login"),
    path('user/profile/', current_user_view, name="User"),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('books/recommended/', recommended_books, name="recommendation"),
    path('books/search/', search_books, name='search_books'),
    path("user/preferences/genres/", update_user_genre_preferences, name="update_genres"),

]
