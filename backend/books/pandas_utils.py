import pandas as pd
from io import BytesIO
from datetime import datetime
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Book

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_books_csv_pandas(request):
    """Admin: Upload books from a CSV file (multipart/form-data field 'file') using pandas.

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
        # Use pandas to read the CSV file
        df = pd.read_csv(csv_file, dtype=str)
        
        # Clean the column names (remove whitespace)
        original_columns = list(df.columns)
        df.columns = [col.strip() for col in df.columns]
        
        # Display the column names for debugging
        print(f"Original CSV Headers: {original_columns}")
        print(f"Cleaned DataFrame columns: {list(df.columns)}")
        
        # Check for required fields
        required_fields = ['title', 'author', 'isbn']
        missing_fields = [field for field in required_fields if field not in df.columns]
        if missing_fields:
            return Response({"error": f"Missing required fields: {', '.join(missing_fields)}"}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        # Check for URL fields and report if any are missing (but don't error out)
        url_fields = ['download_url', 'buy_now_url', 'preview_url']
        missing_urls = [field for field in url_fields if field not in df.columns]
        if missing_urls:
            print(f"Notice: Missing URL fields in CSV: {missing_urls}")
            
        # Display the first row for debugging
        if len(df) > 0:
            print(f"First row data: {df.iloc[0].to_dict()}")
        
        # Helper functions for data conversion
        def ensure_valid_url(url_str):
            if pd.isna(url_str) or not str(url_str).strip():
                return ""
            url_str = str(url_str).strip()
            # Add https:// if no protocol specified
            if not url_str.startswith(('http://', 'https://')):
                return f"https://{url_str}"
            return url_str
        
        # Process each row in the DataFrame
        for idx, row in df.iterrows():
            try:
                # Get ISBN and validate
                isbn = str(row.get('isbn', '')).strip()
                if not isbn or pd.isna(isbn):
                    errors.append({"row": idx + 2, "error": "Missing ISBN"})  # +2 for header row and 0-indexing
                    continue
                
                # Process genres (split comma-separated list)
                genres_val = row.get('genres', '')
                genres_list = []
                if not pd.isna(genres_val) and genres_val:
                    genres_list = [g.strip() for g in str(genres_val).split(',') if g and g.strip()]
                
                # Process publish date
                publish_date = None
                pd_raw = row.get('publish_date', '')
                if not pd.isna(pd_raw) and pd_raw:
                    pd_raw = str(pd_raw).strip()
                    try:
                        publish_date = datetime.fromisoformat(pd_raw).date()
                    except Exception:
                        # Try common formats
                        for fmt in ('%Y-%m-%d', '%m/%d/%Y', '%d-%m-%Y'):
                            try:
                                publish_date = datetime.strptime(pd_raw, fmt).date()
                                break
                            except Exception:
                                pass
                
                # Process numeric fields
                def to_float(val, default=0.0):
                    try:
                        if pd.isna(val) or val == '':
                            return default
                        return float(str(val).strip().replace('%', ''))
                    except Exception:
                        return default
                
                def to_int(val, default=0):
                    try:
                        if pd.isna(val) or val == '':
                            return default
                        return int(str(val).strip())
                    except Exception:
                        return default
                
                # Get and clean URL fields - look for alternative column names too
                download_url = ensure_valid_url(row.get('download_url', ''))
                buy_now_url = ensure_valid_url(row.get('buy_now_url', ''))
                preview_url = ensure_valid_url(row.get('preview_url', ''))
                
                # Log URL fields for debugging
                print(f"Row {idx + 2}: URLs: download={download_url!r}, buy={buy_now_url!r}, preview={preview_url!r}")
                
                # Prepare data for database
                defaults = {
                    "title": str(row.get('title', '')).strip() if not pd.isna(row.get('title', '')) else '',
                    "author": str(row.get('author', '')).strip() if not pd.isna(row.get('author', '')) else '',
                    "description": str(row.get('description', '')).strip() if not pd.isna(row.get('description', '')) else '',
                    "cover_image": str(row.get('cover_image', '')).strip() if not pd.isna(row.get('cover_image', '')) else '',
                    "publish_date": publish_date,
                    "rating": to_float(row.get('rating'), 0.0),
                    "liked_percentage": to_float(row.get('liked_percentage'), 0.0),
                    "genres": genres_list,
                    "language": str(row.get('language', 'English')).strip() if not pd.isna(row.get('language', '')) else 'English',
                    "page_count": to_int(row.get('page_count'), 0),
                    "publisher": str(row.get('publisher', '')).strip() if not pd.isna(row.get('publisher', '')) else '',
                    "buy_now_url": buy_now_url,
                    "preview_url": preview_url,
                    "download_url": download_url,
                    "is_free": str(row.get('is_free', '')).strip().lower() in ('true', '1', 'yes') if not pd.isna(row.get('is_free', '')) else False,
                }
                
                # Update or create the book in database
                obj, created = Book.objects.update_or_create(
                    isbn=isbn,
                    defaults=defaults
                )
                
                # Verify the URLs were properly saved
                saved_book = Book.objects.get(pk=obj.pk)
                print(f"Saved book: {saved_book.title}, URLs: download={saved_book.download_url!r}, buy={saved_book.buy_now_url!r}, preview={saved_book.preview_url!r}")
                
                if created:
                    created_count += 1
                else:
                    updated_count += 1
                    
            except Exception as e:
                print(f"Error processing row {idx + 2}: {str(e)}")
                row_data = row.to_dict()
                errors.append({
                    "row": idx + 2,  # +2 for header row and 0-indexing
                    "error": str(e),
                    "isbn": str(row.get('isbn', 'unknown'))
                })
        
        # Final verification
        sample_books = Book.objects.filter(
            Q(download_url__isnull=False) | 
            Q(buy_now_url__isnull=False) | 
            Q(preview_url__isnull=False)
        ).order_by('-updated_at')[:5]
        
        if not sample_books and (created_count > 0 or updated_count > 0):
            print("WARNING: No books with URLs found after import!")
        else:
            sample_books_list = list(sample_books)
            print(f"URL verification - found {len(sample_books_list)} books with URLs:")
            for b in sample_books_list:
                print(f"Book: {b.title}, URLs: download={b.download_url!r}, buy={b.buy_now_url!r}, preview={b.preview_url!r}")
        
        return Response({
            "created": created_count,
            "updated": updated_count,
            "errors": errors,
            "sample_books_with_urls": [
                {"id": b.id, "title": b.title, "urls": {
                    "download": b.download_url, 
                    "buy": b.buy_now_url, 
                    "preview": b.preview_url
                }} for b in sample_books
            ],
            "column_names": list(df.columns)
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"Error during CSV processing: {str(e)}")
        return Response({"error": f"Failed to parse CSV: {e}"}, status=status.HTTP_400_BAD_REQUEST)