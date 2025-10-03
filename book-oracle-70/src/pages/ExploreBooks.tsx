import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ChevronDown, BookOpen, Filter, X, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import BookCard from '@/components/BookCard';
import { apiService } from '@/services/services.api';
import { Book, User, FilterOptions } from '@/types/api';
import { 
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

type ExploreResponse = {
  books: Book[];
  has_more: boolean;
  total_count: number;
};

const ExploreBooks = () => {
  // Sentinel value used in Select items to represent "Any" (no filter)
  const ANY_VALUE = "__any__";
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [isLoadingFilterOptions, setIsLoadingFilterOptions] = useState(false);
  
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

  // Count active filters
  const activeFilterCount = Object.values(appliedFilters).filter(value => value).length;

  useEffect(() => {
    loadUserData();
    loadFilterOptions();
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
  
  const loadFilterOptions = async () => {
    setIsLoadingFilterOptions(true);
    try {
      const response = await apiService.getFilterOptions();
      if (response.ok && response.data) {
        setFilterOptions(response.data);
      }
    } catch (error) {
      console.error('Failed to load filter options:', error);
    } finally {
      setIsLoadingFilterOptions(false);
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
    setAppliedFilters({ ...localFilters });
    setOffset(0); // Reset pagination when filters change
  };
  
  const clearFilters = () => {
    const emptyFilters = {
      author: '',
      isbn: '',
      genre: '',
      published_year: '',
      publisher: '',
      language: ''
    };
    setLocalFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
  };
  
  const handleFilterChange = (key: string, value: string) => {
    const normalized = value === ANY_VALUE ? '' : value;
    setLocalFilters(prev => ({ ...prev, [key]: normalized }));
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
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Explore Books
              </h1>
              <p className="text-muted-foreground">
                Discover new books from our collection
              </p>
            </div>
            
            {/* Filter Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filter Books</SheetTitle>
                  <SheetDescription>
                    Apply filters to find specific books in our collection.
                  </SheetDescription>
                </SheetHeader>
                
                <div className="py-6 space-y-6">
                  {/* Author filter (textbox) */}
                  <div className="space-y-2">
                    <Label htmlFor="author">Author</Label>
                    <Input
                      id="author"
                      placeholder="Enter author name"
                      value={localFilters.author}
                      onChange={(e) => handleFilterChange('author', e.target.value)}
                    />
                  </div>
                  
                  {/* Publisher filter (textbox) */}
                  <div className="space-y-2">
                    <Label htmlFor="publisher">Publisher</Label>
                    <Input
                      id="publisher"
                      placeholder="Enter publisher"
                      value={localFilters.publisher}
                      onChange={(e) => handleFilterChange('publisher', e.target.value)}
                    />
                  </div>
                  
                  {/* Genre filter */}
                  <div className="space-y-2">
                    <Label htmlFor="genre">Genre</Label>
                    <Select
                      value={localFilters.genre}
                      onValueChange={(value) => handleFilterChange('genre', value)}
                    >
                      <SelectTrigger id="genre">
                        <SelectValue placeholder="Select a genre" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ANY_VALUE}>Any genre</SelectItem>
                        {filterOptions?.genres.map((genre) => (
                          <SelectItem key={genre.id} value={genre.name}>{genre.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Publication Year filter (textbox) */}
                  <div className="space-y-2">
                    <Label htmlFor="year" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Publication Year
                    </Label>
                    <Input
                      id="year"
                      placeholder="Enter year (e.g., 2015)"
                      value={localFilters.published_year}
                      onChange={(e) => handleFilterChange('published_year', e.target.value)}
                      inputMode="numeric"
                    />
                  </div>
                  
                  {/* ISBN filter */}
                  <div className="space-y-2">
                    <Label htmlFor="isbn">ISBN</Label>
                    <Input 
                      id="isbn" 
                      placeholder="Enter ISBN"
                      value={localFilters.isbn}
                      onChange={(e) => handleFilterChange('isbn', e.target.value)}
                    />
                  </div>
                  
                  {/* Language filter */}
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={localFilters.language}
                      onValueChange={(value) => handleFilterChange('language', value)}
                    >
                      <SelectTrigger id="language">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ANY_VALUE}>Any language</SelectItem>
                        {filterOptions?.languages.map((language) => (
                          <SelectItem key={language} value={language}>{language}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <SheetFooter className="flex-col sm:flex-row gap-3">
                  <Button 
                    variant="outline"
                    onClick={clearFilters}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                  
                  <SheetClose asChild>
                    <Button onClick={applyFilters}>Apply Filters</Button>
                  </SheetClose>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Applied Filters */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 mb-6 animate-fade-in">
            {Object.entries(appliedFilters).map(([key, value]) => (
              value ? (
                <Badge key={key} variant="secondary" className="px-3 py-1">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}: {value}
                  <button
                    className="ml-2"
                    onClick={() => {
                      const newFilters = { ...appliedFilters, [key]: '' };
                      setLocalFilters(newFilters);
                      setAppliedFilters(newFilters);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null
            ))}
            {activeFilterCount > 1 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters} 
                className="h-7 px-2 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
        )}

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
