import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import {
  User,
  School,
  BookOpen,
  Star,
  Award,
  Coins,
  Clock,
  ArrowRight,
  Loader2,
  CalendarCheck,
} from 'lucide-react';

export const PublicProfilePage = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${id}`);
        setProfile(res.data.data.profile);
      } catch (err) {
        setError(err.response?.data?.message || 'Student profile not found');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        <p className="text-sm text-slate-500">Loading student profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-3xl bg-white border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Profile Not Available</h2>
          <p className="text-sm text-slate-500 mb-6">{error || 'Unable to display this profile.'}</p>
          <Link to="/discover" className="text-indigo-600 font-bold text-sm">
            ← Back to Discover
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Profile Card */}
      <Card className="p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {profile.profileImage ? (
            <img
              src={profile.profileImage}
              alt={profile.name}
              className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-100 shadow-md shrink-0"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-indigo-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-md shadow-indigo-100 shrink-0">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{profile.name}</h1>
              {profile.ratingSummary?.count > 0 ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                  {profile.ratingSummary.average.toFixed(1)} ({profile.ratingSummary.count} reviews)
                </div>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  New Peer Mentor
                </span>
              )}
            </div>

            <p className="text-sm text-slate-600 font-medium">
              {profile.college} {profile.department ? `• ${profile.department}` : ''}{' '}
              {profile.academicYear ? `• Year ${profile.academicYear}` : ''}
            </p>

            {profile.bio && (
              <p className="text-sm text-slate-600 pt-2 leading-relaxed max-w-2xl">{profile.bio}</p>
            )}

            {/* Peer Trust Counters */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs text-slate-500 border-t border-slate-100 mt-4">
              <div className="flex items-center gap-1.5 font-medium">
                <CalendarCheck className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-900">{profile.completedSessionsAsMentor ?? 0}</span> sessions taught
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-slate-900">{profile.completedSessionsAsLearner ?? 0}</span> sessions learned
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Skills Wanted & Interests */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
            Looking to Learn
          </h3>
          {profile.skillsWanted && profile.skillsWanted.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.skillsWanted.map((s, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No specific skills listed yet.</p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
            Interests & Fields
          </h3>
          {profile.interests && profile.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((s, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-teal-50 border border-teal-100 text-teal-700 text-xs font-semibold rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No interests listed yet.</p>
          )}
        </Card>
      </div>

      {/* Offerings by this student */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900">Skill Offerings by {profile.name}</h2>

        {profile.offerings && profile.offerings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile.offerings.map((skill) => (
              <Card key={skill._id} className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                      {skill.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      <Coins className="w-3.5 h-3.5" />
                      {skill.creditCost} Credits
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2">{skill.title}</h3>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <span>{skill.difficulty}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {skill.durationMinutes} min
                    </span>
                    <span>•</span>
                    <span>{skill.format}</span>
                  </div>

                  {skill.tags && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {skill.tags.map((t, i) => (
                        <span key={i} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/skills/${skill._id}`}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    View Details & Slots <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-slate-400">
            <p className="text-sm">This student has not published any active skill offerings yet.</p>
          </Card>
        )}
      </div>
    </div>
  );
};
