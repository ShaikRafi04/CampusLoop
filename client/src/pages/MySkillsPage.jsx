import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { PlusCircle, Edit3, Trash2, Clock, Coins, BookOpen, Loader2 } from 'lucide-react';

export const MySkillsPage = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMySkills = async () => {
    try {
      // Query offerings created by this user
      const res = await api.get(`/skills?ownerId=${user._id}&limit=50`);
      setSkills(res.data.data.filter((s) => s.ownerId?._id === user._id || s.ownerId === user._id));
    } catch (err) {
      console.error('Error fetching offerings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchMySkills();
  }, [user]);

  const handleDeactivate = async (skillId) => {
    if (!window.confirm('Are you sure you want to deactivate this offering? New bookings will be prevented.')) {
      return;
    }
    try {
      await api.delete(`/skills/${skillId}`);
      toast.success('Offering deactivated successfully.');
      fetchMySkills();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to deactivate offering');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Teaching Offerings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Publish courses and topics you can mentor peers on to earn learning credits.
          </p>
        </div>

        <Link to="/my-skills/new">
          <Button variant="primary" size="md">
            <PlusCircle className="w-4 h-4" />
            Offer New Skill
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Loading your offerings...</p>
        </div>
      ) : skills.length === 0 ? (
        <Card className="p-12 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Skill Offerings Yet</h3>
          <p className="text-sm text-slate-500 mb-6">
            Share what you're good at! Other students can book sessions with you and you'll earn virtual credits for each completed session.
          </p>
          <Link to="/my-skills/new">
            <Button variant="primary" size="lg">
              Create Your First Offering
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill) => (
            <Card key={skill._id} className="flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                    {skill.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    <Coins className="w-3.5 h-3.5" />
                    {skill.creditCost} Credits
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1.5">{skill.title}</h3>
                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                  {skill.description}
                </p>

                <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                  <span className="font-semibold">{skill.difficulty}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {skill.durationMinutes} min
                  </span>
                  <span>•</span>
                  <span>{skill.format}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={`/my-skills/${skill._id}/edit`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </Link>

                <button
                  onClick={() => handleDeactivate(skill._id)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-500 hover:text-rose-700"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Deactivate
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
