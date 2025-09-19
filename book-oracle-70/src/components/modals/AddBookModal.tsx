import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { apiService } from '@/services/services.api';
import { useToast } from '@/hooks/use-toast';

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddBookModal = ({ isOpen, onClose }: AddBookModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
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

  const handleSubmit = async () => {
    try {
      const bookData = {
        ...formData,
        rating: parseFloat(formData.rating) || 0,
        liked_percentage: parseFloat(formData.liked_percentage) || 0,
        page_count: parseInt(formData.page_count) || 0,
        genres: formData.genres ? formData.genres.split(',').map(g => g.trim()) : [],
        publish_date: formData.publish_date || null
      };

      const result = await apiService.addBookAdmin(bookData);
      if (result.ok) {
        toast({
          title: "Book added successfully",
          description: `"${formData.title}" has been added to the collection.`,
        });
        resetForm();
        onClose();
        // Trigger parent component to reload books
        window.dispatchEvent(new CustomEvent('bookAdded'));
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

  const resetForm = () => {
    setFormData({
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Book</DialogTitle>
          <DialogDescription>
            Fill in the details below to add a new book to the collection.
          </DialogDescription>
        </DialogHeader>

        <BookFormContent formData={formData} setFormData={setFormData} />

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            resetForm();
            onClose();
          }}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Add Book
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Shared form content component
const BookFormContent = ({
  formData,
  setFormData
}: {
  formData: any;
  setFormData: (data: any) => void;
}) => {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Book title"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="author">Author *</Label>
          <Input
            id="author"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            placeholder="Book author"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="isbn">ISBN</Label>
          <Input
            id="isbn"
            value={formData.isbn}
            onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
            placeholder="ISBN number"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="language">Language</Label>
          <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Spanish">Spanish</SelectItem>
              <SelectItem value="French">French</SelectItem>
              <SelectItem value="German">German</SelectItem>
              <SelectItem value="Italian">Italian</SelectItem>
              <SelectItem value="Portuguese">Portuguese</SelectItem>
              <SelectItem value="Russian">Russian</SelectItem>
              <SelectItem value="Chinese">Chinese</SelectItem>
              <SelectItem value="Japanese">Japanese</SelectItem>
              <SelectItem value="Korean">Korean</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="publisher">Publisher</Label>
          <Input
            id="publisher"
            value={formData.publisher}
            onChange={(e) => setFormData({ ...formData, publisher: e.target.value })}
            placeholder="Publisher name"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="publish_date">Publish Date</Label>
          <Input
            id="publish_date"
            type="date"
            value={formData.publish_date}
            onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="rating">Rating (0-5)</Label>
          <Input
            id="rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={formData.rating}
            onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
            placeholder="4.5"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="page_count">Page Count</Label>
          <Input
            id="page_count"
            type="number"
            value={formData.page_count}
            onChange={(e) => setFormData({ ...formData, page_count: e.target.value })}
            placeholder="300"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="liked_percentage">Liked %</Label>
          <Input
            id="liked_percentage"
            type="number"
            min="0"
            max="100"
            value={formData.liked_percentage}
            onChange={(e) => setFormData({ ...formData, liked_percentage: e.target.value })}
            placeholder="75"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="genres">Genres (comma-separated)</Label>
        <Input
          id="genres"
          value={formData.genres}
          onChange={(e) => setFormData({ ...formData, genres: e.target.value })}
          placeholder="Fiction, Mystery, Thriller"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="cover_image">Cover Image URL</Label>
        <Input
          id="cover_image"
          value={formData.cover_image}
          onChange={(e) => setFormData({ ...formData, cover_image: e.target.value })}
          placeholder="https://example.com/book-cover.jpg"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Book description..."
          rows={4}
        />
      </div>
    </div>
  );
};
