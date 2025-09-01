from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import *
from .models import *
from django.db.models import Q
import json

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }

@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": tokens,
            },
            status=status.HTTP_201_CREATED
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data
        tokens = get_tokens_for_user(user)
        return Response(
            {
                "user": UserSerializer(user).data,
                "tokens": tokens,
            },
            status=status.HTTP_200_OK
        )
    print(serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([AllowAny])
def current_user_view(request):
    user = request.user

    if user and user.is_authenticated:
        # Authenticated user: send full details
        serializer = UserSerializer(user)
        return Response(
            {"user": serializer.data},
            status=status.HTTP_200_OK
        )
    return Response(
        {"error": "An unexpected Error"}, status=status.HTTP_403_FORBIDDEN
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def recommended_books(request):
    user_id = request.GET.get("id")  # read `id` from query params
    if not user_id:
        return Response({"error": "User ID is required"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user_id = int(user_id)
    except ValueError:
        return Response({"error": "Invalid User ID"}, status=status.HTTP_400_BAD_REQUEST)
    recommended = Book.objects.all()[:10]


    serializer = BookSerializer(recommended, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_books(request):
    query = request.GET.get("q", "")
    if query:
        # Efficient search only in title
        books = Book.objects.filter(title__icontains=query)[:50]  # limit top 50 results
    else:
        books = Book.objects.none()

    serializer = BookSerializer(books, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_user_genre_preferences(request):
    """
    Update the current user's preferred genres.
    Expects JSON body: { "preferred_genres": ["Fiction", "Fantasy", ...] }
    """
    try:
        data = json.loads(request.body)
        preferred_genres = data.get("preferred_genres", [])
        print(data, preferred_genres)
        if not isinstance(preferred_genres, list):
            return Response(
                {"error": "preferred_genres must be a list."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Assuming your User model has a JSONField or ArrayField for preferred_genres
        user = request.user
        user.favorite_genres = preferred_genres
        user.save()

        return Response({"message": "Preferred genres updated successfully."}, status=status.HTTP_200_OK)

    except json.JSONDecodeError:
        return Response({"error": "Invalid JSON."}, status=status.HTTP_400_BAD_REQUEST)
