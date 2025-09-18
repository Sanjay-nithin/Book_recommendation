from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView


urlpatterns = [
    path("auth/register/", register_view, name="register"),
    path("genres/", get_genres, name="get-genres"),
    path("users/preferences/", update_user_preferences, name="update-preferences"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("books/recommended/", recommended_books, name="recommended-books"),
    path('users/me/', current_user_view, name='current-user'),
    path('users/saved-books/', get_saved_books, name='get-saved-books'),
    path("books/<int:book_id>/toggle-save/", toggle_save_book, name="toggle-save-book"),
    path('books/search/', search_books, name='search-books'),
    path('books/explore/', explore_books, name='explore-books'),
    path('books/<int:book_id>/', book_detail, name='book-detail'),
]
