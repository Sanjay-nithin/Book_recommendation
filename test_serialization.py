import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from books.models import User
from books.serializers import UserDetailSerializer

# Get all users
users = list(User.objects.all())
print(f"Found {len(users)} users")

# Try to serialize each one
success = True
for user in users:
    try:
        serializer = UserDetailSerializer(user)
        data = serializer.data
        print(f"User {user.id}: {user.email} - OK")
    except Exception as e:
        print(f"User {user.id}: {user.email} - ERROR: {e}")
        success = False
        break

if success:
    print("\nAll users serialized successfully! The admin users endpoint should now work.")
else:
    print("\nSome users still failing serialization - check the error above.")
