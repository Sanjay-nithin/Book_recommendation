import { BookOpen } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Animated Book Icon */}
        <div className="relative">
          <div className="animate-book-float">
            <BookOpen className="h-16 w-16 text-primary mx-auto" />
          </div>
          <div className="absolute inset-0 animate-pulse">
            <BookOpen className="h-16 w-16 text-accent/30 mx-auto" />
          </div>
        </div>
        
        {/* Loading Text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-foreground">
            BookWise
          </h2>
          <p className="text-muted-foreground">
            Discovering your next great read...
          </p>
        </div>

        {/* Loading Bar */}
        <div className="w-64 h-1 bg-muted rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-gradient-accent animate-shimmer bg-[length:1000px_100px] bg-gradient-to-r from-transparent via-accent/50 to-transparent"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;