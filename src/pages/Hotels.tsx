import { useState } from 'react';
import Header from '@/components/layout/Header';
import { hotelData, states } from '@/lib/tourist-data';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Star, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hotels() {
  const [search, setSearch] = useState('');
  const [activeState, setActiveState] = useState('All States');

  const filtered = hotelData.filter((hotel) => {
    const matchesSearch = hotel.name.toLowerCase().includes(search.toLowerCase()) || hotel.location.toLowerCase().includes(search.toLowerCase());
    const matchesState = activeState === 'All States' || hotel.state === activeState;
    return matchesSearch && matchesState;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 font-serif text-3xl font-bold text-foreground md:text-4xl">Hotels & Stays</h1>
        <p className="mb-8 text-muted-foreground">Find luxury accommodations across India</p>

        {/* Search & Filter */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search hotels..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={activeState} onValueChange={setActiveState}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              {states.map((state) => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">{filtered.length} hotels found</p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((hotel) => (
            <Card key={hotel.id} className="group h-full overflow-hidden transition-all hover:shadow-lg">
              <div className="relative h-48 overflow-hidden">
                <img src={hotel.imageUrl} alt={hotel.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-1">
                  <Star className="h-4 w-4 fill-secondary text-secondary" />
                  <span className="text-sm font-medium">{hotel.rating}</span>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="mb-2 flex flex-wrap gap-1">
                  <Badge variant="outline">{hotel.category}</Badge>
                  <Badge variant="secondary" className="text-xs">{hotel.state}</Badge>
                </div>
                <h3 className="mb-1 font-serif text-lg font-semibold text-card-foreground">{hotel.name}</h3>
                <p className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {hotel.location}, {hotel.state}
                </p>
                <p className="mb-3 text-sm text-muted-foreground line-clamp-2">{hotel.description}</p>
                <div className="mb-4 flex flex-wrap gap-1">
                  {hotel.amenities.slice(0, 3).map((amenity) => (
                    <Badge key={amenity} variant="outline" className="text-xs">{amenity}</Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-bold text-primary">₹{hotel.pricePerNight.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/night</span></p>
                  <Button size="sm">Book Now</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">No hotels found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
