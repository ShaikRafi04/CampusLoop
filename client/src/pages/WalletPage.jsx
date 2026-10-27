import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  Filter,
  CheckCircle2,
  Lock,
  Loader2,
  TrendingUp,
} from 'lucide-react';

export const WalletPage = () => {
  const { user, refreshUser } = useAuth();
  const [summary, setSummary] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchWalletData = async () => {
    setLoading(true);
    try {
      const [sumRes, txRes] = await Promise.all([
        api.get('/wallet/summary'),
        api.get(`/wallet/transactions?page=${page}&limit=15${typeFilter ? `&type=${typeFilter}` : ''}`),
      ]);
      setSummary(sumRes.data.data);
      setTransactions(txRes.data.data || []);
      if (txRes.data.meta) setMeta(txRes.data.meta);
    } catch (err) {
      console.error('Failed to load wallet data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
    refreshUser();
  }, [page, typeFilter]);

  const formatTxType = (type) => {
    switch (type) {
      case 'INITIAL_GRANT':
        return 'Welcome Credit Bonus';
      case 'RESERVATION':
        return 'Booking Reservation';
      case 'RELEASE':
        return 'Reservation Released';
      case 'SESSION_SETTLEMENT':
        return 'Session Completion Debit';
      case 'SESSION_REWARD':
        return 'Mentoring Reward';
      case 'ADMIN_ADJUSTMENT':
        return 'Admin Balance Adjustment';
      default:
        return type;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Virtual Credit Ledger</h1>
        <p className="mt-1 text-sm text-slate-500">
          Immutable audit record of all learning points earned, reserved, and settled on CampusLoop.
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Available Credits</span>
            <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center font-bold">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-950">{summary?.available ?? user?.wallet?.available ?? 0}</div>
          <p className="text-xs text-amber-800/80 mt-1">Ready to book peer sessions</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-indigo-500/10 via-white to-indigo-500/5 border-indigo-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-800">Reserved in Escrow</span>
            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-indigo-950">{summary?.reserved ?? user?.wallet?.reserved ?? 0}</div>
          <p className="text-xs text-indigo-800/80 mt-1">Held until session completion</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 border-emerald-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Lifetime Earned</span>
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-950">{summary?.totalEarned ?? 0}</div>
          <p className="text-xs text-emerald-800/80 mt-1">From teaching and grants</p>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-slate-500/10 via-white to-slate-500/5 border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Lifetime Spent</span>
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{summary?.totalSpent ?? 0}</div>
          <p className="text-xs text-slate-500 mt-1">On peer learning sessions</p>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card className="p-6 shadow-sm border-slate-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Transaction History</h2>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Transaction Types</option>
              <option value="INITIAL_GRANT">Initial Grant</option>
              <option value="RESERVATION">Reservation</option>
              <option value="RELEASE">Release</option>
              <option value="SESSION_SETTLEMENT">Settlement</option>
              <option value="SESSION_REWARD">Teaching Reward</option>
              <option value="ADMIN_ADJUSTMENT">Admin Adjustment</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            <span className="text-xs">Loading ledger entries...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No transactions found for the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {transactions.map((tx) => {
                  const date = new Date(tx.createdAt);
                  const isCredit = tx.direction === 'CREDIT';
                  return (
                    <tr key={tx._id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} •{' '}
                        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800 whitespace-nowrap">
                        {formatTxType(tx.type)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {tx.description || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold whitespace-nowrap">
                        <span className={isCredit ? 'text-emerald-600' : 'text-slate-900'}>
                          {isCredit ? '+' : '-'}{tx.amount} credits
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500 whitespace-nowrap font-medium">
                        {tx.balanceAfter?.available ?? 0} avail / {tx.balanceAfter?.reserved ?? 0} res
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-500 font-medium">
              Showing page {meta.page} of {meta.totalPages} ({meta.total} records)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
