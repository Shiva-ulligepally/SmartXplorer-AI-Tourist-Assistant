import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Mic, Volume2, ArrowRightLeft, Loader2 } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'te', name: 'Telugu' },
  { code: 'ta', name: 'Tamil' },
  { code: 'kn', name: 'Kannada' },
  { code: 'mr', name: 'Marathi' },
  { code: 'bn', name: 'Bengali' },
];

export default function Translator() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('te');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { toast } = useToast();

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate', {
        body: { text: sourceText, sourceLang, targetLang },
      });
      if (error) throw error;
      setTranslatedText(data.translation);
    } catch (error: any) {
      toast({ title: 'Translation Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const startVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({ title: 'Not Supported', description: 'Voice input not supported in this browser', variant: 'destructive' });
      return;
    }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = sourceLang;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => setSourceText(event.results[0][0].transcript);
    recognition.start();
  };

  const speakText = (text: string, lang: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    speechSynthesis.speak(utterance);
  };

  const swapLanguages = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Header />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">Voice Translator</h1>
        <p className="mb-8 text-muted-foreground">AI-powered multilingual translation for travelers</p>

        <div className="mb-6 flex items-center justify-center gap-4">
          <Select value={sourceLang} onValueChange={setSourceLang}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{languages.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={swapLanguages}><ArrowRightLeft className="h-4 w-4" /></Button>
          <Select value={targetLang} onValueChange={setTargetLang}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{languages.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{languages.find((l) => l.code === sourceLang)?.name}</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={startVoiceInput} className={isListening ? 'text-destructive' : ''}>
                  <Mic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => speakText(sourceText, sourceLang)} disabled={!sourceText}>
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea placeholder="Enter text or use voice..." value={sourceText} onChange={(e) => setSourceText(e.target.value)} className="min-h-[200px] resize-none" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">{languages.find((l) => l.code === targetLang)?.name}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => speakText(translatedText, targetLang)} disabled={!translatedText}>
                <Volume2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="min-h-[200px] rounded-md border border-input bg-muted/30 p-3 text-foreground">
                {translatedText || <span className="text-muted-foreground">Translation will appear here...</span>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-center">
          <Button size="lg" onClick={handleTranslate} disabled={isLoading || !sourceText.trim()} className="gap-2 bg-gradient-hero text-primary-foreground">
            {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Translating...</> : 'Translate'}
          </Button>
        </div>
      </div>
    </div>
  );
}
