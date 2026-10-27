import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Star, ArrowLeft, Loader2, Award } from 'lucide-react';

export const ReviewFormPage = () => {
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking');
  const navigate = useNavigate();
  const toast = useToast();

  const [booking, setBooking] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      toast.error('Booking ID is missing');
      navigate('/bookings');
      return;
    }

    const fetchBooking = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        setBooking(res.data.data.booking);
      } catch (err) {
        toast.error('Could not load booking details');
        navigate('/bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId, navigate, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        bookingId,
        rating: parseInt(rating, 10),
        comment,
      });
      toast.success('Thank you! Your verified review has been published.');
      navigate('/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !booking) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500">Loading session details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link
        to="/bookings"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Bookings
      </Link>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Review Peer Session</h1>
        <p className="mt-1 text-sm text-slate-500">
          Share constructive feedback on your completed session for <strong>{booking.skillTitle}</strong>.
        </p>
      </div>

      <Card className="p-8 border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Star selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Overall Rating
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 hover:scale-110 transition-transform focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-3 text-sm font-bold text-slate-700">
                {rating === 5 ? '5 Stars - Exceptional' : `${rating} Stars`}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Review Comment (Optional, max 500 characters)
            </label>
            <textarea
              rows={4}
              maxLength={500}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What went well? Did the mentor explain concepts clearly?..."
              className="w-full p-3.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <div className="text-right text-xs text-slate-400 mt-1">
              {comment.length} / 500
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <Link to="/bookings">
              <Button variant="outline" size="md">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" size="md" isLoading={submitting}>
              Submit Verified Review
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
