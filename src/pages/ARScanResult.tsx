import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Clock, Ticket, Users, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import type { TouristPlace } from '@/lib/tourist-data';

interface ScanResultState {
  scannedImage: string;
  place: TouristPlace;
  confidence: number;
}

// Function to fetch Wikipedia summary for a place
const fetchPlaceInfo = async (placeName: string): Promise<string | null> => {
  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(placeName)}`
    );
    
    if (!response.ok) {
      console.warn(`Wikipedia API returned status ${response.status} for "${placeName}"`);
      return null;
    }
    
    const data = await response.json();
    
    // Extract and clean the extract text
    if (data.extract) {
      let text = data.extract;
      // Remove reference markers like [1], [2], etc.
      text = text.replace(/\[\d+\]/g, '');
      // Limit to a reasonable length for a single paragraph
      if (text.length > 800) {
        text = text.substring(0, 800).trim() + '...';
      }
      return text;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching Wikipedia data:', error);
    return null;
  }
};

export default function ARScanResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scanData, setScanData] = useState<ScanResultState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [placeInfo, setPlaceInfo] = useState<string | null>(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);

  useEffect(() => {
    // Get scan data from navigation state
    const state = location.state as ScanResultState | null;
    
    if (state && state.scannedImage && state.place) {
      setScanData(state);
      console.log('[AR Scan Result] Loaded scan data:', {
        place: state.place.name,
        confidence: state.confidence
      });
      
      // Fetch place info from Wikipedia
      setIsLoadingInfo(true);
      fetchPlaceInfo(state.place.name)
        .then(info => {
          setPlaceInfo(info);
          setIsLoadingInfo(false);
        })
        .catch(error => {
          console.error('Failed to fetch place info:', error);
          setIsLoadingInfo(false);
        });
    } else {
      console.warn('[AR Scan Result] No scan data provided, redirecting to scanner');
      navigate('/ar-scanner');
    }
    
    setIsLoading(false);
  }, [location, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-96 bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded w-1/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!scanData) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="flex items-start gap-4 p-6">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-destructive mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive mb-1">Scan Data Not Found</h3>
                <p className="text-sm text-destructive/80 mb-4">
                  The scan result data could not be loaded. Please return to the scanner and try again.
                </p>
                <Button 
                  onClick={() => navigate('/ar-scanner')} 
                  variant="outline" 
                  size="sm"
                >
                  Back to Scanner
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { place, scannedImage, confidence } = scanData;
  const placeData = place as TouristPlace;

  // Get quality assessment color
  const getQualityColor = (conf: number): string => {
    if (conf >= 75) return 'bg-green-500/20 border-green-500/50 text-green-700';
    if (conf >= 50) return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-700';
    return 'bg-orange-500/20 border-orange-500/50 text-orange-700';
  };

  const getQualityLabel = (conf: number): string => {
    if (conf >= 75) return 'High Confidence';
    if (conf >= 50) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-200 via-pink-200 to-orange-200">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="mb-8 flex items-center gap-4 max-w-7xl mx-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/ar-scanner')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">Scan Result</h1>
            <p className="text-sm text-muted-foreground">Monument identification from your photo</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4">
          {/* Main side-by-side layout: Image | Details */}
          <div className="grid gap-8 lg:grid-cols-12 items-start">
            {/* Left: Scanned Image - 4 columns on desktop */}
            <div className="lg:col-span-4">
              <Card className="shadow-lg hover:shadow-xl transition-shadow h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between gap-2">
                    <span>Your Photo</span>
                    <div className={`px-2 py-1 rounded-full text-xs font-semibold border ${getQualityColor(confidence)}`}>
                      {getQualityLabel(confidence)}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="relative w-full">
                    <img
                      src={scannedImage}
                      alt="Scanned"
                      className="w-full rounded-lg object-cover max-h-96"
                    />
                    <div className="absolute top-2 right-2 bg-primary/90 text-primary-foreground px-2 py-1 rounded-full text-xs font-semibold">
                      {confidence}% match
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right: Place Details - 8 columns on desktop */}
            <div className="lg:col-span-8 space-y-4">
              {/* Place Name and Location */}
              <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-lg p-4 border border-blue-200/50">
                <h2 className="font-serif text-3xl font-bold text-foreground mb-2">
                  {placeData.name}
                </h2>
                <p className="flex items-center gap-2 text-muted-foreground text-base">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  {placeData.location}, {placeData.state}
                </p>
              </div>

              {/* Comprehensive Information from Wikipedia */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">About This Monument</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {isLoadingInfo ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary mr-3" />
                      <span className="text-muted-foreground">Loading detailed information...</span>
                    </div>
                  ) : placeInfo ? (
                    <p className="text-muted-foreground leading-relaxed text-base">
                      {placeInfo}
                    </p>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800 mb-3">
                        Detailed information could not be loaded from online sources. Here's what we know:
                      </p>
                      <p className="text-muted-foreground leading-relaxed">
                        {placeData.history}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Facts */}
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Visit Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4" />
                        Timings
                      </p>
                      <p className="font-semibold text-foreground text-sm">{placeData.timings}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                        <Ticket className="h-4 w-4" />
                        Entry Fee
                      </p>
                      <p className="font-semibold text-foreground text-sm">{placeData.entryFee}</p>
                    </div>
                    {placeData.category && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Category</p>
                        <p className="font-semibold text-foreground text-sm">{placeData.category}</p>
                      </div>
                    )}
                    {placeData.crowLevel && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                          <Users className="h-4 w-4" />
                          Crowd Level
                        </p>
                        <p className="font-semibold text-foreground text-sm">{placeData.crowLevel}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Best Time to Visit */}
              {placeData.bestTime && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200/50">
                  <p className="text-sm font-semibold text-foreground mb-2">Best Time to Visit</p>
                  <p className="text-muted-foreground text-sm leading-relaxed">{placeData.bestTime}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  className="flex-1 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-semibold"
                  onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(placeData.name + ' ' + placeData.state)}`, '_blank')}
                >
                  Search on Web
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/ar-scanner')}
                >
                  Scan Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
