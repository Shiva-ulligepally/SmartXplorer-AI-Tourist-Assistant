import { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Navigation, MapPin, Smartphone, Watch, Share2 } from 'lucide-react';

export default function Tracking() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const { toast } = useToast();

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Not Supported', description: 'Geolocation is not supported by your browser', variant: 'destructive' });
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setIsTracking(true);
      },
      (error) => {
        toast({ title: 'Location Error', description: error.message, variant: 'destructive' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    setWatchId(id);
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  const shareLocation = () => {
    if (location) {
      const url = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
      navigator.clipboard.writeText(url);
      toast({ title: 'Location Copied', description: 'Google Maps link copied to clipboard' });
    }
  };

  useEffect(() => {
    return () => { if (watchId !== null) navigator.geolocation.clearWatch(watchId); };
  }, [watchId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50">
      <Header />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">GPS Location Tracking</h1>
        <p className="mb-8 text-muted-foreground">Real-time location tracking for safe travel</p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Tracking Control */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Navigation className="h-5 w-5" /> Tracking Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge variant={isTracking ? 'default' : 'secondary'} className={isTracking ? 'bg-accent' : ''}>
                  {isTracking ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-sm text-muted-foreground">{isTracking ? 'Location is being tracked' : 'Tracking is off'}</span>
              </div>

              {location && (
                <div className="rounded-lg bg-muted p-4">
                  <p className="mb-1 text-sm font-medium text-foreground">Current Coordinates</p>
                  <p className="font-mono text-sm text-muted-foreground">Lat: {location.lat.toFixed(6)}</p>
                  <p className="font-mono text-sm text-muted-foreground">Lng: {location.lng.toFixed(6)}</p>
                </div>
              )}

              <div className="flex gap-2">
                {!isTracking ? (
                  <Button onClick={startTracking} className="flex-1 gap-2 bg-gradient-hero text-primary-foreground">
                    <Navigation className="h-4 w-4" /> Start Tracking
                  </Button>
                ) : (
                  <Button onClick={stopTracking} variant="destructive" className="flex-1">Stop Tracking</Button>
                )}
                {location && (
                  <Button variant="outline" onClick={shareLocation}><Share2 className="h-4 w-4" /></Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Device Options */}
          <Card>
            <CardHeader><CardTitle>Connected Devices</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 rounded-lg border border-border p-4">
                <Smartphone className="h-8 w-8 text-accent" />
                <div className="flex-1">
                  <p className="font-medium">Phone GPS</p>
                  <p className="text-sm text-muted-foreground">Primary tracking device</p>
                </div>
                <Badge variant="default" className="bg-accent">Connected</Badge>
              </div>

              <div className="flex items-center gap-4 rounded-lg border border-dashed border-border p-4 opacity-60">
                <Watch className="h-8 w-8 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">Smart Wristband</p>
                  <p className="text-sm text-muted-foreground">For elderly travelers (Coming Soon)</p>
                </div>
                <Badge variant="outline">Not Connected</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Map Placeholder */}
          <Card className="md:col-span-2">
            <CardHeader><CardTitle>Live Map View</CardTitle></CardHeader>
            <CardContent>
              <div className="flex h-64 items-center justify-center rounded-lg bg-muted">
                {location ? (
                  <div className="text-center">
                    <MapPin className="mx-auto mb-2 h-12 w-12 animate-bounce text-primary" />
                    <p className="font-medium">You are here</p>
                    <a href={`https://www.google.com/maps?q=${location.lat},${location.lng}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      Open in Google Maps
                    </a>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Start tracking to see your location</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
