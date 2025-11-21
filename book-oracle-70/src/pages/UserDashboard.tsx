import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Heart, Settings, Search, TrendingUp, Star, Clock, ChevronDown } from 'lucide-react';
import BookCard from '@/components/BookCard';
import { apiService } from '@/services/services.api';
import { Book, User } from '@/types/api';

const UserDashboard = () => {
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [savedBooks, setSavedBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load from localStorage immediately for instant render
      const cachedUser = apiService.getCurrentUser();
      if (cachedUser) setCurrentUser(cachedUser);

      // Parallel fetch (don't wait for user before getting books)
      const [userRes, recsRes, savedRes] = await Promise.all([
        apiService.getCurrentUserDetails(),
        apiService.getRecommendedBooks(),
        apiService.getSavedBooks(),
      ]);

      if (userRes && 'ok' in userRes && userRes.ok && userRes.data) {
        setCurrentUser(userRes.data);
      }

      if (recsRes.ok && recsRes.data) {
        setRecommendations(Array.isArray(recsRes.data) ? recsRes.data : []);
      } else {
        setRecommendations([]);
      }

      if (savedRes.ok && savedRes.data) setSavedBooks(savedRes.data);
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreRecommendations = async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      // Pass existing book IDs to backend to exclude them from results
      const existingIds = recommendations.map(b => b.id);
      
      // Fetch 4 more unique books (backend will exclude the IDs we already have)
      const response = await apiService.exploreBooks({ 
        offset: 0, 
        limit: 4,
        exclude_ids: existingIds 
      });
      
      if (response.ok && response.data && Array.isArray(response.data.books)) {
        const data: { books: Book[] } = response.data;
        setRecommendations(prevBooks => [...prevBooks, ...data.books]);
      }
    } catch (error) {
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleBookToggle = (book: Book, wasAdded: boolean) => {
    // Instant local state update: add or remove book from savedBooks array
    if (wasAdded) {
      setSavedBooks(prev => [...prev, book]);
    } else {
      setSavedBooks(prev => prev.filter(b => b.id !== book.id));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-book-float">
            <BookOpen className="h-16 w-16 text-primary mx-auto" />
          </div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  

  const favoriteGenres = currentUser?.favorite_genres || [];
  const readingStats = {
    totalSaved: savedBooks.length,
    genresFollowing: favoriteGenres.length,
    TotalBooks: 18,
    GenreCollection: 10,
  };
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome back, {currentUser?.first_name}!
              </h1>
              <p className="text-muted-foreground">
                Ready to discover your next great read?
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to="/search">
                  <Search className="mr-2 h-4 w-4" />
                  Search Books
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Reading Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Saved Books', value: readingStats.totalSaved, icon: Heart, color: 'text-red-500' },
            { label: 'Favorite Genres', value: readingStats.genresFollowing, icon: Star, color: 'text-yellow-500' },
            { label: 'Total Saved Books', value: `${readingStats.TotalBooks}`, icon: TrendingUp, color: 'text-green-500' },
            { label: 'Genre Collection', value: `${readingStats.GenreCollection}`, icon: Clock, color: 'text-blue-500' },
          ].map((stat, index) => (
            <Card key={index} className="hover:shadow-book transition-all duration-300 hover:-translate-y-1 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Dashboard Content */}
        <Tabs defaultValue="recommendations" className="w-full animate-fade-in">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              My Recommendations
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Saved Books
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Preferences
            </TabsTrigger>
          </TabsList>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Personalized for You</h2>
                  <p className="text-muted-foreground">
                    Based on your favorite genres and reading history
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/explore">
                    <Search className="mr-2 h-4 w-4" />
                    Explore More
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendations.map((book, index) => (
                  <div key={book.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                    <BookCard book={book} onSaveToggle={handleBookToggle} />
                  </div>
                ))}
              </div>

              {/* Load More Button for Recommendations */}
              <div className="flex justify-center py-8">
                <Button
                  onClick={loadMoreRecommendations}
                  disabled={isLoadingMore}
                  variant="outline"
                  size="lg"
                  className="px-8 py-4 h-auto"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent mr-2" />
                      Loading More Recommendations...
                    </>
                  ) : (
                    <>
                      <ChevronDown className="mr-2 h-5 w-5" />
                      Load More Books
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Saved Books Tab */}
          <TabsContent value="saved">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Your Saved Books</h2>
                  <p className="text-muted-foreground">
                    Books you've marked for later reading
                  </p>
                </div>
                <Badge variant="outline">{savedBooks.length} books saved</Badge>
              </div>

              {savedBooks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {savedBooks.map((book, index) => (
                    <div key={book.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                      <BookCard book={book} onSaveToggle={handleBookToggle} />
                    </div>
                  ))}
                </div>
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">No saved books yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Start saving books you're interested in to build your reading list
                    </p>
                    <Button asChild>
                      <Link to="/search">Browse Books</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Reading Preferences</h2>
                <p className="text-muted-foreground">
                  Manage your favorite genres
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Favorite Genres</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {favoriteGenres.map((genre) => (
                          <Badge key={genre.id} variant="outline">
                            {genre.name}
                          </Badge>
                        ))}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/preferences">Update Genres</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserDashboard;
