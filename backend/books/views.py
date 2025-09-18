from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.db.models import Q
from .models import *
from .serializers import *
import random

# Helper to generate tokens
def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }

# ✅ Register
@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    data = request.data
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    first_name = data.get("first_name")
    last_name = data.get("last_name")

    if not username or not email or not password:
        return Response({"detail": "All fields are required"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({"detail": "Username already taken"}, status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({"detail": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

    user = User.objects.create_user(username=username, email=email, password=password, first_name=first_name, last_name=last_name)
    tokens = get_tokens_for_user(user)

    return Response({
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name":user.first_name,
            "last_name":user.last_name
        },
        "access": tokens["access"],
        "refresh": tokens["refresh"],
    }, status=status.HTTP_201_CREATED)

# ✅ Login
@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    data = request.data
    email = data.get("email")
    password = data.get("password")

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    user = authenticate(username=user.username, password=password)
    if not user:
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    tokens = get_tokens_for_user(user)

    return Response({
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
        },
        "access": tokens["access"],
        "refresh": tokens["refresh"],
    }, status=status.HTTP_200_OK)

@api_view(["GET"])
def get_genres(request):
    genres = Genre.objects.all()
    serializer = GenreSerializer(genres, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_user_preferences(request):
    serializer = UserGenrePreferenceSerializer(data=request.data)
    if serializer.is_valid():
        serializer.update(request.user, serializer.validated_data)
        return Response({"detail": "Preferences updated successfully."}, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recommended_books(request):
    user = request.user
    favorite_genres = list(user.favorite_genres.values_list('name', flat=True))

    if favorite_genres:
        # Filter books by favorite genres and randomly select 10
        matching_books = Book.objects.filter(genres__overlap=favorite_genres).distinct()
        if matching_books.count() >= 12:
            books = random.sample(list(matching_books), 12)
        else:
            # If not enough matching books, fill with random books
            additional_books = Book.objects.exclude(id__in=matching_books.values_list('id', flat=True))[:12 - matching_books.count()]
            books = list(matching_books) + list(additional_books)
            random.shuffle(books)
    else:
        # If no favorite genres, return random books
        all_books = list(Book.objects.all())
        books = random.sample(all_books, min(12, len(all_books)))

    serializer = BookSerializer(books, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    serializer = UserDetailSerializer(request.user)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_saved_books(request):
    user = request.user
    books = user.saved_books.all()
    serializer = BookSerializer(books, many=True)
    return Response(serializer.data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_save_book(request, book_id):
    user = request.user
    try:
        book = Book.objects.get(pk=book_id)
    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)

    if book in user.saved_books.all():
        user.saved_books.remove(book)
        return Response({"message": "Book removed from saved list"}, status=status.HTTP_200_OK)
    else:
        user.saved_books.add(book)
        return Response({"message": "Book added to saved list"}, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_books(request):
    query = request.GET.get('q', '')
    if not query:
        return Response([], status=status.HTTP_200_OK)

    books = Book.objects.filter(
        Q(title__istartswith=query) | Q(author__istartswith=query)
    )
    serializer = BookSerializer(books, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def explore_books(request):
    # Get pagination parameters
    offset = int(request.GET.get('offset', 0))
    limit = int(request.GET.get('limit', 10))

    # Get all books and slice based on offset and limit
    all_books = list(Book.objects.all())
    books = all_books[offset:offset + limit]

    serializer = BookSerializer(books, many=True)
    has_more = len(all_books) > (offset + limit)

    return Response({
        'books': serializer.data,
        'has_more': has_more,
        'total_count': len(all_books)
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def book_detail(request, book_id):
    try:
        book = Book.objects.get(pk=book_id)
        serializer = BookSerializer(book)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
