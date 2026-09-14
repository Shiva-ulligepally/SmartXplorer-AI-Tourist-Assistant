import { useParams, Link } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { touristPlaces, hotelData } from '@/lib/tourist-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, MapPin, Clock, Ticket, Calendar, Users, AlertTriangle, Hotel, Star, IndianRupee } from 'lucide-react';

export default function PlaceDetail() {
  const { id } = useParams();
  const place = touristPlaces.find((p) => p.id === id);

  if (!place) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground mb-4">Place not found</p>
          <Link to="/places">
            <Button>Back to Places</Button>
          </Link>
        </div>
      </div>
    );
  }

  const alternatives = touristPlaces.filter((p) => p.category === place.category && p.id !== place.id && p.crowdLevel === 'low').slice(0, 3);
  const nearbyPlaces = touristPlaces.filter((p) => p.state === place.state && p.id !== place.id).slice(0, 3);
  const nearbyHotels = hotelData.filter((h) => h.state === place.state).slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-cyan-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Link to="/places" className="mb-6 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Places
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="relative mb-6 h-64 overflow-hidden rounded-xl md:h-96">
              <img src={place.imageUrl} alt={place.name} className="h-full w-full object-cover" />
              {place.crowdLevel === 'high' && (
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-destructive-foreground">
                  <AlertTriangle className="h-4 w-4" /> High Crowd Alert
                </div>
              )}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <Badge>{place.category}</Badge>
              <Badge variant="secondary">{place.state}</Badge>
            </div>
            <h1 className="mb-2 font-serif text-3xl font-bold text-foreground md:text-4xl">{place.name}</h1>
            <p className="mb-6 flex items-center gap-2 text-lg text-muted-foreground">
              <MapPin className="h-5 w-5" /> {place.location}, {place.state}
            </p>

            <div className="prose max-w-none">
              <h2 className="font-serif text-xl font-semibold text-foreground">About</h2>
              <p className="text-muted-foreground">{place.description}</p>
              <h2 className="mt-6 font-serif text-xl font-semibold text-foreground">History</h2>
              <p className="text-muted-foreground">{place.history}</p>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Visit Information</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Clock className="mt-1 h-5 w-5 text-primary" />
                  <div><p className="font-medium">Timings</p><p className="text-sm text-muted-foreground">{place.timings}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Ticket className="mt-1 h-5 w-5 text-primary" />
                  <div><p className="font-medium">Entry Fee</p><p className="text-sm text-muted-foreground">{place.entryFee}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="mt-1 h-5 w-5 text-primary" />
                  <div><p className="font-medium">Best Time</p><p className="text-sm text-muted-foreground">{place.bestTime}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="mt-1 h-5 w-5 text-primary" />
                  <div><p className="font-medium">Crowd Level</p><Badge variant={place.crowdLevel === 'low' ? 'default' : place.crowdLevel === 'medium' ? 'secondary' : 'destructive'}>{place.crowdLevel}</Badge></div>
                </div>
              </CardContent>
            </Card>

            {place.crowdLevel === 'high' && alternatives.length > 0 && (
              <Card className="border-secondary">
                <CardHeader><CardTitle className="text-secondary">Less Crowded Alternatives</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {alternatives.map((alt) => (
                    <Link key={alt.id} to={`/places/${alt.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
                      <img src={alt.imageUrl} alt={alt.name} className="h-12 w-12 rounded-lg object-cover" />
                      <div><p className="font-medium">{alt.name}</p><p className="text-xs text-muted-foreground">{alt.location}, {alt.state}</p></div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {nearbyHotels.length > 0 && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hotel className="h-5 w-5 text-primary" />
                    Nearby Hotels
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {nearbyHotels.map((hotel) => (
                    <Link key={hotel.id} to={`/hotels`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
                      <img src={hotel.imageUrl} alt={hotel.name} className="h-12 w-12 rounded-lg object-cover" />
                      <div className="flex-1">
                        <p className="font-medium">{hotel.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {hotel.rating}
                          </span>
                          <span className="flex items-center">
                            <IndianRupee className="h-3 w-3" />
                            {hotel.pricePerNight}/night
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                  <Link to="/hotels" className="block text-center text-sm text-primary hover:underline mt-2">
                    View all hotels →
                  </Link>
                </CardContent>
              </Card>
            )}

            {nearbyPlaces.length > 0 && (
              <Card>
                <CardHeader><CardTitle>More in {place.state}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {nearbyPlaces.map((nearby) => (
                    <Link key={nearby.id} to={`/places/${nearby.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted">
                      <img src={nearby.imageUrl} alt={nearby.name} className="h-12 w-12 rounded-lg object-cover" />
                      <div><p className="font-medium">{nearby.name}</p><p className="text-xs text-muted-foreground">{nearby.location}</p></div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
