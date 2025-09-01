from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone

class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email must be provided")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)  # hashes the password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_staff", True)
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")
        return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    first_name = models.CharField(max_length=150, default="")
    last_name = models.CharField(max_length=150, default="")
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # required by admin
    favorite_genres = models.TextField(blank=True, default="")
    saved_book_ids = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"  # login field
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    def __str__(self):
        return self.email



class Book(models.Model):
    title = models.CharField(max_length=255, default="")
    author = models.CharField(max_length=255, default="")
    isbn = models.CharField(max_length=20, unique=True, default="")
    description = models.TextField(blank=True, default="")
    cover_image = models.URLField(max_length=500, blank=True, default="")   # coverImg
    publish_date = models.DateField(null=True, blank=True)                  # publishDate
    rating = models.FloatField(default=0.0)
    liked_percentage = models.FloatField(default=0.0)                       # likedPercent
    genres = models.TextField(blank=True, default="")                       # store as comma-separated text
    language = models.CharField(max_length=50, default="English")
    page_count = models.IntegerField(default=0)                             # pages
    publisher = models.CharField(max_length=255, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)  # for website mock data
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} by {self.author}"
