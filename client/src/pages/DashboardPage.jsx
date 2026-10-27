import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  Coins,
  BookOpen,
  Compass,
  Calendar,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [profileCompletion, setProfileCompletion] = useState(null);
  const [myOfferings, setMyOfferings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [compRes, skillsRes] = await Promise.all([
          api.get('/users/me/profile-completion'),
          api.get(`/skills?ownerId=${user._id}&limit=4`),
        ]);
        setProfileCompletion(compRes.data.data);
        setMyOfferings(skillsRes.data.data || []);
      } catch (err) {
        console.error('Error loading dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-bold uppercase tracking-wider mb-4">
            <Award className="w-3.5 h-3.5" />
            Student Workspace
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="mt-2 text-indigo-200 text-sm sm:text-base">
            {user?.college ? `${user.college} • ${user.department || 'Student'}` : 'Start learning and teaching today.'}
          </p>
        </div>
      </div>

      {/* Grid: Credit Wallet + Profile Completion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Balance Card */}
        <Card className="md:col-span-1 bg-gradient-to-br from-amber-50/80 via-white to-orange-50/50 border-amber-200/70 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Learning Wallet</span>
              <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
                <Coins className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-2">
              <div className="text-4xl font-extrabold text-amber-950">
                {user?.wallet?.available ?? 0}
              </div>
              <div className="text-xs font-medium text-amber-800/80 mt-1">Available Credits</div>
            </div>

            {user?.wallet?.reserved > 0 && (
              <div className="mt-4 pt-3 border-t border-amber-200/50 flex items-center justify-between text-xs text-amber-900">
                <span>Reserved in Active Bookings:</span>
                <span className="font-bold">{user.wallet.reserved} credits</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-amber-200/60">
            <Link
              to="/wallet"
              className="text-xs font-bold text-amber-900 hover:text-amber-950 flex items-center justify-between group"
            >
              <span>View Transaction Ledger</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </Card>

        {/* Profile Completion Widget (FR-06) */}
        <Card className="md:col-span-2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Profile Readiness</h3>
                <p className="text-xs text-slate-500">Complete your profile to increase discovery by campus peers</p>
              </div>
              <div className="text-2xl font-black text-indigo-600">
                {profileCompletion?.score ?? 0}%
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${profileCompletion?.score ?? 0}%` }}
              ></div>
            </div>

            {/* Checklist Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                {profileCompletion?.checklist?.bio ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className={profileCompletion?.checklist?.bio ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                  Add Bio
                </span>
              </div>

              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                {profileCompletion?.checklist?.skillsWanted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className={profileCompletion?.checklist?.skillsWanted ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                  Skills Wanted
                </span>
              </div>

              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                {profileCompletion?.checklist?.activeOffering ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className={profileCompletion?.checklist?.activeOffering ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                  Offer a Skill
                </span>
              </div>

              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                {profileCompletion?.checklist?.profileImage ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className={profileCompletion?.checklist?.profileImage ? 'text-slate-700 font-medium' : 'text-slate-400'}>
                  Profile Image
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
            <Link
              to="/settings/profile"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Update Profile Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Quick Action Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Link
          to="/discover"
          className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Compass className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 group-hover:text-indigo-600 transition">
            Explore Peer Skills
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Browse through courses and study sessions offered by campus students.
          </p>
        </Link>

        <Link
          to="/my-skills/new"
          className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-teal-400 hover:shadow-lg transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 group-hover:text-teal-600 transition">
            Publish a New Offering
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Share your expertise, set your credit cost (5-50), and earn credits.
          </p>
        </Link>

        <Link
          to="/bookings"
          className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all duration-200"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 group-hover:text-amber-600 transition">
            Manage Bookings
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Review incoming requests, accept sessions, and confirm completions.
          </p>
        </Link>
      </div>
    </div>
  );
};
