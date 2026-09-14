import { useState } from 'react';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Star, User } from 'lucide-react';

export default function Reviews() {
  const [reviews, setReviews] = useState([]); // start with empty reviews
  const [newReview, setNewReview] = useState({ title: '', content: '', rating: 5 });
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: 'Login Required', description: 'Please login to submit a review', variant: 'destructive' });
      return;
    }

    // Add the new review dynamically
    const reviewToAdd = {
      id: Date.now(),
      author: user.name || 'Anonymous',   // display the logged-in user's name
      rating: newReview.rating,
      title: newReview.title,
      content: newReview.content,
      date: new Date().toISOString().split('T')[0],
      email: user.email || '',            // user's email (or any other detail you want)
    };
    setReviews([reviewToAdd, ...reviews]);

    toast({ title: 'Review Submitted', description: 'Thank you for sharing your experience!' });
    setNewReview({ title: '', content: '', rating: 5 });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">Travel Reviews</h1>
        <p className="mb-8 text-muted-foreground">Share and read travel experiences from fellow explorers</p>

        {/* Submit Review */}
        <Card className="mb-8">
          <CardHeader><CardTitle>Share Your Experience</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                placeholder="Review title"
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                required
              />
              <Textarea
                placeholder="Tell us about your journey..."
                value={newReview.content}
                onChange={(e) => setNewReview({ ...newReview, content: e.target.value })}
                required
                className="min-h-[100px]"
              />
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                    >
                      <Star
                        className={`h-6 w-6 ${star <= newReview.rating ? 'fill-secondary text-secondary' : 'text-muted-foreground'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="bg-gradient-hero text-primary-foreground">Submit Review</Button>
            </form>
          </CardContent>
        </Card>  

        {/* Reviews List */}
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground">No reviews yet. Be the first to share your experience!</p>
          ) : (
            reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{review.author}</p>
                        <p className="text-xs text-muted-foreground">{review.date}</p>
                        {review.email && <p className="text-xs text-muted-foreground">{review.email}</p>}
                      </div>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? 'fill-secondary text-secondary' : 'text-muted-foreground'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <h3 className="mb-2 font-serif text-lg font-semibold">{review.title}</h3>
                  <p className="text-muted-foreground">{review.content}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
