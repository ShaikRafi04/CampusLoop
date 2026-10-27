import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import {
  Users,
  BookOpen,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Coins,
  ArrowRight,
  TrendingUp,
  Activity,
  Loader2,
} from 'lucide-react';

export const AdminOverviewPage = () => {
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const [ovRes, anRes] = await Promise.all([
          api.get('/admin/overview'),
          api.get('/admin/analytics'),
        ]);
        setOverview(ovRes.data.data);
        setAnalytics(anRes.data.data);
      } catch (err) {
        console.error('Failed to load admin overview', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
        <p className="text-sm text-slate-500">Loading admin operations center...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600" /> Platform Administration
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">System Overview</h1>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/users">
            <Button variant="outline" size="sm">
              <Users className="w-4 h-4" /> Manage Students
            </Button>
          </Link>
          <Link to="/admin/reports">
            <Button variant="outline" size="sm">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Moderation & Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Registered</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{overview?.totalUsers ?? 0}</div>
          <p className="text-xs text-slate-500 mt-1">{overview?.activeUsers ?? 0} active in last 30 days</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Offerings</span>
            <BookOpen className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{overview?.activeOfferings ?? 0}</div>
          <p className="text-xs text-slate-500 mt-1">Available for student discovery</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Completed Sessions</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-slate-900">{overview?.completedSessions ?? 0}</div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            {analytics?.completionRate ?? 100}% completion rate
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Open Moderation</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{overview?.openReports ?? 0}</div>
          <p className="text-xs text-slate-500 mt-1">Reports & disputes in queue</p>
        </Card>
      </div>

      {/* Bookings Status Breakdown & Top Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-bold text-slate-900 text-base mb-4">Bookings by Status</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(overview?.bookingCounts || {}).map(([st, cnt]) => (
              <div key={st} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <Badge status={st} />
                <div className="text-xl font-bold text-slate-900 mt-2">{cnt}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-bold text-slate-900 text-base mb-4">Top Learning Categories</h3>
          <div className="space-y-3">
            {(analytics?.topCategories || []).map((cat, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-medium text-slate-700">
                <span>{cat.category}</span>
                <span className="font-bold text-slate-900">{cat.count} offerings</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Audit Trail */}
      <Card className="p-6 shadow-sm border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-base">Recent Administrative Audit Logs</h3>
          <span className="text-xs text-slate-400 font-mono">Append-only compliance log</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {(overview?.recentAuditLogs || []).map((log) => {
            const date = new Date(log.createdAt);
            return (
              <div key={log._id} className="py-3 flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800">
                    {log.action} • <span className="font-normal text-slate-500">{log.targetType} #{log.targetId}</span>
                  </div>
                  <div className="text-slate-500">
                    By {log.actorId?.name || 'Admin'} ({log.actorId?.email || 'System'})
                  </div>
                </div>
                <div className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
                  {date.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};
