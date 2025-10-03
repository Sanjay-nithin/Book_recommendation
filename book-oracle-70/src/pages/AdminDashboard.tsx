import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Settings, Trash2, Edit, Search, ChevronDown, BookOpen, Users, BarChart3, Star, TrendingUp, Upload, Tag } from 'lucide-react';
import { apiService } from '@/services/services.api';
import { DashboardStats, Book, User } from '@/types/api';
import { useToast } from '@/hooks/use-toast';
import { AddBookModal } from '@/components/modals/AddBookModal';
import { EditBookModal } from '@/components/modals/EditBookModal';

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("analytics");

  // Book management states
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [isEditBookModalOpen, setIsEditBookModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [bookFormData, setBookFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    cover_image: '',
    publish_date: '',
    rating: '',
    liked_percentage: '',
    genres: '',
    language: 'English',
    page_count: '',
    publisher: ''
  });

  // Books pagination and search states
  const [booksOffset, setBooksOffset] = useState(0);
  const [hasMoreBooks, setHasMoreBooks] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [isLoadingBooks, setIsLoadingBooks] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  // Admin tools state
  const [newGenreName, setNewGenreName] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploadingCsv, setIsUploadingCsv] = useState(false);
  const [csvResult, setCsvResult] = useState<{created:number;updated:number;errors:any[]}|null>(null);

  useEffect(() => {
    loadDashboardData();

    // Listen for custom events from modal components
    const handleBookAdded = () => {
      loadDashboardData(); // Refresh dashboard
      loadBooks(searchQuery, 0, true); // Refresh books table
    };

    const handleBookEdited = () => {
      loadDashboardData();
      loadBooks(searchQuery, 0, true);
    };

    window.addEventListener('bookAdded', handleBookAdded);
    window.addEventListener('bookEdited', handleBookEdited);

    return () => {
      window.removeEventListener('bookAdded', handleBookAdded);
      window.removeEventListener('bookEdited', handleBookEdited);
    };
  }, []);

  const { toast } = useToast();

  const loadDashboardData = async () => {
    try {
      const [dashboardStats, booksList] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getRecommendedBooks()
      ]);

      if (dashboardStats.ok) setStats(dashboardStats.data);
      if (booksList.ok) setBooks(booksList.data);
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
    } finally {
      setIsLoading(false);
      console.log(stats);
    }
  };

  const loadUsers = async () => {
    try {
      const result = await apiService.getAllUsers();
      if (result.ok && result.data) {
        setUsers(result.data);
      } else {
        toast({
          title: "Error loading users",
          description: result.error || "Failed to load users",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error loading users",
        description: "Failed to load users",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await apiService.deleteUser(userId);
      if (result.ok) {
        toast({
          title: "User deleted",
          description: `User "${userName}" has been successfully deleted.`,
        });
        await loadUsers(); // Reload users list
      } else {
        toast({
          title: "Error deleting user",
          description: result.error || "Failed to delete user",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error deleting user",
        description: "Failed to delete user",
        variant: "destructive",
      });
    }
  };

  // Book management functions
  const loadBooks = async (search = searchQuery, offset = 0, reset = false) => {
    setIsLoadingBooks(true);
    try {
      const result = await apiService.getAllBooksAdmin({
        q: search || undefined,
        offset,
        limit: 10
      });

      if (result.ok && result.data) {
        const newBooks = reset ? result.data.books : [...books, ...result.data.books];
        setBooks(newBooks);
        setBooksOffset(result.data.offset + 10);
        setHasMoreBooks(result.data.has_more);

        if (reset) {
          setBooksOffset(10); // Start from first page after search
        }
      }
    } catch (error) {
      toast({
        title: "Error loading books",
        description: "Failed to load books",
        variant: "destructive",
      });
    } finally {
      setIsLoadingBooks(false);
      setIsLoadingMore(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setBooksOffset(0);
    if (query.trim() === '') {
      // If search is empty, load all books
      loadBooks('', 0, true);
    } else {
      // If there's a search query, filter books
      loadBooks(query, 0, true);
    }
  };

  const loadMoreBooks = async () => {
    setIsLoadingMore(true);
    await loadBooks(searchQuery, booksOffset, false);
  };

  // Admin: Add Genre
  const handleAddGenre = async () => {
    const name = newGenreName.trim();
    if (!name) {
      toast({ title: 'Enter a genre name', variant: 'destructive' });
      return;
    }
    const res = await apiService.addGenreAdmin({ name });
    if (res.ok) {
      toast({ title: 'Genre saved', description: `Created: ${(res.data.created||[]).join(', ')}` });
      setNewGenreName('');
    } else {
      toast({ title: 'Failed to add genre', description: res.error || 'Error', variant: 'destructive' });
    }
  };

  // Admin: Import CSV
  const handleImportCsv = async () => {
    if (!csvFile) {
      toast({ title: 'Choose a CSV file first', variant: 'destructive' });
      return;
    }
    setIsUploadingCsv(true);
    setCsvResult(null);
    const res = await apiService.importBooksCsv(csvFile);
    setIsUploadingCsv(false);
    if (res.ok) {
      setCsvResult(res.data);
      toast({ title: 'CSV processed', description: `Created ${res.data.created}, Updated ${res.data.updated}` });
      await loadBooks(searchQuery, 0, true);
      await loadDashboardData();
    } else {
      toast({ title: 'CSV import failed', description: res.error || 'Error', variant: 'destructive' });
    }
  };

  const handleAddBook = async () => {
    try {
      const bookData = {
        ...bookFormData,
        rating: parseFloat(bookFormData.rating) || 0,
        liked_percentage: parseFloat(bookFormData.liked_percentage) || 0,
        page_count: parseInt(bookFormData.page_count) || 0,
        genres: bookFormData.genres ? bookFormData.genres.split(',').map(g => g.trim()) : [],
        publish_date: bookFormData.publish_date || null
      };

      const result = await apiService.addBookAdmin(bookData);
      if (result.ok) {
        toast({
          title: "Book added successfully",
          description: `"${bookFormData.title}" has been added to the collection.`,
        });
        setIsAddBookModalOpen(false);
        resetBookForm();
        await loadBooks();
        await loadDashboardData(); // Refresh stats
      } else {
        toast({
          title: "Error adding book",
          description: result.error || "Failed to add book",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error adding book",
        description: "Failed to add book",
        variant: "destructive",
      });
    }
  };

  const handleEditBook = async () => {
    if (!editingBook) return;

    try {
      const bookData = {
        ...bookFormData,
        rating: parseFloat(bookFormData.rating) || editingBook.rating,
        liked_percentage: parseFloat(bookFormData.liked_percentage) || editingBook.liked_percentage,
        page_count: parseInt(bookFormData.page_count) || editingBook.page_count,
        genres: bookFormData.genres ? bookFormData.genres.split(',').map(g => g.trim()) : editingBook.genres,
        publish_date: bookFormData.publish_date || editingBook.publish_date
      };

      const result = await apiService.editBookAdmin(editingBook.id, bookData);
      if (result.ok) {
        toast({
          title: "Book updated successfully",
          description: `"${bookFormData.title}" has been updated.`,
        });
        setIsEditBookModalOpen(false);
        resetBookForm();
        await loadBooks();
        await loadDashboardData(); // Refresh stats
      } else {
        toast({
          title: "Error updating book",
          description: result.error || "Failed to update book",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error updating book",
        description: "Failed to update book",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBook = async (bookId: number, bookTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${bookTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await apiService.deleteBookAdmin(bookId);
      if (result.ok) {
        toast({
          title: "Book deleted",
          description: `"${bookTitle}" has been deleted from the collection.`,
        });
        await loadBooks();
        await loadDashboardData(); // Refresh stats
      } else {
        toast({
          title: "Error deleting book",
          description: result.error || "Failed to delete book",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error deleting book",
        description: "Failed to delete book",
        variant: "destructive",
      });
    }
  };

  const resetBookForm = () => {
    setBookFormData({
      title: '',
      author: '',
      isbn: '',
      description: '',
      cover_image: '',
      publish_date: '',
      rating: '',
      liked_percentage: '',
      genres: '',
      language: 'English',
      page_count: '',
      publisher: ''
    });
    setEditingBook(null);
  };

  const openEditModal = (book: Book) => {
    setBookFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      description: book.description,
      cover_image: book.cover_image,
      publish_date: book.publish_date,
      rating: book.rating.toString(),
      liked_percentage: book.liked_percentage.toString(),
      genres: book.genres.join(', '),
      language: book.language,
      page_count: book.page_count.toString(),
      publisher: book.publisher
    });
    setEditingBook(book);
    setIsEditBookModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-book-float">
            <BarChart3 className="h-16 w-16 text-primary mx-auto" />
          </div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }
  const quickStats = [
    {
      label: 'Total Books',
      value: stats?.total_books.toLocaleString() || '0',
      icon: BookOpen,
      color: 'text-primary',
      change: '+12%'
    },
    {
      label: 'Active Users',
      value: stats?.total_users.toLocaleString() || '0',
      icon: Users,
      color: 'text-accent',
      change: '+8%'
    },
    {
      label: 'Books Added Today',
      value: stats?.books_added_today.toString() || '0',
      icon: Plus,
      color: 'text-success',
      change: '+15%'
    },
    {
      label: 'Avg. Rating',
      value: stats?.avg_rating.toString() || '0.0',
      icon: Star,
      color: 'text-yellow-500',
      change: '+0.2'
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Admin Header */}
        <div className="mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground">
                Manage books, users, and platform analytics
              </p>
            </div>
            <div className="flex gap-3">
                <Button variant="default" onClick={() => setIsAddBookModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Book
                </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-book transition-all duration-300 hover:-translate-y-1 animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span className="text-xs text-success">{stat.change}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg bg-muted`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Admin Content */}
        <Tabs defaultValue="analytics" className="w-full animate-fade-in" value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          if (value === "users") loadUsers();
          if (value === "books") {
            setSearchInput(searchQuery);
            loadBooks(searchQuery, 0, true);
          }
        }}>
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="books" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Books
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular Genres */}
                <Card>
                  <CardHeader>
                    <CardTitle>Most Popular Genres</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.most_popular_genres.slice(0, 5).map((genre, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 rounded-full bg-accent" />
                            <span className="font-medium">{genre}</span>
                          </div>
                          <Badge variant="outline">{Math.floor(Math.random() * 500) + 100} books</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Searches */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Search Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats?.recent_searches.map((search, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{search}</span>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-3 w-3 text-success" />
                            <span className="text-xs text-muted-foreground">
                              {Math.floor(Math.random() * 50) + 10} searches
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Rated Books */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Rated Books This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats?.top_rated_books.map((book) => (
                      <div key={book.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="aspect-[3/4] bg-muted rounded mb-3 overflow-hidden">
                          <img
                            src={book.cover_image}
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="font-medium text-sm mb-1 line-clamp-2">{book.title}</h4>
                        <p className="text-xs text-muted-foreground mb-2">{book.author}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            ★ {book.rating.toFixed(1)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {book.liked_percentage}% liked
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Books Management Tab */}
          <TabsContent value="books">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Books Management</h2>
                  <p className="text-muted-foreground">Manage your book collection</p>
                </div>
                <Button onClick={() => setIsAddBookModalOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Book
                </Button>
              </div>

              {/* Modal Components */}
              <AddBookModal isOpen={isAddBookModalOpen} onClose={() => setIsAddBookModalOpen(false)} />
              <EditBookModal
                isOpen={!!editingBook}
                onClose={() => setEditingBook(null)}
                book={editingBook}
              />

              <Card>
                <CardHeader>
                  <CardTitle>All Books</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search Bar */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search books by title, author, or genre..."
                        value={searchInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          setSearchInput(value);
                          if (value.length >= 2 || value.length === 0) {
                            handleSearch(value);
                          }
                        }}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Books Table */}
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-60 font-semibold">Title</TableHead>
                          <TableHead className="w-40 font-semibold">Author</TableHead>
                          <TableHead className="w-32 font-semibold">Genres</TableHead>
                          <TableHead className="w-20 font-semibold">Rating</TableHead>
                          <TableHead className="w-16 font-semibold">Pages</TableHead>
                          <TableHead className="w-24 font-semibold">Added</TableHead>
                          <TableHead className="w-20 font-semibold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {books.map((book) => (
                          <TableRow key={book.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium max-w-60">
                              <div className="truncate text-sm">{book.title}</div>
                            </TableCell>
                            <TableCell className="max-w-40">
                              <div className="truncate text-sm">{book.author}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {book.genres.slice(0, 2).map((genre, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                                    {genre.length > 8 ? genre.slice(0, 8) + '...' : genre}
                                  </Badge>
                                ))}
                                {book.genres.length > 2 && (
                                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                    +{book.genres.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 fill-current text-yellow-500" />
                                <span className="text-sm font-medium">{book.rating.toFixed(1)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm">{book.page_count}</span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-muted-foreground">
                                {new Date(book.created_at).toLocaleDateString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-blue-50"
                                  onClick={() => setEditingBook(book)}
                                >
                                  <Edit className="h-3 w-3 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 hover:bg-red-50"
                                  onClick={() => handleDeleteBook(book.id, book.title)}
                                >
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Load More Button */}
                  {books.length > 0 && hasMoreBooks && (
                    <div className="flex justify-center pt-4">
                      <Button
                        onClick={loadMoreBooks}
                        disabled={isLoadingMore}
                        variant="outline"
                        size="lg"
                        className="gap-2"
                      >
                        {isLoadingMore ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            Load More Books
                            <ChevronDown className="h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Empty State */}
                  {books.length === 0 && !isLoadingBooks && (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No books found</p>
                      <p className="text-sm">
                        {searchQuery ? `No books match "${searchQuery}"` : "Add your first book to get started"}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Users Management</h2>
                  <p className="text-muted-foreground">Monitor and manage user accounts</p>
                </div>
                <Badge variant="outline">{users.length} total users</Badge>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Username</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Favorite Genres</TableHead>
                        <TableHead>Join Date</TableHead>
                        <TableHead>Admin</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.first_name} {user.last_name}</TableCell>
                          <TableCell>
                            {user.favorite_genres?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {user.favorite_genres.slice(0, 2).map((genre) => (
                                  <Badge key={genre.name} variant="outline" className="text-xs">
                                    {genre.name}
                                  </Badge>
                                ))}
                                {user.favorite_genres.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{user.favorite_genres.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">None selected</span>
                            )}
                          </TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {user.is_admin ? (
                              <Badge variant="default" className="text-xs bg-green-100 text-green-800">Admin</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">User</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {users.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-16 w-16 mx-auto mb-4" />
                      <p>No users found or failed to load users.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Platform Settings</h2>
                <p className="text-muted-foreground">Configure platform-wide settings</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>General Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Platform Name</label>
                      <p className="text-muted-foreground">BookWise</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Default Language</label>
                      <p className="text-muted-foreground">English</p>
                    </div>
                    <Button variant="outline" size="sm">Update Settings</Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendation Engine</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground">Algorithm Version</label>
                      <p className="text-muted-foreground">v2.1.0</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Last Updated</label>
                      <p className="text-muted-foreground">2 hours ago</p>
                    </div>
                    <Button variant="outline" size="sm">Configure Engine</Button>
                  </CardContent>
                </Card>

                {/* Admin Utilities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Tag className="h-4 w-4"/>Add Genre</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Input placeholder="e.g., Fantasy" value={newGenreName} onChange={(e)=>setNewGenreName(e.target.value)} />
                      <Button onClick={handleAddGenre} disabled={!newGenreName.trim()}>Add</Button>
                    </div>
                    <p className="text-xs text-muted-foreground">You can add genres one at a time. For multiple, separate by commas and we will split automatically in a future update.</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Upload className="h-4 w-4"/>Import Books via CSV</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <input type="file" accept=".csv" onChange={(e)=>setCsvFile(e.target.files?.[0]||null)} />
                    <div className="flex gap-2">
                      <Button onClick={handleImportCsv} disabled={!csvFile || isUploadingCsv}>
                        {isUploadingCsv ? 'Uploading...' : 'Upload & Import'}
                      </Button>
                      <Button variant="outline" onClick={()=>setCsvFile(null)} disabled={isUploadingCsv}>Clear</Button>
                    </div>
                    {csvResult && (
                      <div className="text-sm">
                        <p>Created: <b>{csvResult.created}</b>, Updated: <b>{csvResult.updated}</b></p>
                        {csvResult.errors?.length>0 && (
                          <details className="mt-2">
                            <summary className="cursor-pointer">View {csvResult.errors.length} row errors</summary>
                            <ul className="list-disc pl-6 text-xs text-muted-foreground max-h-40 overflow-auto">
                              {csvResult.errors.slice(0,100).map((er, idx)=>(
                                <li key={idx}>Row {er.row}: {er.error}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Expected headers: title, author, isbn, description, cover_image, publish_date, rating, liked_percentage, genres, language, page_count, publisher, download_url, buy_now_url, preview_url, is_free
                    </p>
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

// Helper function to clean up unused imports
const unused = Dialog; // Keep to avoid import error warnings

export default AdminDashboard;
