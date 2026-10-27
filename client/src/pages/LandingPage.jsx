import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Coins,
  ShieldCheck,
  Users,
  Compass,
  Star,
  CheckCircle,
} from 'lucide-react';

export const LandingPage = () => {
  const { user } = useAuth();

  const categories = [
    { name: 'Programming', count: 'Python, React, Data Structures', icon: '💻' },
    { name: 'Mathematics', count: 'Calculus, Linear Algebra, Stats', icon: '📐' },
    { name: 'Design', count: 'UI/UX, Figma, Graphic Design', icon: '🎨' },
    { name: 'Career Skills', count: 'Resume Review, Mock Interviews', icon: '🚀' },
    { name: 'Languages', count: 'Spanish, German, Japanese', icon: '🌐' },
    { name: 'Data Science', count: 'Machine Learning, SQL, Pandas', icon: '📊' },
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28 gradient-hero border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Reciprocal Campus Learning Network
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight md:leading-none">
            Your Campus Is Full of People Who Can{' '}
            <span className="bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent">
              Teach You Something
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Exchange skills with college peers using virtual learning credits. Teach what you know, master what you need, and build a verified academic reputation.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition hover:scale-[1.02]"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition hover:scale-[1.02]"
                >
                  Join Your Campus (Get 50 Credits)
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/discover"
                  className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-base border border-slate-300 shadow-sm flex items-center justify-center gap-2 transition"
                >
                  <Compass className="w-4 h-4 text-slate-500" />
                  Explore Skill Offerings
                </Link>
              </>
            )}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> 50 Free Welcome Credits
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> No Real Money Exchanged
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" /> Verified Peer Reviews
            </span>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-2">Simple & Reciprocal</h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">How CampusLoop Works</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xl mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Discover & Book</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Find classmates teaching courses, tools, or exam topics you need. Reserve 30-minute to 2-hour slots with full calendar sync.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-black text-xl mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Learn 1-on-1</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Meet online or in-person with shared learning objectives and an external call link. Ask questions in private session chat.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-slate-50 border border-slate-200/80 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xl mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Settle Credits & Teach</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Confirm session completion to release learning credits to your peer. Earn credits back by offering skills you are good at!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-2">Explore Topics</h2>
              <p className="text-3xl font-extrabold text-slate-900 tracking-tight">Popular Learning Categories</p>
            </div>
            <Link
              to="/discover"
              className="mt-4 md:mt-0 text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Browse all categories <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <Link
                key={i}
                to={`/discover?category=${encodeURIComponent(cat.name)}`}
                className="group p-6 rounded-2xl bg-white border border-slate-200/90 hover:border-indigo-300 hover:shadow-lg transition-all duration-200"
              >
                <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">{cat.icon}</div>
                <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-1">{cat.count}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
