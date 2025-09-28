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
import csv
from io import TextIOWrapper

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
    """Content-based recommendations.

    Scoring signals (weighted):
    - Genre similarity to user's favorite genres (0.40)
    - Genre similarity to user's saved books (0.20)
    - Author match with user's saved books (0.15)
    - Book rating normalized (0.15)
    - Liked percentage normalized (0.05)
    - Language match with user preference (0.05)
    Excludes books already saved by the user. Returns top 12.
    """
    user = request.user

    # Page size: default to 4, allow override via query param
    try:
        limit = int(request.GET.get('limit', 4))
    except (TypeError, ValueError):
        limit = 4
    limit = max(1, min(limit, 24))  # clamp to a reasonable range

    # Gather user signals
    favorite_genres = set(user.favorite_genres.values_list('name', flat=True))
    preferred_language = (user.preferred_language or '').strip().lower()

    saved_qs = user.saved_books.all()
    saved_ids = set(saved_qs.values_list('id', flat=True))
    saved_authors = set(a for a in saved_qs.values_list('author', flat=True) if a)
    # Union of all genres from saved books
    saved_genres_union = set()
    for sb in saved_qs:
        try:
            for g in (sb.genres or []):
                if isinstance(g, str):
                    saved_genres_union.add(g)
        except Exception:
            pass

    # Helper functions
    def jaccard(a: set, b: set) -> float:
        if not a and not b:
            return 0.0
        inter = a.intersection(b)
        union = a.union(b)
        return len(inter) / len(union) if union else 0.0

    def clamp01(x: float) -> float:
        return 0.0 if x is None else max(0.0, min(1.0, float(x)))

    # We will score all non-saved books; optionally prefilter to any overlapping genre if user has favorites
    candidates_qs = Book.objects.exclude(id__in=saved_ids)
    candidates = list(candidates_qs)

    scored = []
    for b in candidates:
        try:
            b_genres = set([g for g in (b.genres or []) if isinstance(g, str)])
        except Exception:
            b_genres = set()

        # Signals
        fav_genre_sim = jaccard(favorite_genres, b_genres) if favorite_genres else 0.0
        saved_genre_sim = jaccard(saved_genres_union, b_genres) if saved_genres_union else 0.0
        author_match = 1.0 if (b.author and b.author in saved_authors) else 0.0
        rating_norm = clamp01((b.rating or 0.0) / 5.0)
        liked_norm = clamp01((b.liked_percentage or 0.0) / 100.0)
        lang_match = 1.0 if (preferred_language and (b.language or '').strip().lower() == preferred_language) else 0.0

        # Weights
        score = (
            0.40 * fav_genre_sim +
            0.20 * saved_genre_sim +
            0.15 * author_match +
            0.15 * rating_norm +
            0.05 * liked_norm +
            0.05 * lang_match
        )
        scored.append((score, b))

    # If we have absolutely no signals (new user), fall back to top-rated
    if not favorite_genres and not saved_ids:
        fallback_qs = Book.objects.exclude(id__in=saved_ids).order_by('-rating', '-liked_percentage')
        books = list(fallback_qs[:limit])
    else:
        # Sort by score desc, break ties by rating
        scored.sort(key=lambda t: (t[0], getattr(t[1], 'rating', 0.0)), reverse=True)
        books = [b for _, b in scored[:limit]]

        # if too few candidates (tiny dataset), fill with top-rated non-saved
        if len(books) < limit:
            needed = limit - len(books)
            filler = Book.objects.exclude(id__in=saved_ids.union({bk.id for bk in books})) \
                                   .order_by('-rating', '-liked_percentage')[:needed]
            books.extend(list(filler))

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
    limit = int(request.GET.get('limit', 4))

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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_genre(request):
    """Admin: Add one or multiple genres.

    Accepts either {"name": "Fantasy"} or {"names": ["Fantasy", "Sci-Fi"]}
    """
    if not request.user.is_admin:
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    data = request.data or {}
    created = []
    existing = []

    names = []
    if 'name' in data and isinstance(data['name'], str):
        names = [data['name']]
    elif 'names' in data and isinstance(data['names'], list):
        names = [str(n) for n in data['names'] if isinstance(n, (str, int))]

    if not names:
        return Response({"error": "Provide 'name' or 'names'"}, status=status.HTTP_400_BAD_REQUEST)

    for n in names:
        obj, was_created = Genre.objects.get_or_create(name=n.strip())
        (created if was_created else existing).append(obj.name)

    return Response({
        "created": created,
        "existing": existing
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_books_csv(request):
    """Admin: Upload books from a CSV file (multipart/form-data field 'file').

    Expected columns (best-effort):
    title, author, isbn, description, cover_image, publish_date, rating, liked_percentage,
    genres (comma separated), language, page_count, publisher, download_url, buy_now_url, preview_url, is_free
    """
    if not request.user.is_admin:
        return Response({"error": "Admin access required"}, status=status.HTTP_403_FORBIDDEN)

    csv_file = request.FILES.get('file')
    if not csv_file:
        return Response({"error": "No file uploaded. Use field name 'file'"}, status=status.HTTP_400_BAD_REQUEST)

    created_count = 0
    updated_count = 0
    errors = []

    try:
        # Ensure text mode and utf-8 decoding
        text_stream = TextIOWrapper(csv_file.file, encoding='utf-8', errors='ignore')
        reader = csv.DictReader(text_stream)
        for idx, row in enumerate(reader, start=2):  # start=2 accounting for header line 1
            try:
                isbn = (row.get('isbn') or '').strip()
                if not isbn:
                    raise ValueError('Missing ISBN')

                def to_float(v, default=0.0):
                    try:
                        if v is None or v == '':
                            return default
                        s = str(v).strip().replace('%', '')
                        return float(s)
                    except Exception:
                        return default

                def to_int(v, default=0):
                    try:
                        return int(str(v).strip())
                    except Exception:
                        return default

                # Genres: split by comma
                genres_val = row.get('genres') or ''
                genres_list = [g.strip() for g in str(genres_val).split(',') if g and str(g).strip()]

                # Publish date: store as YYYY-MM-DD if parseable
                publish_date = None
                pd_raw = (row.get('publish_date') or '').strip()
                if pd_raw:
                    try:
                        from datetime import datetime
                        publish_date = datetime.fromisoformat(pd_raw).date()
                    except Exception:
                        # try common formats
                        for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%d-%m-%Y'):
                            try:
                                publish_date = datetime.strptime(pd_raw, fmt).date()
                                break
                            except Exception:
                                pass

                defaults = {
                    "title": (row.get('title') or '').strip(),
                    "author": (row.get('author') or '').strip(),
                    "description": (row.get('description') or '').strip(),
                    "cover_image": (row.get('cover_image') or '').strip(),
                    "publish_date": publish_date,
                    "rating": to_float(row.get('rating'), 0.0),
                    "liked_percentage": to_float(row.get('liked_percentage'), 0.0),
                    "genres": genres_list,
                    "language": (row.get('language') or 'English').strip(),
                    "page_count": to_int(row.get('page_count'), 0),
                    "publisher": (row.get('publisher') or '').strip(),
                    "download_url": (row.get('download_url') or '').strip(),
                    "buy_now_url": (row.get('buy_now_url') or '').strip(),
                    "preview_url": (row.get('preview_url') or '').strip(),
                    "is_free": str(row.get('is_free') or '').strip().lower() in ('true', '1', 'yes'),
                }

                obj, created = Book.objects.update_or_create(
                    isbn=isbn,
                    defaults=defaults
                )
                if created:
                    created_count += 1
                else:
                    updated_count += 1
            except Exception as e:
                errors.append({"row": idx, "error": str(e)})

        return Response({
            "created": created_count,
            "updated": updated_count,
            "errors": errors,
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": f"Failed to parse CSV: {e}"}, status=status.HTTP_400_BAD_REQUEST)
