import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, BookOpen, Users, Star, TrendingUp, ArrowRight } from 'lucide-react';
import BookCard from '@/components/BookCard';
import { apiService } from '@/services/services.api';
import { Book } from '@/types/api';

const HomePage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingBooks, setTrendingBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = apiService.isAuthenticated();

  useEffect(() => {
    loadTrendingBooks();
  }, []);

  const loadTrendingBooks = async () => {
    try {
      const res = await apiService.getRecommendedBooks();
      if (res.ok && res.data) {
        setTrendingBooks(res.data as Book[]);
      } else {
        setTrendingBooks([]);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const stats = [
    { icon: BookOpen, label: 'Books Available', value: '15,420+', color: 'text-primary' },
    { icon: Users, label: 'Active Readers', value: '2,847+', color: 'text-accent' },
    { icon: Star, label: 'Average Rating', value: '4.3/5', color: 'text-yellow-500' },
    { icon: TrendingUp, label: 'Books Added Weekly', value: '50+', color: 'text-success' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-background via-muted/30 to-accent-soft/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
        
        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="space-y-4 animate-fade-in">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground">
                Discover Your Next
                <span className="bg-gradient-hero bg-clip-text text-transparent"> Great Read</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
                Get personalized book recommendations tailored to your taste. Join thousands of readers finding their perfect match.
              </p>
            </div>

            {/* Hero Search */}
            <div className="max-w-2xl mx-auto animate-slide-up">
              <form onSubmit={handleSearch} className="relative">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    type="search"
                    placeholder="Search for books, authors, or genres..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-32 py-4 text-lg border-2 shadow-hero focus:shadow-book-hover transition-all duration-300"
                  />
                  <Button 
                    type="submit" 
                    size="lg"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    Search
                  </Button>
                </div>
              </form>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
              {!isAuthenticated ? (
                <>
                  <Button variant="hero" size="xl" asChild>
                    <Link to="/register">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="xl" asChild>
                    <Link to="/login">Sign In</Link>
                  </Button>
                </>
              ) : (
                <Button variant="hero" size="xl" asChild>
                  <Link to="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center hover:shadow-book transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardContent className="pt-6">
                  <stat.icon className={`h-8 w-8 mx-auto mb-3 ${stat.color}`} />
                  <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Books Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Trending This Week
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover what other readers are loving right now
            </p>
          </div>

          {/* {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[3/4] bg-muted rounded-lg mb-4" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
              {trendingBooks.map((book, index) => (
                <div key={book.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <BookCard book={book} showSaveButton={isAuthenticated} />
                </div>
              ))}
            </div>
          )} */}

          <div className="text-center mt-12 animate-fade-in">
            <Button variant="outline" size="lg" asChild>
              <Link to={isAuthenticated ? "/dashboard" : "/register"}>
                {isAuthenticated ? "View More Recommendations" : "Join to See More"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose BookWise?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We make book discovery personal, simple, and enjoyable
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Personalized Recommendations",
                description: "Our AI learns your preferences to suggest books you'll love",
                icon: Star,
                gradient: "from-primary to-primary-glow"
              },
              {
                title: "Advanced Search & Filters",
                description: "Find exactly what you're looking for with powerful search tools",
                icon: Search,
                gradient: "from-accent to-accent-soft"
              },
              {
                title: "Community Insights",
                description: "See what others think with ratings, reviews, and popularity metrics",
                icon: Users,
                gradient: "from-success to-emerald-400"
              }
            ].map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-book-hover transition-all duration-300 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader>
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-book`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 px-4 bg-gradient-hero">
          <div className="container mx-auto text-center animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Find Your Next Favorite Book?
            </h2>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-8">
              Join thousands of readers and start getting personalized recommendations today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="accent" size="xl" asChild>
                <Link to="/register">
                  Start Reading Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                <Link to="/login">Already a member?</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default HomePage;