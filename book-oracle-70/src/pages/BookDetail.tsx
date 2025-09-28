import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Heart,
  BookOpen,
  Star,
  Calendar,
  ChevronRight,
  User,
  Hash,
  Tag,
  Globe,
  FileText,
  Building,
  Eye,
  ShoppingCart,
  Download,
  AlertTriangle
} from 'lucide-react';
import { Book, User as UserType } from '@/types/api';
import { apiService } from '@/services/services.api';
import { useToast } from '@/hooks/use-toast';

const BookDetail = () => {
  const { bookId } = useParams<{ bookId: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState<boolean | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBookDetails();
    loadUserData();
  }, [bookId]);

  const loadUserData = async () => {
    try {
      const user = await apiService.getCurrentUserDetails();
      setCurrentUser(user.data);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const loadBookDetails = async () => {
    if (!bookId) return;

    setIsLoading(true);
    try {
      const response = await apiService.getBook(parseInt(bookId));
      if (response.ok && response.data) {
        setBook(response.data);
        // Check if book is saved
        const currentUser = apiService.getCurrentUser();
        if (currentUser?.saved_books) {
          setIsSaved(currentUser.saved_books.includes(parseInt(bookId)));
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load book details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Failed to load book:', error);
      toast({
        title: 'Error',
        description: 'Failed to load book details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!book || !currentUser || isSaving) return;

    setIsSaving(true);
    try {
      const res = await apiService.toggleBookSave(book.id);
      if ('error' in res) {
        toast({
          title: 'Error',
          description: res.error,
          variant: 'destructive'
        });
      } else {
        await apiService.updateCurrentUser();
        setIsSaved(!isSaved);
        toast({
          title: isSaved ? 'Removed from saved' : 'Added to saved',
          description: isSaved
            ? `"${book.title}" was removed from your saved books.`
            : `"${book.title}" was added to your saved books.`,
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDescription = (description: string) => {
    return description.split('\n').map((paragraph, index) => (
      <p key={index} className="mb-4 last:mb-0">{paragraph}</p>
    ));
  };

  const onOpenLink = (url?: string) => {
    if (!url) return;
    try {
      window.location.href = url;
    } catch {}
  };

  const onPreviewInApp = (url?: string) => {
    if (!url) return;
    const qs = new URLSearchParams({ url }).toString();
    navigate(`/preview?${qs}`, { state: { url } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-book-float">
            <BookOpen className="h-16 w-16 text-primary mx-auto" />
          </div>
          <p className="text-muted-foreground">Loading book details...</p>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="text-center py-12 max-w-md">
          <CardContent>
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Book not found</h3>
            <p className="text-muted-foreground mb-6">
              The book you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link to="/dashboard" className="hover:text-primary transition-colors">
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{book.title}</span>
          </nav>
        </div>

        {/* Back Button */}
        <div className="mb-6">
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Side - Cover Image */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <div className="aspect-[3/4] relative">
                <img
                  src={book.cover_image}
                  alt={`${book.title} cover`}
                  className="w-full h-full object-cover"
                />
                {/* Rating Badge */}
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/70 text-white border-none">
                    <Star className="h-4 w-4 mr-1 fill-current text-yellow-400" />
                    {book.rating.toFixed(1)}
                  </Badge>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Side - Book Details */}
          <div className="lg:col-span-3 space-y-6">
            {/* Title and Author */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {book.title}
              </h1>
              <div className="flex items-center space-x-2 text-lg text-muted-foreground mb-4">
                <User className="h-5 w-5" />
                <span>by {book.author}</span>
              </div>
            </div>

            {/* Save Button and Quick Stats */}
            <div className="flex flex-wrap items-center gap-4">
              {currentUser && (
                <Button
                  onClick={handleToggleSave}
                  disabled={isSaving}
                  variant={isSaved ? "secondary" : "default"}
                  size="lg"
                  className="px-6 py-3 h-auto"
                >
                  <Heart className={`mr-2 h-5 w-5 ${isSaved ? 'fill-current text-red-500' : ''}`} />
                  {isSaving ? 'Saving...' : (isSaved ? 'Remove from Saved' : 'Add to Saved')}
                </Button>
              )}

              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{formatDate(book.publish_date)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{book.page_count} pages</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{book.liked_percentage}% liked</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Actions: Preview / Buy / Download */}
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Button variant="secondary" className="w-full" onClick={() => onPreviewInApp(book.preview_url)}>
                  <Eye className="h-4 w-4 mr-2" /> View Preview
                </Button>
                <Button variant="default" className="w-full" onClick={() => onOpenLink(book.buy_now_url)}>
                  <ShoppingCart className="h-4 w-4 mr-2" /> Buy Now
                </Button>
                {book.is_free ? (
                  <Button variant="outline" className="w-full" onClick={() => {
                    if (book.download_url) {
                      const a = document.createElement('a');
                      a.href = book.download_url;
                      a.download = book.title + '.pdf';
                      a.rel = 'noopener';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }
                  }}>
                    <Download className="h-4 w-4 mr-2" /> Download Now
                  </Button>
                ) : (
                  <div className="w-full flex items-center justify-center rounded-md border border-destructive/30 text-destructive py-2 px-3 text-sm bg-destructive/5">
                    <AlertTriangle className="h-4 w-4 mr-2" /> Can't download: this book is not free
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-xl font-semibold mb-3">About this book</h2>
              <div className="text-muted-foreground leading-relaxed">
                {formatDescription(book.description)}
              </div>
            </div>

            <Separator />

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Book Details</h2>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Hash className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">ISBN</p>
                      <p className="font-medium">{book.isbn}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Language</p>
                      <p className="font-medium">{book.language}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Building className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Publisher</p>
                      <p className="font-medium">{book.publisher}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Genres</h2>
                <div className="flex flex-wrap gap-2">
                  {book.genres.map((genre) => (
                    <Badge key={genre} variant="outline" className="px-3 py-1">
                      {genre}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
