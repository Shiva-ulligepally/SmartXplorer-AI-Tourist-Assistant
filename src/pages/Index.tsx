import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import { MapPin, Mic, Camera, Navigation, Shield, Star, Hotel, ArrowRight } from 'lucide-react';

const features = [
  { icon: Mic, title: 'Voice Translator', desc: 'Multilingual AI translation', to: '/translator', color: 'bg-primary' },
  { icon: Shield, title: 'SOS Emergency', desc: 'One-tap emergency alerts', to: '/places', color: 'bg-destructive' },
  { icon: Camera, title: 'AR Scanner', desc: 'Scan monuments for info', to: '/ar-scanner', color: 'bg-secondary' },
  { icon: Navigation, title: 'GPS Tracking', desc: 'Real-time location', to: '/tracking', color: 'bg-accent' },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-hero opacity-10" />
        <div className="container relative z-10 mx-auto text-center">
          <h1 className="animate-slide-up font-serif text-4xl font-bold leading-tight text-foreground md:text-6xl lg:text-7xl">
            Explore <span className="text-gradient">Incredible India</span>
            <br />Like Never Before
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-fade-in text-lg text-muted-foreground md:text-xl">
            Your smart travel companion for discovering India's heritage, culture, and natural wonders with AI-powered features.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/places">
              <Button size="lg" className="gap-2 bg-gradient-hero text-primary-foreground hover:opacity-90">
                <MapPin className="h-5 w-5" />
                Explore Places
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="lg" variant="outline" className="gap-2">
                Get Started
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16">
        <div className="container mx-auto">
          <h2 className="mb-12 text-center font-serif text-3xl font-bold text-foreground md:text-4xl">
            Smart Features for Smart Travelers
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Link key={feature.title} to={feature.to} className="group">
                <div className="h-full rounded-xl border border-border bg-card p-6 transition-all hover:border-primary hover:shadow-lg">
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.color}`}>
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="mb-2 font-serif text-xl font-semibold text-card-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="bg-muted/50 px-4 py-16">
        <div className="container mx-auto grid gap-8 md:grid-cols-2">
          <Link to="/hotels" className="group rounded-xl bg-card p-8 shadow-sm transition-all hover:shadow-lg">
            <Hotel className="mb-4 h-10 w-10 text-secondary" />
            <h3 className="mb-2 font-serif text-2xl font-bold text-card-foreground">Find Hotels</h3>
            <p className="text-muted-foreground">Book luxury stays across India</p>
          </Link>
          <Link to="/reviews" className="group rounded-xl bg-card p-8 shadow-sm transition-all hover:shadow-lg">
            <Star className="mb-4 h-10 w-10 text-secondary" />
            <h3 className="mb-2 font-serif text-2xl font-bold text-card-foreground">Travel Reviews</h3>
            <p className="text-muted-foreground">Read and share travel experiences</p>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-8">
        <div className="container mx-auto text-center">
          <p className="font-serif text-xl font-bold text-foreground">SmartXplorer</p>
          <p className="mt-2 text-sm text-muted-foreground">Smart Digital Tourism for Incredible India</p>
        </div>
      </footer>
    </div>
  );
}
