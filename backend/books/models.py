from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.utils import timezone
from django.contrib.postgres.fields import ArrayField
import random
import string
from datetime import timedelta


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
        extra_fields.setdefault("is_admin", True)
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True")
        return self.create_user(email, password, **extra_fields)


class Genre(models.Model):
    """Simple genre table instead of plain strings"""
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class User(AbstractBaseUser, PermissionsMixin):
    first_name = models.CharField(max_length=150, default="")
    last_name = models.CharField(max_length=150, default="")
    username = models.CharField(max_length=100, default="")
    email = models.EmailField(unique=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # required by admin
    is_admin = models.BooleanField(default=False)

    # Preferences / relations
    favorite_genres = models.ManyToManyField(Genre, blank=True, related_name="users")
    # Legacy ManyToMany (kept for backward compatibility but no longer written to)
    saved_books = models.ManyToManyField("Book", blank=True, related_name="saved_by_users")
    # New resilient list of saved book IDs (avoids Djongo failing INSERT translation)
    saved_book_ids = models.JSONField(default=list)

    # User preferences
    preferred_language = models.CharField(max_length=50, default="English")
    notifications_enabled = models.BooleanField(default=True)

    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name", "last_name"]

    objects = UserManager()

    def __str__(self):
        return self.email


class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    @classmethod
    def generate_otp(cls, user):
        # Mark any existing OTPs for this user as used.
        # IMPORTANT: Avoid filtering on is_used=False to prevent Djongo from
        # generating a NOT boolean SQL clause that it cannot translate.
        try:
            cls.objects.filter(user_id=user.id).update(is_used=True)
        except Exception:
            # Fallback: iterate and save individually without boolean filter
            for otp_obj in list(cls.objects.filter(user_id=user.id)):
                if not otp_obj.is_used:
                    otp_obj.is_used = True
                    otp_obj.save()
        
        # Generate a 6-digit OTP
        otp = ''.join(random.choices(string.digits, k=6))
        
        # Set expiry time (10 minutes from now)
        expires_at = timezone.now() + timedelta(minutes=10)
        
        # Create and return the OTP object
        otp_obj = cls.objects.create(user_id=user.id, otp=otp, expires_at=expires_at)
        return otp_obj
    
    def is_valid(self):
        return not self.is_used and self.expires_at > timezone.now()
    
    def __str__(self):
        return f"OTP for {self.user.email} ({self.otp})"


class Book(models.Model):
    title = models.CharField(max_length=255, default="")
    author = models.CharField(max_length=255, default="")
    isbn = models.CharField(max_length=20, unique=True, default="")
    description = models.TextField(blank=True, default="")
    cover_image = models.URLField(max_length=500, blank=True, default="")
    publish_date = models.DateField(null=True, blank=True)
    rating = models.FloatField(default=0.0)
    liked_percentage = models.FloatField(default=0.0)
    genres = models.JSONField(default=list)    
    language = models.CharField(max_length=50, default="English")
    page_count = models.IntegerField(default=0)
    is_free = models.BooleanField(default=False)
    publisher = models.CharField(max_length=255, blank=True, default="")
    buy_now_url = models.URLField(max_length=500, blank=True, default="")
    preview_url = models.URLField(max_length=500, blank=True, default="")
    download_url = models.URLField(max_length=500, blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} by {self.author}"
