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
    print(email, password)
    try:
        user = User.objects.get(email=email)
        print("Found user:", user.username)
    except User.DoesNotExist:
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    user = authenticate(email=user.email, password=password)
    print(user)
    if not user:
        return Response({"detail": "Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)

    tokens = get_tokens_for_user(user)

    serializer = UserDetailSerializer(user)

    return Response({
        "user": serializer.data,
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

    # Get filter parameters
    author_filter = request.GET.get('author', '').strip()
    isbn_filter = request.GET.get('isbn', '').strip()
    genre_filter = request.GET.get('genre', '').strip()
    published_year_filter = request.GET.get('published_year', '').strip()
    publisher_filter = request.GET.get('publisher', '').strip()
    language_filter = request.GET.get('language', '').strip()

    # Start with base queryset
    books_qs = Book.objects.all()

    # Apply filters if provided
    if author_filter:
        books_qs = books_qs.filter(Q(author__icontains=author_filter))
    if isbn_filter:
        books_qs = books_qs.filter(Q(isbn__icontains=isbn_filter))
    if genre_filter:
        books_qs = books_qs.filter(Q(genres__icontains=genre_filter))
    if published_year_filter:
        books_qs = books_qs.filter(Q(publish_date__year=published_year_filter))
    if publisher_filter:
        books_qs = books_qs.filter(Q(publisher__icontains=publisher_filter))
    if language_filter:
        books_qs = books_qs.filter(Q(language__icontains=language_filter))

    # Apply pagination
    total_count = books_qs.count()
    books_qs = books_qs[offset:offset + limit]

    # Serialize the paginated results
    serializer = BookSerializer(books_qs, many=True)
    has_more = (offset + limit) < total_count

    return Response({
        'books': serializer.data,
        'has_more': has_more,
        'total_count': total_count
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    from django.db.models import Count, Avg
    import datetime

    # Get total books
    total_books = Book.objects.count()

    # Get total users
    total_users = User.objects.count()

    # Books added today
    today = datetime.date.today()
    books_added_today = Book.objects.filter(created_at__date=today).count()

    # Average rating
    avg_rating = Book.objects.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0

    # Get most popular genres (books count per genre)
    genre_stats = {}
    for book in Book.objects.all():
        for genre in book.genres:
            genre_stats[genre] = genre_stats.get(genre, 0) + 1
    most_popular_genres = sorted(genre_stats.items(), key=lambda x: x[1], reverse=True)[:5]
    most_popular_genres = [genre for genre, count in most_popular_genres]

    # Recent searches (mock data for now)
    recent_searches = ["fantasy", "mystery", "sci-fi", "romance", "thriller"]

    # Top rated books this month
    thirty_days_ago = datetime.date.today() - datetime.timedelta(days=30)
    top_rated_books_qs = Book.objects.filter(
        updated_at__gte=thirty_days_ago
    ).order_by('-rating')[:4]

    # For now, include recent books as top rated if not enough recent updates
    if top_rated_books_qs.count() < 4:
        recent_books = Book.objects.order_by('-created_at')[:4 - top_rated_books_qs.count()]
        top_rated_books_qs = list(top_rated_books_qs) + list(recent_books)

    serializer = BookSerializer(top_rated_books_qs, many=True)

    return Response({
        'total_books': total_books,
        'total_users': total_users,
        'books_added_today': books_added_today,
        'avg_rating': round(avg_rating, 1),
        'most_popular_genres': most_popular_genres,
        'recent_searches': recent_searches,
        'top_rated_books': serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_users(request):
    if not request.user.is_admin:
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    users = User.objects.all()
    serializer = UserDetailSerializer(users, many=True)
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_user(request, user_id):
    if not request.user.is_admin:
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    try:
        user = User.objects.get(pk=user_id)
        user.delete()
        return Response({"message": "User deleted successfully"}, status=status.HTTP_200_OK)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_books(request):
    if not request.user.is_admin:
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    # Get query parameters
    search_query = request.GET.get('q', '').strip()
    offset = int(request.GET.get('offset', 0))
    limit = int(request.GET.get('limit', 10))

    # Start with base queryset
    books_qs = Book.objects.all()

    # Apply search if query provided
    if search_query:
        books_qs = books_qs.filter(
            Q(title__istartswith=search_query) |
            Q(author__istartswith=search_query) |
            Q(genres__icontains=search_query) |
            Q(isbn__icontains=search_query)
        )

    # Apply pagination
    total_count = books_qs.count()
    books_qs = books_qs[offset:offset + limit]

    # Serialize the paginated results
    serializer = BookSerializer(books_qs, many=True)

    # Check if there are more results
    has_more = (offset + limit) < total_count

    return Response({
        'books': serializer.data,
        'has_more': has_more,
        'total_count': total_count,
        'offset': offset,
        'limit': limit
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_book(request):
    if not request.user.is_admin:
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    serializer = BookSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def edit_book(request, book_id):
    if not request.user.is_admin:
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    try:
        book = Book.objects.get(pk=book_id)
        serializer = BookSerializer(book, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_book(request, book_id):
    if not request.user.is_admin:
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    try:
        book = Book.objects.get(pk=book_id)
        book.delete()
        return Response({"message": "Book deleted successfully"}, status=status.HTTP_200_OK)
    except Book.DoesNotExist:
        return Response({"error": "Book not found"}, status=status.HTTP_404_NOT_FOUND)
