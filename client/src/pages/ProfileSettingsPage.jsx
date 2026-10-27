import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { User, School, BookOpen, Clock, Tag, Sparkles, Image, Check } from 'lucide-react';

export const ProfileSettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    college: '',
    department: '',
    academicYear: 1,
    timezone: 'Asia/Kolkata',
    profileImage: '',
    skillsWantedInput: '',
    interestsInput: '',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        bio: user.bio || '',
        college: user.college || '',
        department: user.department || '',
        academicYear: user.academicYear || 1,
        timezone: user.timezone || 'Asia/Kolkata',
        profileImage: user.profileImage || '',
        skillsWantedInput: (user.skillsWanted || []).join(', '),
        interestsInput: (user.interests || []).join(', '),
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'academicYear' ? parseInt(value, 10) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const skillsWanted = formData.skillsWantedInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 15);

    const interests = formData.interestsInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
      .slice(0, 15);

    const payload = {
      name: formData.name,
      bio: formData.bio,
      college: formData.college,
      department: formData.department,
      academicYear: formData.academicYear,
      timezone: formData.timezone,
      profileImage: formData.profileImage,
      skillsWanted,
      interests,
    };

    try {
      await api.patch('/users/me', payload);
      await refreshUser();
      toast.success('Profile updated successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Profile & Preferences</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your campus student identity, academic details, and skills you want to learn.
        </p>
      </div>

      <Card className="p-8 shadow-sm border-slate-200">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Profile Image URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Image className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  name="profileImage"
                  placeholder="https://..."
                  value={formData.profileImage}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Bio / About Me (max 500 characters)
            </label>
            <textarea
              name="bio"
              rows={3}
              maxLength={500}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell fellow students what you're passionate about, courses you're taking, or projects you're building..."
              className="w-full p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            />
            <div className="text-right text-xs text-slate-400 mt-1">
              {formData.bio.length} / 500
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                College / University
              </label>
              <input
                type="text"
                name="college"
                value={formData.college}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Academic Year
              </label>
              <select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
              >
                <option value={1}>1st Year (Freshman)</option>
                <option value={2}>2nd Year (Sophomore)</option>
                <option value={3}>3rd Year (Junior)</option>
                <option value={4}>4th Year (Senior)</option>
                <option value={5}>Masters Year 1</option>
                <option value={6}>Masters Year 2</option>
                <option value={7}>PhD / Post-Grad</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Skills Wanted (Comma-separated, up to 15)
            </label>
            <input
              type="text"
              name="skillsWantedInput"
              value={formData.skillsWantedInput}
              onChange={handleChange}
              placeholder="e.g. Machine Learning, React, Organic Chemistry, French"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Used by the recommendation engine to match you with matching campus mentors.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Interests & Hobbies (Comma-separated, up to 15)
            </label>
            <input
              type="text"
              name="interestsInput"
              value={formData.interestsInput}
              onChange={handleChange}
              placeholder="e.g. Robotics, Hackathons, Guitar, Chess"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Timezone
            </label>
            <input
              type="text"
              name="timezone"
              value={formData.timezone}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary" size="lg" isLoading={loading}>
              <Check className="w-4 h-4 mr-1.5" />
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
