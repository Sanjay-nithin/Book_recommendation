import pandas as pd
from datetime import datetime
from books.models import Book

# Load dataset
df = pd.read_csv("../archive/books_data/FinalBooks.csv")

# Convert and insert data
for _, row in df.iterrows():
    try:
        # Convert publishDate to proper DateField format (YYYY-MM-DD)
        publish_date = None
        if pd.notna(row['publishDate']):
            try:
                publish_date = pd.to_datetime(row['publishDate']).date()
            except Exception:
                publish_date = None

        # Convert pages to integer
        page_count = None
        if pd.notna(row['pages']):
            try:
                page_count = int(row['pages'])
            except Exception:
                page_count = None

        # Insert or update (avoid duplicates by ISBN)
        Book.objects.update_or_create(
            isbn=row['isbn'],
            defaults={
                "title": row['title'],
                "author": row['author'],
                "description": row['description'],
                "cover_image": row['coverImg'],
                "publish_date": publish_date,
                "rating": row['rating'],
                "liked_percentage": row['likedPercent'],
                "genres": row['genres'],
                "language": row['language'],
                "page_count": page_count,
                "publisher": row['publisher'],
            },
        )
    except Exception as e:
        print(f"Error inserting row with ISBN {row['isbn']}: {e}")

print("Books inserted successfully!")
