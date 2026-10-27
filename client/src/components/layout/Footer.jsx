import React from 'react';
import { Sparkles, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">CampusLoop</span>
            </div>
            <p className="text-sm text-slate-500 max-w-sm">
              The premier peer-to-peer campus learning exchange. Share your knowledge, master new skills, and unlock academic excellence through reciprocal virtual credits.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Platform</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/discover" className="hover:text-indigo-600">Discover Skills</Link></li>
              <li><Link to="/my-skills/new" className="hover:text-indigo-600">Become a Mentor</Link></li>
              <li><Link to="/wallet" className="hover:text-indigo-600">Virtual Credits</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Community</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><span className="text-slate-400">Student Guidelines</span></li>
              <li><span className="text-slate-400">Campus Integrity</span></li>
              <li><span className="text-slate-400">Dispute Resolution</span></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} CampusLoop. Academic end-term project.</p>
          <div className="flex items-center gap-1 text-slate-500">
            Built for college students with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          </div>
        </div>
      </div>
    </footer>
  );
};
