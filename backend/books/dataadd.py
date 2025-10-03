from pymongo import MongoClient
import os

# Optionally, load MONGO_URI from environment variable
MONGO_URI = "mongodb+srv://sanjay-nithin:sanjay220_KID@bookrecommendation.zpdmjmo.mongodb.net/?retryWrites=true&w=majority&appName=BookRecommendation"

# Connect to MongoDB
client = MongoClient(MONGO_URI)

# Specify your database and collection
db_name = "BookRecommendation"
collection_name = "books_book"

db = client[db_name]
collection = db[collection_name]

# Delete all documents
result = collection.delete_many({})  # {} matches all documents
print(f"Deleted {result.deleted_count} documents from '{collection_name}' collection.")
