import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useSOS } from '@/hooks/useSOS';
import { AlertTriangle, Phone, CheckCircle } from 'lucide-react';

export default function SOSButton() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // SOS functionality hook: Handles geolocation, live tracking, and emergency contact sharing
  const { activateSOS, isTracking } = useSOS();

  const handleSOS = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to use the SOS feature',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Activate SOS: Request location permission, save alert, start live tracking
      const success = await activateSOS();

      if (success) {
        setShowConfirm(false);
        setShowSuccess(true);
      }
    } catch (error: unknown) {
      console.error('SOS Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not activate SOS. Please try again.';
      toast({
        title: 'SOS Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowConfirm(true)}
        size="sm"
        className="sos-button relative gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90"
        disabled={isTracking}
      >
        <Phone className="h-4 w-4" />
        <span className="hidden sm:inline">{isTracking ? 'Tracking' : 'SOS'}</span>
      </Button>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirm SOS Alert
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will:
              <ul className="mt-2 list-inside list-disc space-y-1 text-left">
                <li>Request your GPS location</li>
                <li>Start live tracking for emergency contacts</li>
                <li>Share a Google Maps live location link</li>
                <li>Alert your emergency contacts immediately</li>
                <li>Create an emergency record</li>
              </ul>
              <p className="mt-4 font-medium text-foreground">
                Only use this in a real emergency!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSOS}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? 'Activating...' : 'Activate SOS'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccess} onOpenChange={setShowSuccess}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-accent">
              <CheckCircle className="h-5 w-5" />
              SOS Activated – Live Location Sharing
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="font-medium text-foreground">
                SOS Activated – Live location is being shared with emergency contacts.
              </p>
              <p className="mt-2">Location link sent via SMS to all emergency contacts.</p>
              <p className="mt-2">Your location will be continuously tracked and updated in real-time.</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Help is on the way. Stay calm and stay where you are if possible.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
