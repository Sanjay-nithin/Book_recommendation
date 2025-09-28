import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';

// Simple PDF viewer using <iframe>. We accept a full preview URL via state or query param.
// Pros: No heavy PDF.js dependency, loads streaming-friendly PDF directly from CDN.
// UX: Shows a loader while the iframe is initializing.

const getParam = (search: string, key: string) => new URLSearchParams(search).get(key) || '';

export default function PdfViewer() {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);

  const previewUrl = useMemo(() => {
    // Prefer state.url if passed, otherwise fall back to ?url=
    const stateUrl = (location.state as any)?.url as string | undefined;
    const queryUrl = getParam(location.search, 'url');
    return stateUrl || queryUrl || '';
  }, [location]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800); // small delay for smoother UX
    return () => clearTimeout(timer);
  }, []);

  if (!previewUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-6 w-full max-w-xl text-center">
          <p className="text-red-500 mb-4">No preview URL provided.</p>
          <Button variant="outline" onClick={() => history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Go Back
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-3 border-b flex items-center gap-2">
        <Button variant="outline" onClick={() => history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <div className="text-sm text-muted-foreground truncate">{previewUrl}</div>
      </div>

      {isLoading && (
        <div className="flex-1 grid place-items-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading preview...
          </div>
        </div>
      )}

      <iframe
        title="PDF Preview"
        src={previewUrl}
        className="flex-1 w-full"
        style={{ minHeight: '80vh' }}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
