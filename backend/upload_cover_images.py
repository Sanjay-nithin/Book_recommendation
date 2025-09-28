import os
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# Directory containing cover images
image_dir = '../archive/cover_images'

# List to store results
results = []

# Upload each image
for filename in os.listdir(image_dir):
    if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
        filepath = os.path.join(image_dir, filename)
        try:
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                filepath,
                upload_preset=os.getenv('CLOUDINARY_UPLOAG_PRESET'),
                public_id=filename.split('.')[0],  # Use filename without extension as public_id
                folder='book_covers'  # Optional: organize in a folder
            )
            url = upload_result['secure_url']
            results.append(f"{filename}: {url}")
            print(f"Uploaded {filename}: {url}")
        except Exception as e:
            print(f"Failed to upload {filename}: {e}")

# Write results to txt file
with open('cover_image_urls.txt', 'w') as f:
    for result in results:
        f.write(result + '\n')

print("Upload complete. Results saved to cover_image_urls.txt")
