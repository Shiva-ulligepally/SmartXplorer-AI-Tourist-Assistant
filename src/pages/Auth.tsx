import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState(['', '', '', '']);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Validate emergency contacts
        const validContacts = emergencyContacts.filter((phone) => phone.trim() !== '');
        if (validContacts.length === 0) {
          throw new Error('Please add at least one emergency contact');
        }

        const { error } = await signUp(email, password, fullName);
        if (error) throw error;

        // Get the current user
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (!currentUser) throw new Error('Failed to get user');

        // Save emergency contacts to database
        const contactsToSave = validContacts.map((phone, index) => ({
          user_id: currentUser.id,
          phone: phone.trim(),
          name: `Emergency Contact ${index + 1}`,
          relationship: '',
        }));

        const { error: contactError } = await supabase.from('emergency_contacts').insert(contactsToSave);
        if (contactError) {
          console.error('Error saving emergency contacts:', contactError);
          // Don't fail signup if emergency contacts fail to save
        }

        toast({ title: 'Account created!', description: 'Welcome to SmartXplorer' });
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast({ title: 'Welcome back!', description: 'Successfully logged in' });
      }
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-hero">
            <span className="text-2xl font-bold text-primary-foreground">S</span>
          </div>
          <CardTitle className="font-serif text-2xl">{isSignUp ? 'Create Account' : 'Welcome Back'}</CardTitle>
          <CardDescription>{isSignUp ? 'Start your journey with SmartXplorer' : 'Login to continue exploring'}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your name" required />
                </div>
                <div className="space-y-2">
                  <Label>Emergency Contacts (4 Phone Numbers)</Label>
                  <div className="space-y-2">
                    {emergencyContacts.map((contact, index) => (
                      <Input
                        key={index}
                        type="tel"
                        value={contact}
                        onChange={(e) => {
                          const newContacts = [...emergencyContacts];
                          newContacts[index] = e.target.value;
                          setEmergencyContacts(newContacts);
                        }}
                        placeholder={`Emergency contact ${index + 1} (e.g., +1-555-123-4567)`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Add at least one contact for SOS feature. Format: (555) 123-4567 or +1-555-123-4567</p>
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-gradient-hero text-primary-foreground" disabled={isLoading}>
              {isLoading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Login'}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => setIsSignUp(!isSignUp)} className="font-medium text-primary hover:underline">
              {isSignUp ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
