import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, BookOpen, Star, Calendar } from 'lucide-react';
import { Book } from '@/types/api';
import { apiService } from '@/services/services.api';
import { useToast } from '@/hooks/use-toast';

interface BookCardProps {
  book: Book;
  showSaveButton?: boolean;
  onSaveToggle?: (book: Book, wasAdded: boolean) => void;
}

const BookCard = ({ book, showSaveButton = true, onSaveToggle }: BookCardProps) => {
  const [isSaved, setIsSaved] = useState<boolean | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const currentUser = apiService.getCurrentUser();
  const userSavedBooks = currentUser?.saved_books || [];
  const isBookSaved = isSaved === undefined ? userSavedBooks.includes(book.id) : isSaved;

  useEffect(() => {
    setIsSaved(userSavedBooks.includes(book.id));
  }, [book.id, currentUser?.saved_books]);

  const handleToggleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) return;

    // Optimistic UI: immediately toggle state before API call
    const previousState = isBookSaved;
    const wasAdded = !previousState; // true if adding, false if removing
    setIsSaved(wasAdded);
    
    // Fire callback immediately with book data so parent can update its list instantly
    if (onSaveToggle) onSaveToggle(book, wasAdded);

    // Show instant feedback toast
    toast({
      title: wasAdded ? 'Added to saved' : 'Removed from saved',
      description: wasAdded
        ? `"${book.title}" was added to your saved books.`
        : `"${book.title}" was removed from your saved books.`,
    });

    // Background API call
    setIsLoading(true);
    try {
      const res = await apiService.toggleBookSave(book.id);
      if ('error' in res) {
        // Revert optimistic update on error
        setIsSaved(previousState);
        if (onSaveToggle) onSaveToggle(book, previousState); // revert parent state
        toast({ 
          title: 'Error', 
          description: res.error || 'Failed to save changes', 
          variant: 'destructive' 
        });
      } else {
        // Success: update user session with new saved_books list from response
        if (res.data?.saved_books) {
          const user = apiService.getCurrentUser();
          if (user) {
            user.saved_books = res.data.saved_books;
            localStorage.setItem('user', JSON.stringify(user));
          }
        }
      }
    } catch (err) {
      // Revert on network error
      setIsSaved(previousState);
      if (onSaveToggle) onSaveToggle(book, previousState);
      toast({ 
        title: 'Network error', 
        description: 'Unable to save changes', 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
    });
  };

  return (
    <Card className="group overflow-hidden hover:shadow-book-hover transition-all duration-300 hover:-translate-y-1 bg-card 
      w-90 h-[500px] flex flex-col">
      <Link to={`/books/${book.id}`} className="flex flex-col h-full">
        {/* Cover Image */}
        <div className="aspect-[3/4] relative overflow-hidden bg-muted">
          <img
            src={book.cover_image}
            alt={`${book.title} cover`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Save Button */}
          {showSaveButton && currentUser && (
            <Button
              variant="ghost"
              size="icon"
              className={`absolute top-3 right-3 bg-background/80 backdrop-blur hover:bg-background transition-all duration-300 ${
                isBookSaved ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-red-500'
              }`}
              onClick={handleToggleSave}
              disabled={isLoading}
            >
              <Heart className={`h-4 w-4 ${isBookSaved ? 'fill-current' : ''}`} />
            </Button>
          )}

          {/* Rating Badge */}
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Badge className="bg-black/50 text-white border-none">
              <Star className="h-3 w-3 mr-1 fill-current text-yellow-400" />
              {book.rating.toFixed(1)}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-4 flex flex-col justify-between flex-1">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {book.title}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{book.author}</p>
          </div>

          {/* Genres */}
          <div className="flex flex-wrap gap-1 mt-2">
            {book.genres.slice(0, 2).map((genre) => (
              <Badge key={genre} variant="outline" className="text-xs">
                {genre}
              </Badge>
            ))}
            {book.genres.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{book.genres.length - 2}
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(book.publish_date)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <BookOpen className="h-3 w-3" />
                <span>{book.page_count}p</span>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <Heart className="h-3 w-3" />
              <span>{book.liked_percentage}%</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
            {book.description}
          </p>
        </CardContent>
      </Link>
    </Card>
  );
};

export default BookCard;
