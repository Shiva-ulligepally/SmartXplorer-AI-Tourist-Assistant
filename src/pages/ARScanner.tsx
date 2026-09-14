import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { touristPlaces } from '@/lib/tourist-data';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  validateImageFile,
  getImageErrorMessage,
  matchImageToPlace,
  formatConfidence,
  getMatchQualityAssessment
} from '@/lib/imageRecognition';

export default function ARScanner() {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setScanError(null);

    // Validate file using utility
    const validationError = validateImageFile(file);
    if (validationError) {
      const errorMsg = getImageErrorMessage(validationError);
      setScanError(errorMsg);
      toast({ title: 'Invalid File', description: errorMsg, variant: 'destructive' });
      console.error('[AR Scanner] File validation failed:', validationError);
      return;
    }

    if (!file) return;

    try {
      console.log('[AR Scanner] File selected, reading...');
      const reader = new FileReader();
      reader.onload = () => {
        const imageData = reader.result as string;
        console.log('[AR Scanner] Image converted to base64');
        setSelectedImage(imageData);
        console.log('[AR Scanner] Triggering scan processing');
        performARScan(file, imageData);
      };
      reader.onerror = () => {
        const error = 'Failed to read file. Please try again.';
        setScanError(error);
        toast({ title: 'Read Error', description: error, variant: 'destructive' });
        console.error('[AR Scanner] FileReader error');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unexpected error reading file';
      setScanError(errorMsg);
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
      console.error('[AR Scanner] Error reading file:', error);
    }
  };

  const performARScan = (file: File, imageData: string) => {
    setIsScanning(true);
    setScanError(null);

    // Brief loading animation for UX feedback (500ms)
    const processingTime = 500;
    
    console.log(`[AR Scanner] Starting scan for: ${file.name}`);
    
    const scanTimer = setTimeout(() => {
      try {
        console.log('[AR Scanner] Processing timeout reached, running matching algorithm');
        // Use the intelligent matching algorithm from utilities
        const result = matchImageToPlace(file);
        
        console.log('[AR Scanner] Matching result:', result ? `${result.place.name} (${result.confidence}% confidence)` : 'null');
        
        if (result && result.place) {
          const displayConfidence = formatConfidence(result.confidence);
          console.log('[AR Scanner] Formatted confidence:', displayConfidence);
          
          // Get quality assessment
          const assessment = getMatchQualityAssessment(result.confidence);
          console.log('[AR Scanner] Quality assessment:', assessment.level);
          
          // Show appropriate feedback based on confidence
          if (assessment.level === 'high') {
            toast({
              title: 'High Confidence Match!',
              description: `Successfully identified: ${result.place.name}`,
            });
          } else if (assessment.level === 'medium') {
            toast({
              title: 'Moderate Confidence Match',
              description: assessment.message,
            });
          } else {
            toast({
              title: 'Low Confidence Match',
              description: assessment.message,
            });
          }
          
          console.log(`[AR Scanner] Scan complete, navigating to results page for: ${result.place.name}`);
          
          // Navigate to result page with scan data
          navigate('/ar-scan-result', {
            state: {
              scannedImage: imageData,
              place: result.place,
              confidence: displayConfidence
            }
          });
        } else {
          const error = 'Could not identify location. Please try another image.';
          console.error('[AR Scanner] Matching returned null, showing error');
          setScanError(error);
          toast({ title: 'Scan Failed', description: error, variant: 'destructive' });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Scan processing failed';
        console.error('[AR Scanner] Exception during scan:', errorMsg, error);
        setScanError(errorMsg);
        toast({ title: 'Scan Error', description: errorMsg, variant: 'destructive' });
      } finally {
        console.log('[AR Scanner] Scan processing complete, resetting scanning state');
        setIsScanning(false);
      }
    }, processingTime);

    return () => clearTimeout(scanTimer);
  };

  const clearScan = () => {
    setSelectedImage(null);
    setScanError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-indigo-50">
      <Header />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">AR Monument Scanner</h1>
        <p className="mb-8 text-muted-foreground">Scan any Indian monument to learn about its history. For best results, use a clear photo with the monument name in the filename.</p>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Scanner Area */}
          <Card className="overflow-hidden">
            <CardHeader><CardTitle>Scan Monument</CardTitle></CardHeader>
            <CardContent>
              {selectedImage ? (
                <div className="relative">
                  <img src={selectedImage} alt="Scanned" className="aspect-square w-full rounded-lg object-cover" />
                  {isScanning && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/80">
                      <div className="text-center">
                        <div className="mx-auto mb-4 h-16 w-16 animate-pulse rounded-full bg-gradient-hero" />
                        <p className="font-medium text-foreground">Analyzing image...</p>
                        <p className="mt-2 text-xs text-muted-foreground">Processing: extracting features</p>
                      </div>
                    </div>
                  )}
                  <Button variant="destructive" size="icon" className="absolute right-2 top-2" onClick={clearScan}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
                  <Camera className="mb-4 h-16 w-16 text-muted-foreground" />
                  <p className="mb-4 text-center text-muted-foreground">Upload a photo of any Indian monument</p>
                  <p className="mb-6 text-center text-xs text-muted-foreground/70">Tip: Name your file with the monument name (e.g., "taj-mahal.jpg") for better accuracy</p>
                  <Button onClick={() => fileInputRef.current?.click()} className="gap-2">
                    <Upload className="h-4 w-4" /> Upload Image
                  </Button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div>
            {scanError ? (
              <Card className="border-destructive/50 bg-destructive/10">
                <CardContent className="flex items-start gap-4 p-6">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-destructive mb-1">Scan Failed</h3>
                    <p className="text-sm text-destructive/80 mb-4">{scanError}</p>
                    <Button onClick={clearScan} variant="outline" size="sm">
                      Try Another Image
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex h-full items-center justify-center">
                <CardContent className="py-16 text-center">
                  <Camera className="mx-auto mb-4 h-16 w-16 text-muted-foreground/50" />
                  <p className="text-lg font-medium text-muted-foreground">Upload a photo to begin scanning</p>
                  <p className="mt-2 text-sm text-muted-foreground">Your scan results will appear here</p>
                  <p className="mt-4 text-xs text-muted-foreground/70">Works with 175+ pre-loaded Indian monuments</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
