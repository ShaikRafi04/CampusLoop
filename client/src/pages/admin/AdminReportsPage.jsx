import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Clock,
  FileText,
  Filter,
  Loader2,
  ShieldCheck,
  User,
  Calendar,
  MessageSquare,
} from 'lucide-react';

export const AdminReportsPage = () => {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Resolution modal
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('RESOLVED');
  const [resolutionText, setResolutionText] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/admin/reports?${params.toString()}`);
      setReports(res.data.data);
    } catch (err) {
      toast.error('Failed to load reports: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleOpenResolve = (report) => {
    setSelectedReport(report);
    setNewStatus(report.status === 'OPEN' ? 'RESOLVED' : report.status);
    setResolutionText(report.resolution || '');
    setAdminNote('');
    setResolveModalOpen(true);
  };

  const submitResolve = async () => {
    try {
      setActionLoading(true);
      await api.patch(`/admin/reports/${selectedReport._id}`, {
        status: newStatus,
        resolution: resolutionText.trim(),
        note: adminNote.trim(),
      });
      toast.success('Report updated successfully');
      setResolveModalOpen(false);
      fetchReports();
    } catch (err) {
      toast.error('Failed to resolve report: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="danger">Open</Badge>;
      case 'UNDER_REVIEW':
        return <Badge variant="warning">Under Review</Badge>;
      case 'RESOLVED':
        return <Badge variant="success">Resolved</Badge>;
      case 'DISMISSED':
        return <Badge variant="secondary">Dismissed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-2 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Admin Overview
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Disputes & Incident Reports</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Investigate session disputes, learner complaints, and campus policy violation flags.
          </p>
        </div>
      </div>

      {/* Filter controls */}
      <Card className="p-4 border-slate-200 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter By:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Incident Types</option>
            <option value="DISPUTE">Dispute (Session)</option>
            <option value="USER_REPORT">User Conduct</option>
            <option value="CONTENT_REPORT">Content / Skill</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          <Button variant="secondary" size="sm" onClick={() => fetchReports()}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Reports List */}
      {loading ? (
        <Card className="p-12 text-center text-slate-400 border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
          <p className="text-sm">Fetching moderation queue...</p>
        </Card>
      ) : reports.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 border-slate-200">
          <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-lg">Queue Clear</h3>
          <p className="text-sm text-slate-500 mt-1">No dispute or incident reports found matching filter criteria.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report._id} className="p-5 border-slate-200 hover:border-slate-300 transition">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(report.status)}
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                      {report.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      Filed on {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{report.reason}</h3>
                    {report.details && (
                      <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{report.details}</p>
                    )}
                  </div>

                  {/* Context chips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Reporter:</span>
                      <span className="font-semibold text-slate-700">
                        {report.reporterId?.name || 'Unknown'} ({report.reporterId?.email})
                      </span>
                    </div>

                    {report.reportedUserId && (
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                        <span>Reported User:</span>
                        <span className="font-semibold text-slate-700">
                          {report.reportedUserId?.name} ({report.reportedUserId?.email})
                        </span>
                      </div>
                    )}

                    {report.bookingId && (
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>Booking:</span>
                        <span className="font-semibold text-slate-700">
                          {report.bookingId?.skillTitle || 'Session'} — {report.bookingId?.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Resolution banner if resolved */}
                  {report.resolution && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 mt-2">
                      <span className="font-bold">Resolution:</span> {report.resolution}
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col items-center justify-end gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenResolve(report)}
                    className="w-full sm:w-auto"
                  >
                    Action Report
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Action / Resolve Modal */}
      <Modal
        isOpen={resolveModalOpen}
        onClose={() => setResolveModalOpen(false)}
        title="Moderate & Resolve Incident"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Report Status
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="OPEN">OPEN</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="DISMISSED">DISMISSED</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Official Resolution Summary
            </label>
            <textarea
              rows={3}
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              placeholder="e.g. Settle session credits in favor of learner due to mentor absence."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Admin Internal Note
            </label>
            <textarea
              rows={2}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Internal notes visible only to administrators..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setResolveModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={actionLoading}
              onClick={submitResolve}
            >
              {actionLoading ? 'Saving...' : 'Save & Update'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminReportsPage;
