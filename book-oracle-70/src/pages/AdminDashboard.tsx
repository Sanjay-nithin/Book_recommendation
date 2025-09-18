import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, Users, BarChart3, Plus, Settings, TrendingUp, Star, Eye } from 'lucide-react';
import { apiService } from '@/services/services.api';
import { DashboardStats, Book, User } from '@/types/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [dashboardStats, booksList] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getRecommendedBooks()
      ]);
      
      setStats(dashboardStats);
      setBooks(booksList);
    } catch (error) {
      console.error('Failed to load admin dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
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
      value: '23', 
      icon: Plus, 
      color: 'text-success',
      change: '+15%'
    },
    { 
      label: 'Avg. Rating', 
      value: '4.3', 
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
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button variant="default">
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
        <Tabs defaultValue="analytics" className="w-full animate-fade-in">
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
                        <div key={genre} className="flex items-center justify-between">
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
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add New Book
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Books</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Genre</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Added</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {books.map((book) => (
                        <TableRow key={book.id}>
                          <TableCell className="font-medium">{book.title}</TableCell>
                          <TableCell>{book.author}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {book.genres[0]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 fill-current text-yellow-500" />
                              <span>{book.rating.toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell>{new Date(book.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button variant="ghost" size="sm">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Settings className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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
                <Badge variant="outline">{stats?.total_users} total users</Badge>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-16 w-16 mx-auto mb-4" />
                    <p>User management features will be implemented in the backend integration.</p>
                  </div>
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
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;