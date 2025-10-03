import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Search as SearchIcon, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import BookCard from '@/components/BookCard';
import { apiService } from '@/services/services.api';
import { Book, User } from '@/types/api';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const user = await apiService.getCurrentUserDetails();
      setCurrentUser(user.data);
    } catch (error) {}
  };

  // Debounced search function
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await apiService.searchBooks({ query: searchQuery.trim() });
        if (response.ok && response.data) {
          setResults(response.data);
        } else {
          setResults([]);
        }
      } catch (error) {
        setResults([]);
      } finally {
        setIsLoading(false);
        setHasSearched(true);
      }
    },
    []
  );

  // Effect to trigger search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [query, performSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const refreshUserData = async () => {
    try {
      const user = await apiService.getCurrentUserDetails();
      if ('data' in user) {
        setCurrentUser(user.data);
      }
    } catch (error) {}
  };

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
              Search Books
            </h1>
            <p className="text-muted-foreground">
              Find books by title or author
            </p>
          </div>
        </div>

        {/* Search Input */}
        <Card className="mb-8 animate-fade-in">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Start typing to search books by title or author..."
                  value={query}
                  onChange={handleInputChange}
                  className="h-12 pl-10 text-lg"
                />
                {query.length > 0 && query.length < 2 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Type at least 2 characters to start searching
                  </p>
                )}
              </div>
              {isLoading && (
                <p className="text-sm text-muted-foreground">Searching...</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {(query.length >= 2 || hasSearched) && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Search Results</h2>
                <p className="text-muted-foreground">
                  {isLoading
                    ? 'Searching books...'
                    : results.length === 0
                      ? 'No books found matching your search.'
                      : `Found ${results.length} book${results.length === 1 ? '' : 's'}`
                  }
                </p>
              </div>
            </div>

            {results.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {results.map((book, index) => (
                  <div key={book.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <BookCard book={book} onSaveToggle={refreshUserData} />
                  </div>
                ))}
              </div>
            )}

            {results.length === 0 && !isLoading && (
              <Card className="text-center py-12 animate-fade-in">
                <CardContent>
                  <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try different keywords or check your spelling.
                  </p>
                  <Button asChild>
                    <Link to="/dashboard">Browse Recommendations</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
