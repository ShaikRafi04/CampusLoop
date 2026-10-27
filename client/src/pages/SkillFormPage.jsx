import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Sparkles, Coins, Clock, Link as LinkIcon, BookOpen, ArrowLeft } from 'lucide-react';

const CATEGORIES = [
  'Programming',
  'Design',
  'Mathematics',
  'Languages',
  'Music',
  'Writing',
  'Data Science',
  'Career Skills',
  'Other',
];

export const SkillFormPage = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Programming',
    difficulty: 'BEGINNER',
    experienceYears: 1,
    durationMinutes: 60,
    creditCost: 15,
    format: 'ONLINE',
    tagsInput: '',
    meetingLink: '',
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditing);

  useEffect(() => {
    if (isEditing) {
      const fetchSkill = async () => {
        try {
          const res = await api.get(`/skills/${id}`);
          const skill = res.data.data.skill;
          setFormData({
            title: skill.title || '',
            description: skill.description || '',
            category: skill.category || 'Programming',
            difficulty: skill.difficulty || 'BEGINNER',
            experienceYears: skill.experienceYears ?? 1,
            durationMinutes: skill.durationMinutes ?? 60,
            creditCost: skill.creditCost ?? 15,
            format: skill.format || 'ONLINE',
            tagsInput: (skill.tags || []).join(', '),
            meetingLink: skill.meetingLink || '',
          });
        } catch (err) {
          toast.error('Failed to load offering details');
          navigate('/my-skills');
        } finally {
          setFetching(false);
        }
      };
      fetchSkill();
    }
  }, [id, isEditing, navigate, toast]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === 'experienceYears' || name === 'durationMinutes' || name === 'creditCost'
          ? parseInt(value, 10)
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.creditCost % 5 !== 0) {
      toast.error('Credit cost must be a multiple of 5 (e.g. 5, 10, 15, 20...)');
      return;
    }

    setLoading(true);

    const tags = formData.tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)
      .slice(0, 8);

    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      difficulty: formData.difficulty,
      experienceYears: formData.experienceYears,
      durationMinutes: formData.durationMinutes,
      creditCost: formData.creditCost,
      format: formData.format,
      tags,
      meetingLink: formData.meetingLink,
    };

    try {
      if (isEditing) {
        await api.patch(`/skills/${id}`, payload);
        toast.success('Skill offering updated successfully!');
      } else {
        await api.post('/skills', payload);
        toast.success('Skill offering published successfully!');
      }
      navigate('/my-skills');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save offering');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-center py-20 text-slate-500">Loading offering details...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <Link
        to="/my-skills"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-indigo-600 transition"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to My Offerings
      </Link>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {isEditing ? 'Edit Skill Offering' : 'Publish a New Skill Offering'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Set up the details, session duration, and virtual credit pricing for your peer learning session.
        </p>
      </div>

      <Card className="p-8 border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Offering Title (3-80 characters)
            </label>
            <input
              type="text"
              name="title"
              required
              minLength={3}
              maxLength={80}
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Master Python Data Structures & Algorithms"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Session Description (what you will teach)
            </label>
            <textarea
              name="description"
              required
              rows={4}
              maxLength={1000}
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a breakdown of what the student will learn, prerequisites, and how you conduct the session..."
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            />
            <div className="text-right text-xs text-slate-400 mt-1">
              {formData.description.length} / 1000
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Difficulty Level
              </label>
              <select
                name="difficulty"
                value={formData.difficulty}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value="BEGINNER">Beginner (Foundations)</option>
                <option value="INTERMEDIATE">Intermediate (Core Concepts)</option>
                <option value="ADVANCED">Advanced (In-depth Mastery)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Session Duration
              </label>
              <select
                name="durationMinutes"
                value={formData.durationMinutes}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value={30}>30 Minutes</option>
                <option value={60}>60 Minutes (1 Hour)</option>
                <option value={90}>90 Minutes (1.5 Hours)</option>
                <option value={120}>120 Minutes (2 Hours)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Credit Cost (5 to 50)
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="creditCost"
                  min={5}
                  max={50}
                  step={5}
                  required
                  value={formData.creditCost}
                  onChange={handleChange}
                  className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-amber-700">pts</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Multiples of 5 only</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Session Format
              </label>
              <select
                name="format"
                value={formData.format}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value="ONLINE">Online (Virtual Call)</option>
                <option value="IN_PERSON">In-Person (On Campus)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Years of Experience (0-50)
              </label>
              <input
                type="number"
                name="experienceYears"
                min={0}
                max={50}
                value={formData.experienceYears}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Tags (Up to 8, comma-separated)
              </label>
              <input
                type="text"
                name="tagsInput"
                placeholder="e.g. python, arrays, leetcode"
                value={formData.tagsInput}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Meeting Link (Optional URL, shown only to accepted participants)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="meetingLink"
                placeholder="https://meet.google.com/... or zoom.us/..."
                value={formData.meetingLink}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Kept private by the server; only visible to participants once a booking is ACCEPTED.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Link to="/my-skills">
              <Button variant="outline" size="md">
                Cancel
              </Button>
            </Link>
            <Button type="submit" variant="primary" size="md" isLoading={loading}>
              {isEditing ? 'Save Changes' : 'Publish Offering'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
