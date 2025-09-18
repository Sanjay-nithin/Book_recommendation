import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Loader2, Check } from 'lucide-react';
import { apiService } from '@/services/services.api';
import { useToast } from '@/hooks/use-toast';


const GenrePreferences = () => {
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadGenres();
  }, []);

  const loadGenres = async () => {
    try {
      const res = await apiService.getGenres();
      if ('data' in res) setGenres(res.data);
      else toast({ title: 'Error', description: res.error, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) => (prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]));
  };

  const handleSave = async () => {
    if (selectedGenres.length === 0) {
      toast({
        title: "Select Genres",
        description: "Please select at least one genre to continue.",
        variant: "destructive"
      });
      return;
    }

  setIsSaving(true);
  try {
    const res = await apiService.updateUserGenrePreferences({ genres: selectedGenres });
    if ('error' in res) {
      toast({ title: 'Error', description: res.error, variant: 'destructive' });
      return;
    }

    toast({ title: 'Preferences Saved!', description: 'Your reading preferences have been saved successfully.' });
    navigate('/dashboard');
  } finally {
    setIsSaving(false);
  }
  };
  console.log(genres);
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-accent-soft/20">
        <div className="text-center space-y-4">
          <div className="animate-book-float">
            <BookOpen className="h-16 w-16 text-primary mx-auto" />
          </div>
          <p className="text-muted-foreground">Loading genres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-accent-soft/20 p-4">
      <div className="w-full max-w-2xl animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-hero rounded-2xl mb-4 shadow-hero">
            <BookOpen className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Choose Your Favorite Genres</h1>
          <p className="text-muted-foreground mt-2">
            Help us personalize your reading recommendations
          </p>
        </div>

        <Card className="shadow-book hover:shadow-book-hover transition-all duration-300">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reading Preferences</CardTitle>
            <CardDescription>
              Select the genres you enjoy reading. You can always change these later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {genres.map((genre) => (
              <div
                key={genre.id}
                onClick={() => toggleGenre(genre.name)}
                className={`
                  relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-300 hover:scale-105
                  ${selectedGenres.includes(genre.name) ? 'border-accent bg-accent/10 shadow-book' : 'border-border hover:border-accent/50 hover:bg-accent/5'}
                `}
              >
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-accent text-accent-foreground font-bold">
                    {genre.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{genre.name}</h3>
                  </div>
                </div>

                {selectedGenres.includes(genre.name) && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-accent text-accent-foreground rounded-full flex items-center justify-center animate-fade-in">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}
            </div>

            {selectedGenres.length > 0 && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Selected genres:</span>
                  <Badge variant="outline">{selectedGenres.length} selected</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedGenres.map((g) => (
                    <Badge key={g} className="animate-fade-in" variant="outline">
                      {g}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/login')}
              >
                Back to Login
              </Button>
              <Button 
                className="flex-1"
                size="lg"
                onClick={handleSave}
                disabled={isSaving || selectedGenres.length === 0}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Continue to Dashboard'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GenrePreferences;