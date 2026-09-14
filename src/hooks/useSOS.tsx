import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SOSState {
  isTracking: boolean;
  latitude: number | null;
  longitude: number | null;
  mapsLink: string | null;
  error: string | null;
}

interface EmergencyContact {
  id: string;
  phone: string;
}

export const useSOS = () => {
  const [sosState, setSOSState] = useState<SOSState>({
    isTracking: false,
    latitude: null,
    longitude: null,
    mapsLink: null,
    error: null,
  });

  const watchIdRef = { current: null as number | null };
  const { toast } = useToast();
  const { user } = useAuth();

  /**
   * Request geolocation permission and save SOS alert to database
   */
  const requestLocationPermission = useCallback(async (): Promise<{
    latitude: number;
    longitude: number;
  } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by your browser';
        setSOSState((prev) => ({ ...prev, error: errorMsg }));
        toast({
          title: 'Geolocation Unavailable',
          description: errorMsg,
          variant: 'destructive',
        });
        resolve(null);
        return;
      }

      // Request current position (this triggers permission dialog)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSOSState((prev) => ({
            ...prev,
            latitude,
            longitude,
            error: null,
          }));
          resolve({ latitude, longitude });
        },
        (error) => {
          let errorMsg = 'Failed to get location';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Location permission was denied. Please enable location access in browser settings.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = 'Location information is unavailable.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'The request to get user location timed out.';
          }

          setSOSState((prev) => ({ ...prev, error: errorMsg }));
          toast({
            title: 'Location Error',
            description: errorMsg,
            variant: 'destructive',
          });
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }, [toast]);

  /**
   * Generate Google Maps live location link
   */
  const generateMapsLink = useCallback(
    (latitude: number, longitude: number): string => {
      return `https://www.google.com/maps?q=${latitude},${longitude}`;
    },
    []
  );

  /**
   * Send SMS to emergency contacts with live location link
   */
  const sendSMSToContacts = useCallback(
    async (contacts: EmergencyContact[], mapsLink: string) => {
      if (contacts.length === 0) {
        console.error('[SOS] ERROR: No emergency contacts to notify via SMS');
        throw new Error('No emergency contacts found. Cannot send SMS.');
      }

      console.log(`[SOS] Starting SMS sending process for ${contacts.length} contact(s)...`);

      try {
        // Prepare SMS message with location link
        const userName = user?.user_metadata?.full_name || 'Emergency';
        const message = `🚨 EMERGENCY ALERT 🚨\n${userName} needs help!\nLocation: ${mapsLink}`;

        console.log(`[SOS] Message to send: "${message}"`);

        let successCount = 0;
        let failureCount = 0;

        // Send SMS to each emergency contact
        for (const contact of contacts) {
          if (!contact.phone || contact.phone.trim() === '') {
            console.warn(`[SOS] Skipping contact with empty phone number`);
            continue;
          }

          try {
            console.log(`[SOS] ===== SENDING SMS TO: ${contact.phone} =====`);
            
            const response = await supabase.functions.invoke('send-sms', {
              body: {
                phone: contact.phone.trim(),
                message: message,
              },
            });

            console.log(`[SOS] Response from send-sms function:`, response);

            if (response.error) {
              console.error(`[SOS] ❌ FAILED to send SMS to ${contact.phone}. Error:`, response.error);
              failureCount++;
              toast({
                title: 'SMS Send Failed',
                description: `Could not send SMS to ${contact.phone}: ${response.error}`,
                variant: 'destructive',
              });
            } else {
              console.log(`[SOS] ✅ SMS sent successfully to ${contact.phone}`);
              console.log(`[SOS] Response data:`, response.data);
              successCount++;
            }
          } catch (contactError) {
            console.error(`[SOS] ❌ Exception sending SMS to ${contact.phone}:`, contactError);
            failureCount++;
          }
        }

        console.log(`[SOS] SMS sending complete. Success: ${successCount}, Failed: ${failureCount}`);

        if (successCount === 0) {
          throw new Error(`Failed to send SMS to all ${contacts.length} contacts. Check console for details.`);
        }

        if (failureCount > 0) {
          toast({
            title: 'Partial SMS Send',
            description: `Sent to ${successCount}/${contacts.length} contacts`,
            variant: 'default',
          });
        }
      } catch (error) {
        console.error('[SOS] ❌ CRITICAL ERROR in SMS notification process:', error);
        throw error;
      }
    },
    [user?.user_metadata?.full_name, toast]
  );

  /**
   * Save SOS alert to database and fetch emergency contacts from Supabase
   */
  const saveSOSAlert = useCallback(
    async (latitude: number, longitude: number) => {
      if (!user) {
        toast({
          title: 'Authentication Required',
          description: 'Please login to use the SOS feature',
          variant: 'destructive',
        });
        return null;
      }

      try {
        // Save SOS alert record to database
        const { error: alertError } = await supabase.from('sos_alerts').insert({
          user_id: user.id,
          latitude,
          longitude,
          status: 'active',
        });

        if (alertError) throw alertError;

        // Fetch emergency contacts from database
        console.log(`[SOS] Fetching emergency contacts for user: ${user.id}`);
        const { data: contacts, error: contactsError } = await supabase
          .from('emergency_contacts')
          .select('id, phone')
          .eq('user_id', user.id);

        if (contactsError) {
          console.error('[SOS] Error fetching emergency contacts:', contactsError);
          throw contactsError;
        }

        if (!contacts || contacts.length === 0) {
          console.warn('[SOS] No emergency contacts configured. SOS activated but no SMS will be sent.');
          toast({
            title: 'Warning',
            description: 'No emergency contacts found. Please add contacts in your profile.',
            variant: 'destructive',
          });
        } else {
          console.log(
            `[SOS] Found ${contacts.length} emergency contact(s): ${contacts.map((c) => c.phone).join(', ')}`
          );
          console.log(`[SOS] Live location link: ${generateMapsLink(latitude, longitude)}`);
        }

        return (contacts || []) as EmergencyContact[];
      } catch (error) {
        console.error('[SOS] Error saving alert or fetching contacts:', error);
        return [];
      }
    },
    [user, toast, generateMapsLink]
  );

  /**
   * Start continuous live location tracking using watchPosition
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const startLiveTracking = useCallback(
    (latitude: number, longitude: number) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by your browser';
        setSOSState((prev) => ({ ...prev, error: errorMsg }));
        return;
      }

      // Clear any existing watch
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }

      // Start continuous position tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude: newLat, longitude: newLng } = position.coords;

          // Update current location
          setSOSState((prev) => ({
            ...prev,
            latitude: newLat,
            longitude: newLng,
            mapsLink: generateMapsLink(newLat, newLng),
            isTracking: true,
          }));

          console.log(`[SOS] Live location update: ${newLat.toFixed(6)}, ${newLng.toFixed(6)}`);
        },
        (error) => {
          let errorMsg = 'Location tracking error';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Location permission was denied. Stopping live tracking.';
            // Note: Cannot call stopLiveTracking here due to hook dependency limitations
            // Instead, we manually clear the watch
            if (watchIdRef.current !== null) {
              navigator.geolocation.clearWatch(watchIdRef.current);
              watchIdRef.current = null;
            }
            setSOSState((prev) => ({ ...prev, isTracking: false }));
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = 'Location information is temporarily unavailable.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Location request timed out.';
          }

          console.warn(`[SOS] ${errorMsg}`);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    },
    [generateMapsLink]
  );

  /**
   * Stop live location tracking
   */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stopLiveTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setSOSState((prev) => ({
      ...prev,
      isTracking: false,
    }));

    console.log('[SOS] Live tracking stopped');
  }, []);

  /**
   * Activate SOS: Request permission, save alert, and start live tracking
   */
  const activateSOS = useCallback(async () => {
    try {
      console.log('[SOS] ===== SOS ACTIVATION STARTED =====');
      
      // Step 1: Request location permission
      console.log('[SOS] Step 1: Requesting location permission...');
      const location = await requestLocationPermission();
      if (!location) {
        console.error('[SOS] ❌ Location permission denied or unavailable');
        return false;
      }

      const { latitude, longitude } = location;
      console.log(`[SOS] ✅ Location obtained: ${latitude}, ${longitude}`);

      // Step 2: Save SOS alert and get emergency contacts
      console.log('[SOS] Step 2: Saving SOS alert and fetching emergency contacts...');
      const contacts = await saveSOSAlert(latitude, longitude);

      if (!contacts || contacts.length === 0) {
        console.error('[SOS] ❌ No emergency contacts found');
        throw new Error(
          'No emergency contacts configured. Please add emergency contacts to your profile.'
        );
      }

      console.log(`[SOS] ✅ Found ${contacts.length} emergency contacts`);

      // Step 3: Generate Maps link
      console.log('[SOS] Step 3: Generating Google Maps link...');
      const mapsLink = generateMapsLink(latitude, longitude);
      console.log(`[SOS] ✅ Maps link: ${mapsLink}`);
      
      setSOSState((prev) => ({
        ...prev,
        mapsLink,
      }));

      // Step 4: Send SMS to emergency contacts with location
      console.log('[SOS] Step 4: Sending SMS to all emergency contacts...');
      try {
        await sendSMSToContacts(contacts, mapsLink);
        console.log('[SOS] ✅ SMS sending completed');
      } catch (smsError) {
        console.error('[SOS] ❌ SMS sending failed:', smsError);
        // Don't fail SOS completely if SMS fails, continue to live tracking
        toast({
          title: 'SMS Error',
          description: 'Could not send SMS. Check your Twilio configuration.',
          variant: 'destructive',
        });
      }

      // Step 5: Start continuous live tracking
      console.log('[SOS] Step 5: Starting live tracking...');
      startLiveTracking(latitude, longitude);
      console.log('[SOS] ✅ Live tracking started');

      // Show success message
      toast({
        title: 'SOS Activated',
        description:
          'SOS Activated – Live location shared with emergency contacts. Help is on the way.',
      });

      console.log('[SOS] ===== SOS ACTIVATION COMPLETED SUCCESSFULLY =====');
      return true;
    } catch (error) {
      console.error('[SOS] ===== SOS ACTIVATION FAILED =====');
      console.error('[SOS] Error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to activate SOS';
      setSOSState((prev) => ({ ...prev, error: errorMsg }));
      toast({
        title: 'SOS Error',
        description: errorMsg,
        variant: 'destructive',
      });
      return false;
    }
  }, [
    requestLocationPermission,
    saveSOSAlert,
    generateMapsLink,
    sendSMSToContacts,
    startLiveTracking,
    toast,
  ]);

  /**
   * Deactivate SOS and stop live tracking
   */
  const deactivateSOS = useCallback(() => {
    stopLiveTracking();
    setSOSState((prev) => ({
      ...prev,
      isTracking: false,
    }));
    toast({
      title: 'SOS Deactivated',
      description: 'Live location tracking has been stopped.',
    });
  }, [stopLiveTracking, toast]);

  /**
   * Copy Google Maps link to clipboard
   */
  const copyMapsLink = useCallback(() => {
    if (sosState.mapsLink) {
      navigator.clipboard.writeText(sosState.mapsLink);
      toast({
        title: 'Link Copied',
        description: 'Google Maps link copied to clipboard',
      });
    }
  }, [sosState.mapsLink, toast]);

  return {
    ...sosState,
    activateSOS,
    deactivateSOS,
    copyMapsLink,
    isTracking: sosState.isTracking,
  };
};
