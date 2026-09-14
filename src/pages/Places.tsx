import { useState } from 'react';
import Header from '@/components/layout/Header';
import { touristPlaces, categories, states } from '@/lib/tourist-data';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Places() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeState, setActiveState] = useState('All States');

  const filtered = touristPlaces.filter((place) => {
    const matchesSearch = place.name.toLowerCase().includes(search.toLowerCase()) || place.location.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || place.category === activeCategory;
    const matchesState = activeState === 'All States' || place.state === activeState;
    return matchesSearch && matchesCategory && matchesState;
  });

  const getCrowdColor = (level: string) => {
    if (level === 'low') return 'bg-accent text-accent-foreground';
    if (level === 'medium') return 'bg-secondary text-secondary-foreground';
    return 'bg-destructive text-destructive-foreground';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-2 font-serif text-3xl font-bold text-foreground md:text-4xl">Explore India</h1>
        <p className="mb-8 text-muted-foreground">Discover {touristPlaces.length} amazing destinations across the country</p>

        {/* Search & State Filter */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search places..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
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

        {/* Categories */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <p className="mb-4 text-sm text-muted-foreground">{filtered.length} places found</p>

        {/* Places Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((place) => (
            <Link key={place.id} to={`/places/${place.id}`}>
              <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
                <div className="relative h-48 overflow-hidden">
                  <img src={place.imageUrl} alt={place.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  <Badge className={`absolute right-2 top-2 ${getCrowdColor(place.crowdLevel)}`}>
                    <Users className="mr-1 h-3 w-3" /> {place.crowdLevel} crowd
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="mb-2 flex flex-wrap gap-1">
                    <Badge variant="outline">{place.category}</Badge>
                    <Badge variant="secondary" className="text-xs">{place.state}</Badge>
                  </div>
                  <h3 className="mb-1 font-serif text-lg font-semibold text-card-foreground">{place.name}</h3>
                  <p className="mb-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" /> {place.location}, {place.state}
                  </p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{place.description}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-lg text-muted-foreground">No places found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
