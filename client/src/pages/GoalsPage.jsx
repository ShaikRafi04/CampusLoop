import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Target, Plus, CheckCircle2, Clock, X, Loader2 } from 'lucide-react';

export const GoalsPage = () => {
  const toast = useToast();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillName, setSkillName] = useState('');
  const [targetSessions, setTargetSessions] = useState(5);
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = async () => {
    try {
      const res = await api.get('/goals');
      setGoals(res.data.data.goals || []);
    } catch (err) {
      console.error('Failed to load goals', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/goals', {
        title,
        description,
        skillName,
        targetSessions: parseInt(targetSessions, 10),
        ...(deadline ? { deadline: new Date(deadline).toISOString() } : {}),
      });
      toast.success('Learning goal created!');
      setShowModal(false);
      setTitle('');
      setDescription('');
      setSkillName('');
      setTargetSessions(5);
      setDeadline('');
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelGoal = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      toast.info('Goal cancelled.');
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel goal');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Learning Goals</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your semester study targets. Completed sessions automatically advance your progress.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Set New Goal
        </Button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Loading your learning goals...</p>
        </div>
      ) : goals.length === 0 ? (
        <Card className="p-12 text-center max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Target className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Goals Set Yet</h3>
          <p className="text-sm text-slate-500 mb-6">
            Set a target number of sessions you want to complete for a skill this semester (e.g., 5 sessions of Data Structures).
          </p>
          <Button variant="primary" size="lg" onClick={() => setShowModal(true)}>
            Create Your First Goal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((g) => {
            const pct = Math.min(Math.round((g.completedSessions / g.targetSessions) * 100), 100);
            const isCompleted = g.status === 'COMPLETED';
            const isCancelled = g.status === 'CANCELLED';

            return (
              <Card key={g._id} className="p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                      {g.skillName}
                    </span>
                    <Badge status={g.status} />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1">{g.title}</h3>
                  {g.description && <p className="text-xs text-slate-600 mb-4">{g.description}</p>}

                  {/* Progress bar */}
                  <div className="space-y-1.5 my-4">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Progress</span>
                      <span>
                        {g.completedSessions} / {g.targetSessions} Sessions ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>

                  {g.deadline && (
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Target deadline: {new Date(g.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {!isCompleted && !isCancelled && (
                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleCancelGoal(g._id)}
                      className="text-xs font-semibold text-slate-400 hover:text-rose-600"
                    >
                      Cancel Goal
                    </button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Set a New Learning Goal</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master React Frontend Development"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Skill / Subject Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. React"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Target Sessions
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={targetSessions}
                    onChange={(e) => setTargetSessions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Deadline (Optional)
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional notes or roadmap for this goal..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
                  Save Goal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
