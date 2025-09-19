import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ChevronDown, BookOpen, Filter, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import BookCard from '@/components/BookCard';
import { apiService } from '@/services/services.api';
import { Book, User } from '@/types/api';

type ExploreResponse = {
  books: Book[];
  has_more: boolean;
  total_count: number;
};

const ExploreBooks = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const BOOKS_PER_PAGE = 10;

  const [localFilters, setLocalFilters] = useState({
    author: '',
    isbn: '',
    genre: '',
    published_year: '',
    publisher: '',
    language: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({
    author: '',
    isbn: '',
    genre: '',
    published_year: '',
    publisher: '',
    language: ''
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUserData();
    loadBooks({ offset: 0, limit: BOOKS_PER_PAGE, ...appliedFilters });
  }, [appliedFilters]);

  const loadUserData = async () => {
    try {
      const user = await apiService.getCurrentUserDetails();
      setCurrentUser(user.data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadBooks = async (params: any, append = false) => {
    if (!append) setIsLoading(true);
    if (append) setIsLoadingMore(true);
    try {
      const response = await apiService.exploreBooks(params);
      if (response.ok && response.data) {
        const data: ExploreResponse = response.data;
        setBooks(append ? [...books, ...data.books] : data.books);
        setHasMore(data.has_more);
        setOffset(params.offset + params.limit);
      }
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      if (!append) setIsLoading(false);
      if (append) setIsLoadingMore(false);
    }
  };

  const loadMoreBooks = async () => {
    if (!hasMore || isLoadingMore) return;
    const params = { offset, limit: BOOKS_PER_PAGE, ...appliedFilters };
    await loadBooks(params, true);
  };

  const applyFilters = () => {
    setAppliedFilters(localFilters);
  };

  const refreshUserData = async () => {
    try {
      const user = await apiService.getCurrentUserDetails();
      if ('data' in user) {
        setCurrentUser(user.data);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-book-float">
            <BookOpen className="h-16 w-16 text-primary mx-auto" />
          </div>
          <p className="text-muted-foreground">Loading books...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header with Back Button */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Explore Books
            </h1>
            <p className="text-muted-foreground">
              Discover new books from our collection
            </p>
          </div>
        </div>


        {/* Books Grid */}
        <div className="space-y-8">
          {books.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {books.map((book, index) => (
                <div key={book.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <BookCard book={book} onSaveToggle={refreshUserData} />
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center py-8">
              <Button
                onClick={loadMoreBooks}
                disabled={isLoadingMore}
                variant="outline"
                size="lg"
                className="px-8 py-4 h-auto"
              >
                {isLoadingMore ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent mr-2" />
                    Loading More Books...
                  </>
                ) : (
                  <>
                    <ChevronDown className="mr-2 h-5 w-5" />
                    Load More Books
                  </>
                )}
              </Button>
            </div>
          )}

          {!hasMore && books.length > 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                You've explored all available books!
              </p>
            </div>
          )}

          {books.length === 0 && !isLoading && (
            <Card className="text-center py-12 animate-fade-in">
              <CardContent>
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No books available</h3>
                <p className="text-muted-foreground mb-6">
                  There are no books in our collection at the moment.
                </p>
                <Button asChild>
                  <Link to="/dashboard">Back to Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExploreBooks;
