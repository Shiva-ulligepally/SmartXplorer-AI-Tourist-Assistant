import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { User, Phone, Plus, Trash2 } from 'lucide-react';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export default function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', relationship: '' });

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchContacts();
  }, [user]);

  const fetchContacts = async () => {
    const { data } = await supabase.from('emergency_contacts').select('*').eq('user_id', user?.id);
    if (data) setContacts(data);
  };

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('emergency_contacts').insert({ ...newContact, user_id: user?.id });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Contact Added', description: 'Emergency contact saved successfully' });
      setNewContact({ name: '', phone: '', relationship: '' });
      fetchContacts();
    }
  };

  const deleteContact = async (id: string) => {
    await supabase.from('emergency_contacts').delete().eq('id', id);
    fetchContacts();
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50">
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-8 font-serif text-3xl font-bold text-foreground">My Profile</h1>

        <Card className="mb-6">
          <CardHeader><CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Account</CardTitle></CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{user?.email}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5" /> Emergency Contacts</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {contacts.length > 0 ? (
              contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">{contact.name || 'Emergency Contact'}</p>
                    <p className="text-sm text-muted-foreground">{contact.phone} {contact.relationship ? `• ${contact.relationship}` : ''}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteContact(contact.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No emergency contacts added. Add at least one during signup or below.</p>
            )}

            <form onSubmit={addContact} className="space-y-3 border-t border-border pt-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Input placeholder="Name" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} required />
                <Input placeholder="Phone" value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} required />
                <Input placeholder="Relationship" value={newContact.relationship} onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })} />
              </div>
              <Button type="submit" className="gap-2"><Plus className="h-4 w-4" /> Add Contact</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
