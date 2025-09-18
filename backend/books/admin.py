from django.contrib import admin
from .models import Book, User  # Assuming you have a Book model

admin.site.register(Book)
admin.site.register(User)