from rest_framework import serializers
from .models import *

class BookSerializer(serializers.ModelSerializer):
    genres = serializers.ListField(child=serializers.CharField())

    class Meta:
        model = Book
        fields = "__all__"

class GenreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genre
        fields = ["id", "name"]

class UserDetailSerializer(serializers.ModelSerializer):
    saved_books = serializers.SerializerMethodField()
    favorite_genres = GenreSerializer(many=True, read_only=True)  # use GenreSerializer

    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "username",
            "email",
            "is_admin",
            "is_superuser",
            "favorite_genres",    # now returns [{"id": 1, "name": "Fantasy"}, ...]
            "preferred_language",
            "saved_books",
            "created_at",
            "updated_at"
        ]

    def get_saved_books(self, obj):
        return list(obj.saved_books.values_list("id", flat=True))

class UserGenrePreferenceSerializer(serializers.Serializer):
    genres = serializers.ListField(
        child=serializers.CharField(),  # expecting a list of genre names or IDs
        allow_empty=False
    )

    def update(self, instance, validated_data):
        genre_names = validated_data.get("genres", [])
        genres = Genre.objects.filter(name__in=genre_names)  # lookup by name
        instance.favorite_genres.set(genres)
        instance.save()
        return instance

class DashboardStatsSerializer(serializers.Serializer):
    total_books = serializers.IntegerField()
    total_users = serializers.IntegerField()
    most_popular_genres = serializers.ListField(child=serializers.CharField())
    recent_searches = serializers.ListField(child=serializers.CharField())
    top_rated_books = BookSerializer(many=True, source='top_rated_books')
