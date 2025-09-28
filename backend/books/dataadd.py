import pandas as pd
from .models import Book, Genre
import ast

# Load and insert genres
print("Loading genres...")
genre_df = pd.read_csv("../archive/genre.csv")
for _, row in genre_df.iterrows():
    Genre.objects.get_or_create(name=row['genre_name'])
print("Genres inserted successfully!")

# Load dataset
print("Loading books...")
df = pd.read_csv("../archive/books.csv")

# Convert and insert data
for _, row in df.iterrows():
    try:
        # Convert publish_date to proper DateField format (YYYY-MM-DD)
        publish_date = None
        if pd.notna(row['publish_date']):
            try:
                publish_date = pd.to_datetime(row['publish_date']).date()
            except Exception:
                publish_date = None

        # Convert liked_percentage to float (remove %)
        liked_percentage = 0.0
        if pd.notna(row['liked_percentage']):
            try:
                liked_percentage = float(row['liked_percentage'].strip('%'))
            except Exception:
                liked_percentage = 0.0

        # Parse genres string to list
        genres = []
        if pd.notna(row['genres']):
            genres_str = row['genres']
            if isinstance(genres_str, str):
                # Split by comma and strip spaces
                genres = [g.strip() for g in genres_str.split(',')]

        # Insert or update (avoid duplicates by ISBN)
        Book.objects.update_or_create(
            isbn=row['isbn'],
            defaults={
                "title": row['title'],
                "author": row['author'],
                "description": row['description'],
                "cover_image": row['cover_image'],
                "publish_date": publish_date,
                "rating": row['rating'],
                "liked_percentage": liked_percentage,
                "genres": genres,  # list of genre names
                "language": row['language'],
                "page_count": row['page_count'],
                "publisher": row['publisher'],
                "download_url": row['download_url'] if pd.notna(row['download_url']) else "",
                "buy_now_url": row['buy_now_url'] if pd.notna(row['buy_now_url']) else "",
                "preview_url": row['preview_url'] if pd.notna(row['preview_url']) else "",
                "is_free": row['is_free'].lower() == 'true' if pd.notna(row['is_free']) else False,
            },
        )
    except Exception as e:
        print(f"Error inserting row with ISBN {row['isbn']}: {e}")

print("Books inserted successfully!")
