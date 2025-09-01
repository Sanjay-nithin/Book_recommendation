from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import *

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "first_name", "last_name", "email", "favorite_genres",
            "saved_book_ids", "password"
        )

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    def validate(self, data):
        user = authenticate(email=data["email"], password=data["password"])
        if user:
            return user
        raise serializers.ValidationError("Invalid credentials")


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "first_name", "last_name", "email",
            "favorite_genres", "saved_book_ids",
            "is_superuser", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "is_superuser", "created_at", "updated_at"]

# serializers.py
from rest_framework import serializers
from .models import Book

class BookSerializer(serializers.ModelSerializer):
    genres = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True
    )

    class Meta:
        model = Book
        fields = [
            'id',
            'title',
            'author',
            'isbn',
            'description',
            'cover_image',
            'publish_date',
            'rating',
            'liked_percentage',
            'genres',
            'language',
            'page_count',
            'publisher',
            'created_at',
            'updated_at',
        ]

    def to_representation(self, instance):
        """Convert comma-separated genres to a list for API response"""
        ret = super().to_representation(instance)
        ret['genres'] = instance.genres.split(',') if instance.genres else []
        return ret

    def to_internal_value(self, data):
        """Convert genres list from frontend back to comma-separated string"""
        if 'genres' in data and isinstance(data['genres'], list):
            data['genres'] = ','.join(data['genres'])
        return super().to_internal_value(data)
