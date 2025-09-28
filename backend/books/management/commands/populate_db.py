from django.core.management.base import BaseCommand
import pandas as pd
from books.models import Book, Genre
import ast
import os


class Command(BaseCommand):
    help = 'Populate database with books and genres from CSV files'

    def handle(self, *args, **options):
        # Get the project root directory
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
        self.stdout.write(f"Project root: {project_root}")

        # Load and insert genres
        self.stdout.write("Loading genres...")
        genre_path = os.path.join(project_root, "archive", "genre.csv")
        self.stdout.write(f"Genre path: {genre_path}")
        genre_df = pd.read_csv(genre_path)
        for _, row in genre_df.iterrows():
            Genre.objects.get_or_create(name=row['genre_name'])
        self.stdout.write(self.style.SUCCESS("Genres inserted successfully!"))

        # Load dataset
        self.stdout.write("Loading books...")
        df = pd.read_csv(os.path.join(project_root, "archive", "books.csv"))

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
                        "buy_now_url": row[' buy_now_url'] if pd.notna(row[' buy_now_url']) else "",
                        "preview_url": row['preview_url'] if pd.notna(row['preview_url']) else "",
                        "is_free": row['is_free'] if isinstance(row['is_free'], bool) else str(row['is_free']).lower() == 'true',
                    },
                )
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error inserting row with ISBN {row['isbn']}: {e}"))

        self.stdout.write(self.style.SUCCESS("Books inserted successfully!"))
