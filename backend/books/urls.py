from django.urls import path
from .views import *
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("auth/register/", register_view, name="register"),
    path("auth/login/", login_view, name="login"),
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
    path('books/<int:book_id>/edit/', edit_book, name='edit-book'),
    path('books/<int:book_id>/delete/', delete_book, name='delete-book'),
    path('books/add/', add_book, name='add-book'),
    path('dashboard/', dashboard_stats, name='dashboard-stats'),
    path('admin/users/', get_all_users, name='get-all-users'),
    path('admin/users/<int:user_id>/delete/', delete_user, name='delete-user'),
    path('admin/books/', get_all_books, name='get-all-books'),
    path('admin/genres/add/', add_genre, name='add-genre'),
    path('admin/books/import-csv/', upload_books_csv, name='upload-books-csv'),
]
