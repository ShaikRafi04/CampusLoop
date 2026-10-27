import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  Coins,
  Clock,
  Star,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Video,
  MapPin,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

export const SkillDetailPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [skill, setSkill] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [learningObjective, setLearningObjective] = useState('');
  const [message, setMessage] = useState('');

  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSkill = async () => {
      try {
        const res = await api.get(`/skills/${id}`);
        setSkill(res.data.data.skill);
      } catch (err) {
        toast.error('Skill offering not found');
        navigate('/discover');
      } finally {
        setLoading(false);
      }
    };

    fetchSkill();
  }, [id, navigate, toast]);

  useEffect(() => {
    if (skill) {
      const fetchSlots = async () => {
        setLoadingSlots(true);
        try {
          const now = new Date();
          const from = now.toISOString();
          const toDate = new Date();
          toDate.setDate(now.getDate() + 14); // Next 14 days
          const to = toDate.toISOString();

          const res = await api.get(`/skills/${id}/slots?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
          setSlots(res.data.data.slots || []);
        } catch (err) {
          console.error('Failed to load slots', err);
        } finally {
          setLoadingSlots(false);
        }
      };

      fetchSlots();
    }
  }, [skill, id]);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.info('Please log in to book this session');
      navigate('/login', { state: { from: { pathname: `/skills/${id}` } } });
      return;
    }

    if (!selectedSlot) {
      toast.error('Please choose a time slot for your session');
      return;
    }

    if (user.wallet?.available < skill.creditCost) {
      toast.error(`You have ${user.wallet?.available ?? 0} credits, but this session requires ${skill.creditCost} credits.`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/bookings', {
        skillId: skill._id,
        scheduledStart: selectedSlot,
        learningObjective,
        message,
      });

      toast.success('Session request submitted! The mentor will be notified.');
      navigate('/bookings');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit booking request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !skill) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500">Loading offering details...</p>
      </div>
    );
  }

  const isOwner = user && (user._id === skill.ownerId?._id || user._id === skill.ownerId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link
        to="/discover"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Discover
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Mentor Summary */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="text-xs font-bold text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                {skill.category}
              </span>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200 text-xs font-bold">
                <Coins className="w-3.5 h-3.5 text-amber-500" />
                {skill.creditCost} Learning Credits
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">{skill.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pb-6 border-b border-slate-100">
              <span className="bg-slate-100 px-2.5 py-1 rounded-lg">{skill.difficulty}</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {skill.durationMinutes} Minutes
              </span>
              <span className="flex items-center gap-1">
                {skill.format === 'ONLINE' ? <Video className="w-3.5 h-3.5 text-indigo-500" /> : <MapPin className="w-3.5 h-3.5 text-teal-500" />}
                {skill.format === 'ONLINE' ? 'Online Video Meeting' : 'In-Person on Campus'}
              </span>
              <span>• {skill.experienceYears} Years Experience</span>
            </div>

            <div className="py-6 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">What You Will Learn</h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{skill.description}</p>
            </div>

            {skill.tags && skill.tags.length > 0 && (
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2">
                {skill.tags.map((tag, idx) => (
                  <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {/* Mentor Profile Card */}
          <Card className="p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">About the Mentor</h3>
            <div className="flex items-start gap-4">
              {skill.ownerId?.profileImage ? (
                <img
                  src={skill.ownerId.profileImage}
                  alt={skill.ownerId.name}
                  className="w-14 h-14 rounded-2xl object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
                  {(skill.mentorName || 'M').charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-base">{skill.mentorName || skill.ownerId?.name}</h4>
                  {skill.ownerId?.ratingSummary?.count > 0 ? (
                    <div className="flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                      {skill.ownerId.ratingSummary.average.toFixed(1)}
                    </div>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">New</span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {skill.ownerId?.college} {skill.ownerId?.department ? `• ${skill.ownerId.department}` : ''}
                </p>
                {skill.ownerId?.bio && <p className="text-xs text-slate-600 pt-1">{skill.ownerId.bio}</p>}

                <div className="pt-2">
                  <Link
                    to={`/users/${skill.ownerId?._id || skill.ownerId}`}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                  >
                    View Mentor's Public Profile →
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Slot Picker & Request Form */}
        <div className="space-y-6">
          <Card className="p-6 border-indigo-200 shadow-md">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Book a Session</h2>
            <p className="text-xs text-slate-500 mb-6">
              Choose an available 30-minute boundary slot. Credits are reserved only when the mentor accepts.
            </p>

            {isOwner ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium">
                You are the creator of this skill offering. Students book this with you!
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit} className="space-y-5">
                {/* Available Slots */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                    <span>Select Available Slot (Next 14 Days)</span>
                    {loadingSlots && <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />}
                  </label>

                  {loadingSlots ? (
                    <div className="py-6 text-center text-xs text-slate-400">Loading mentor calendar...</div>
                  ) : slots.length === 0 ? (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                      No open slots available within the next 14 days. Check back later or view mentor profile.
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                      {slots.map((slotIso) => {
                        const dateObj = new Date(slotIso);
                        const isSelected = selectedSlot === slotIso;
                        return (
                          <button
                            key={slotIso}
                            type="button"
                            onClick={() => setSelectedSlot(slotIso)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition ${
                              isSelected
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                            }`}
                          >
                            <span>
                              {dateObj.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span>
                              {dateObj.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Learning Objective */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Your Learning Objective (Required)
                  </label>
                  <textarea
                    required
                    minLength={5}
                    maxLength={300}
                    rows={2}
                    value={learningObjective}
                    onChange={(e) => setLearningObjective(e.target.value)}
                    placeholder="e.g. Need help reviewing binary search trees for upcoming midterms..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Optional Message to Mentor
                  </label>
                  <input
                    type="text"
                    maxLength={500}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. I have my laptop and course notes ready."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
                  />
                </div>

                {/* Credit Cost Summary */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Session Cost:</span>
                    <span className="font-bold text-slate-900">{skill.creditCost} credits</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Your Available Credits:</span>
                    <span className={`font-bold ${user?.wallet?.available < skill.creditCost ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {user?.wallet?.available ?? 0} credits
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={submitting}
                  disabled={slots.length === 0 || !selectedSlot}
                  className="w-full text-sm font-bold py-3"
                >
                  Request Session
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
