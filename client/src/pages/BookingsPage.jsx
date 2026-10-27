import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  Calendar,
  Clock,
  Video,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Coins,
  ExternalLink,
  Loader2,
  User,
  ArrowRight,
} from 'lucide-react';

export const BookingsPage = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'pending', 'needs_action', 'completed', 'all'
  const [role, setRole] = useState('learner'); // 'learner' or 'mentor'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // Cancellation modal state
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/bookings/me?role=${role}&limit=50`);
      setBookings(res.data.data || []);
    } catch (err) {
      console.error('Failed to load bookings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user, role]);

  const handleAccept = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/accept`);
      toast.success('Booking accepted! Learner credits have been reserved.');
      await refreshUser();
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId) => {
    if (!window.confirm('Are you sure you want to decline this request?')) return;
    setActionLoading(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/reject`);
      toast.info('Booking request declined.');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestComplete = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/complete`);
      toast.success('Session completion requested. Waiting for learner confirmation.');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request completion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmComplete = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      await api.patch(`/bookings/${bookingId}/confirm`);
      toast.success('Session marked completed! Credits have been settled to the mentor.');
      await refreshUser();
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to confirm completion');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancelModalBooking) return;

    setActionLoading(cancelModalBooking._id);
    try {
      await api.patch(`/bookings/${cancelModalBooking._id}/cancel`, {
        reason: cancelReason,
      });
      toast.info('Booking cancelled per policy.');
      await refreshUser();
      setCancelModalBooking(null);
      setCancelReason('');
      fetchBookings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter bookings based on activeTab
  const filteredBookings = bookings.filter((b) => {
    const now = new Date();
    const start = new Date(b.scheduledStart);

    if (activeTab === 'upcoming') {
      return b.status === 'ACCEPTED' && !b.completionRequestedAt;
    }
    if (activeTab === 'pending') {
      return b.status === 'PENDING';
    }
    if (activeTab === 'needs_action') {
      return b.status === 'ACCEPTED' && b.completionRequestedAt;
    }
    if (activeTab === 'completed') {
      return b.status === 'COMPLETED';
    }
    return true; // 'all'
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header & Role Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Booking Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your scheduled learning sessions, mentor acceptances, and completions.
          </p>
        </div>

        {/* Learner vs Mentor Toggle */}
        <div className="inline-flex p-1 bg-slate-200/80 rounded-2xl">
          <button
            onClick={() => setRole('learner')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              role === 'learner'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            As Learner
          </button>
          <button
            onClick={() => setRole('mentor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              role === 'mentor'
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            As Mentor (Teaching)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'pending', label: 'Awaiting Response' },
          { id: 'needs_action', label: 'Needs Action' },
          { id: 'completed', label: 'Completed' },
          { id: 'all', label: 'All History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Booking List */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Loading bookings...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <Card className="p-12 text-center max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Bookings Found</h3>
          <p className="text-sm text-slate-500 mb-6">
            {role === 'learner'
              ? 'You have no sessions in this view. Explore available offerings to request a 1-on-1 session!'
              : 'You have no mentoring sessions in this view. Keep your availability updated so peers can book!'}
          </p>
          {role === 'learner' ? (
            <Link to="/discover">
              <Button variant="primary" size="md">
                Find Skills to Learn
              </Button>
            </Link>
          ) : (
            <Link to="/settings/availability">
              <Button variant="primary" size="md">
                Set Teaching Availability
              </Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => {
            const startDate = new Date(b.scheduledStart);
            const endDate = new Date(b.scheduledEnd);
            const counterpart = role === 'learner' ? b.mentorId : b.learnerId;
            const isCompleted = b.status === 'COMPLETED';
            const isPending = b.status === 'PENDING';
            const isAccepted = b.status === 'ACCEPTED';
            const isDisputed = b.status === 'DISPUTED';
            const now = new Date();

            return (
              <Card key={b._id} className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left info */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Badge status={b.status} />
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                        {b.creditCost} Credits
                      </span>
                      {b.completionRequestedAt && b.status === 'ACCEPTED' && (
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                          Awaiting Learner Confirmation
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900">{b.skillTitle}</h3>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600">
                      <span className="flex items-center gap-1.5 text-slate-900 font-semibold">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        {startDate.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} ({b.durationMinutes}m)
                      </span>
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-teal-600" />
                        {role === 'learner' ? 'Mentor:' : 'Learner:'}{' '}
                        <strong className="text-slate-900">{counterpart?.name || 'Classmate'}</strong>
                      </span>
                    </div>

                    {b.learningObjective && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <span className="font-bold text-slate-700">Objective:</span> {b.learningObjective}
                      </p>
                    )}

                    {/* Show meeting link if accepted */}
                    {isAccepted && b.skillId?.meetingLink && (
                      <div className="pt-1 flex items-center gap-2">
                        <a
                          href={b.skillId.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition"
                        >
                          <Video className="w-3.5 h-3.5" /> Join Session Call <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Right actions */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
                    {/* Mentor Pending Actions */}
                    {role === 'mentor' && isPending && (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={actionLoading === b._id}
                          onClick={() => handleAccept(b._id)}
                        >
                          <CheckCircle className="w-4 h-4" /> Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={actionLoading === b._id}
                          onClick={() => handleReject(b._id)}
                        >
                          <XCircle className="w-4 h-4" /> Decline
                        </Button>
                      </>
                    )}

                    {/* Mentor Complete Action */}
                    {role === 'mentor' && isAccepted && !b.completionRequestedAt && (
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={actionLoading === b._id}
                        disabled={now < endDate}
                        onClick={() => handleRequestComplete(b._id)}
                        title={now < endDate ? 'Can only complete after session end time' : ''}
                      >
                        <CheckCircle className="w-4 h-4" /> Mark Complete
                      </Button>
                    )}

                    {/* Learner Confirm Completion Action */}
                    {role === 'learner' && isAccepted && b.completionRequestedAt && (
                      <Button
                        variant="primary"
                        size="sm"
                        isLoading={actionLoading === b._id}
                        onClick={() => handleConfirmComplete(b._id)}
                      >
                        <CheckCircle className="w-4 h-4" /> Confirm & Settle Credits
                      </Button>
                    )}

                    {/* Cancel Action */}
                    {(isPending || isAccepted) && now < startDate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-500 hover:text-rose-600"
                        onClick={() => setCancelModalBooking(b)}
                      >
                        Cancel Session
                      </Button>
                    )}

                    {/* Completed Review action */}
                    {isCompleted && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                        Session Settled
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancellation Policy Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Cancel Booking</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Per platform cancellation policy, cancellations ≥ 24 hours prior to session release all reserved credits to your available balance. Late cancellations under 24 hours forfeit the credit cost to compensate the mentor.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Reason for Cancellation
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Schedule conflict with exams..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCancelModalBooking(null);
                    setCancelReason('');
                  }}
                >
                  Keep Booking
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  isLoading={actionLoading === cancelModalBooking._id}
                >
                  Confirm Cancellation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
