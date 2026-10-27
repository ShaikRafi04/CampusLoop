import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Search,
  ShieldAlert,
  ShieldCheck,
  Coins,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Eye,
} from 'lucide-react';

export const AdminUsersPage = () => {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals state
  const [selectedUser, setSelectedUser] = useState(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [reactivateModalOpen, setReactivateModalOpen] = useState(false);
  const [reactivateReason, setReactivateReason] = useState('');

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState(10);
  const [adjustReason, setAdjustReason] = useState('');

  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 15);
      if (search.trim()) params.append('q', search.trim());
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter !== '') params.append('isSuspended', statusFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.data.users);
      setMeta(res.data.data.meta);
    } catch (err) {
      toast.error('Failed to load users: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, toast]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleOpenSuspend = (user) => {
    setSelectedUser(user);
    setSuspendReason('');
    setSuspendModalOpen(true);
  };

  const submitSuspend = async () => {
    if (!suspendReason.trim()) {
      toast.error('A suspension reason is mandatory');
      return;
    }
    try {
      setActionLoading(true);
      await api.patch(`/admin/users/${selectedUser._id}/suspend`, { reason: suspendReason.trim() });
      toast.success(`User ${selectedUser.name} suspended`);
      setSuspendModalOpen(false);
      fetchUsers(meta.page);
    } catch (err) {
      toast.error('Failed to suspend user: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReactivate = (user) => {
    setSelectedUser(user);
    setReactivateReason('');
    setReactivateModalOpen(true);
  };

  const submitReactivate = async () => {
    try {
      setActionLoading(true);
      await api.patch(`/admin/users/${selectedUser._id}/reactivate`, { reason: reactivateReason.trim() });
      toast.success(`User ${selectedUser.name} reactivated`);
      setReactivateModalOpen(false);
      fetchUsers(meta.page);
    } catch (err) {
      toast.error('Failed to reactivate: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenAdjust = (user) => {
    setSelectedUser(user);
    setAdjustAmount(10);
    setAdjustReason('');
    setAdjustModalOpen(true);
  };

  const submitAdjust = async () => {
    const amountNum = parseInt(adjustAmount, 10);
    if (isNaN(amountNum) || amountNum === 0) {
      toast.error('Enter a valid non-zero credit amount');
      return;
    }
    if (!adjustReason.trim()) {
      toast.error('Adjustment explanation is required');
      return;
    }
    try {
      setActionLoading(true);
      await api.post(`/admin/users/${selectedUser._id}/credit-adjustments`, {
        amount: amountNum,
        reason: adjustReason.trim(),
      });
      toast.success(`Credits adjusted by ${amountNum > 0 ? '+' : ''}${amountNum} for ${selectedUser.name}`);
      setAdjustModalOpen(false);
      fetchUsers(meta.page);
    } catch (err) {
      toast.error('Adjustment failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDetails = async (user) => {
    setSelectedUser(user);
    setDetailsModalOpen(true);
    setUserDetails(null);
    try {
      const res = await api.get(`/admin/users/${user._id}`);
      setUserDetails(res.data.data);
    } catch (err) {
      toast.error('Could not fetch user details: ' + (err.response?.data?.message || err.message));
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Management & Moderation</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Audit user accounts, manage disciplinary suspensions, and perform manual credit adjustments.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 border-slate-200">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, or campus..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Roles</option>
              <option value="STUDENT">Student</option>
              <option value="ADMIN">Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="false">Active Only</option>
              <option value="true">Suspended Only</option>
            </select>

            <Button type="submit" variant="primary" size="sm">
              Filter
            </Button>
          </div>
        </form>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
              <tr>
                <th className="px-6 py-3.5">User</th>
                <th className="px-6 py-3.5">College</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Wallet</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    Loading user records...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{u.name}</div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-600">
                      {u.college || '—'}
                    </td>
                    <td className="px-6 py-4">
                      {u.role === 'ADMIN' ? (
                        <Badge variant="danger" className="text-xs">Admin</Badge>
                      ) : (
                        <Badge variant="indigo" className="text-xs">Student</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Coins className="w-3.5 h-3.5 text-teal-600" />
                        {u.wallet?.available ?? 0}
                      </div>
                      {u.wallet?.reserved > 0 && (
                        <div className="text-[11px] text-slate-400">
                          ({u.wallet.reserved} in escrow)
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {u.isSuspended ? (
                        <div className="flex items-center gap-1.5 text-rose-600 font-semibold text-xs">
                          <ShieldAlert className="w-4 h-4" />
                          Suspended
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold text-xs">
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenDetails(u)}
                          title="View profile & metrics"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handleOpenAdjust(u)}
                          title="Adjust balance"
                        >
                          <Coins className="w-3.5 h-3.5 mr-1 text-teal-600" />
                          Adjust
                        </Button>
                        {u.isSuspended ? (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleOpenReactivate(u)}
                            className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                          >
                            Reactivate
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => handleOpenSuspend(u)}
                            className="text-rose-700 border-rose-200 hover:bg-rose-50"
                          >
                            Suspend
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-800">{users.length}</span> of{' '}
            <span className="font-bold text-slate-800">{meta.total}</span> users
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={meta.page <= 1 || loading}
              onClick={() => fetchUsers(meta.page - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Prev
            </Button>
            <span className="text-xs font-semibold px-2 text-slate-600">
              Page {meta.page} of {meta.totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              disabled={meta.page >= meta.totalPages || loading}
              onClick={() => fetchUsers(meta.page + 1)}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Suspend Modal */}
      <Modal
        isOpen={suspendModalOpen}
        onClose={() => setSuspendModalOpen(false)}
        title={`Suspend Account: ${selectedUser?.name}`}
      >
        <div className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800">
              <span className="font-bold">Warning:</span> Suspending this account will block login, mark active offerings as unavailable, and flag future accepted bookings.
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Reason for Suspension (Mandatory)
            </label>
            <textarea
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="e.g. Terms violation: repeated no-shows, harassment, or dispute escalation."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setSuspendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={actionLoading || !suspendReason.trim()}
              onClick={submitSuspend}
            >
              {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reactivate Modal */}
      <Modal
        isOpen={reactivateModalOpen}
        onClose={() => setReactivateModalOpen(false)}
        title={`Reactivate Account: ${selectedUser?.name}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            This will restore account login and allow the user to schedule sessions and teach again.
          </p>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Reactivation Note / Reason (Optional)
            </label>
            <textarea
              rows={2}
              value={reactivateReason}
              onChange={(e) => setReactivateReason(e.target.value)}
              placeholder="e.g. Disciplinary review resolved with user."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setReactivateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={actionLoading}
              onClick={submitReactivate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {actionLoading ? 'Reactivating...' : 'Reactivate User'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Credit Adjustment Modal */}
      <Modal
        isOpen={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        title={`Manual Credit Adjustment: ${selectedUser?.name}`}
      >
        <div className="space-y-4">
          <div className="text-xs text-slate-500">
            Current balance: <span className="font-bold text-slate-800">{selectedUser?.wallet?.available} credits</span>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Credit Amount (Positive to grant, Negative to deduct)
            </label>
            <input
              type="number"
              step="1"
              value={adjustAmount}
              onChange={(e) => setAdjustAmount(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Audited Reason (Mandatory)
            </label>
            <textarea
              rows={2}
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="e.g. Compensation for mentor no-show / Goodwill grant"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={actionLoading || !adjustReason.trim() || parseInt(adjustAmount, 10) === 0}
              onClick={submitAdjust}
            >
              {actionLoading ? 'Applying...' : 'Post Adjustment'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="User Snapshot"
      >
        {userDetails ? (
          <div className="space-y-4 text-sm text-slate-700">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 text-base">{userDetails.user.name}</div>
              <div className="text-xs text-slate-500">{userDetails.user.email}</div>
              <div className="text-xs text-slate-500">Campus: {userDetails.user.college || 'N/A'}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <div className="text-xs font-bold text-indigo-600 uppercase">Offerings</div>
                <div className="text-xl font-black text-slate-900 mt-1">{userDetails.stats.offeringsCount}</div>
              </div>
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
                <div className="text-xs font-bold text-teal-600 uppercase">Bookings</div>
                <div className="text-xl font-black text-slate-900 mt-1">{userDetails.stats.bookingsCount}</div>
              </div>
            </div>

            {userDetails.user.isSuspended && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                <span className="font-bold">Suspension Reason:</span> {userDetails.user.suspensionReason || 'No reason recorded'}
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-600 mb-2" />
            Loading details...
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsersPage;
