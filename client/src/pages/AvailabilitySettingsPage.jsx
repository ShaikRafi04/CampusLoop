import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Calendar, Clock, Plus, Trash2, CheckCircle, ShieldAlert, Loader2 } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const AvailabilitySettingsPage = () => {
  const toast = useToast();
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states for new window
  const [type, setType] = useState('WEEKLY');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [isAvailable, setIsAvailable] = useState(true);
  const [adding, setAdding] = useState(false);

  const fetchAvailability = async () => {
    try {
      const res = await api.get('/availability/me');
      setWindows(res.data.data.windows || []);
    } catch (err) {
      console.error('Failed to load availability', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, []);

  const handleAddWindow = async (e) => {
    e.preventDefault();
    setAdding(true);

    const payload = {
      type,
      startTime,
      endTime,
      ...(type === 'WEEKLY' ? { dayOfWeek: parseInt(dayOfWeek, 10) } : { date, isAvailable }),
    };

    try {
      await api.post('/availability', payload);
      toast.success('Availability window added successfully!');
      fetchAvailability();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add availability window');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/availability/${id}`);
      toast.info('Availability window removed.');
      fetchAvailability();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove window');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Teaching Availability</h1>
        <p className="mt-1 text-sm text-slate-500">
          Define recurring weekly windows and date overrides when students can book 1-on-1 sessions with you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Form to add a window */}
        <Card className="p-6 md:col-span-1 border-indigo-100 shadow-sm h-fit">
          <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4 text-indigo-600" /> Add Available Time
          </h3>

          <form onSubmit={handleAddWindow} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Rule Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="WEEKLY">Weekly Recurring</option>
                <option value="DATE_OVERRIDE">Specific Date Override</option>
              </select>
            </div>

            {type === 'WEEKLY' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Day of the Week
                </label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {DAYS.map((d, i) => (
                    <option key={i} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isAvail"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isAvail" className="text-xs text-slate-700 font-medium">
                    Available on this date (Uncheck for blackout)
                  </label>
                </div>
              </>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Start (HH:mm)
                </label>
                <input
                  type="text"
                  required
                  pattern="^([01]\d|2[0-3]):(00|30)$"
                  placeholder="10:00"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  End (HH:mm)
                </label>
                <input
                  type="text"
                  required
                  pattern="^([01]\d|2[0-3]):(00|30)$"
                  placeholder="13:00"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">Must be on 30-minute boundaries (:00 or :30)</p>

            <Button type="submit" variant="primary" size="md" isLoading={adding} className="w-full mt-2">
              Add Time Window
            </Button>
          </form>
        </Card>

        {/* Existing Windows List */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-base font-bold text-slate-900">Configured Availability Windows</h3>

          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading windows...</div>
          ) : windows.length === 0 ? (
            <Card className="p-8 text-center text-slate-500">
              <p className="text-sm">You haven't set any availability windows yet. Add your first window on the left so students can book sessions with you!</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {windows.map((w) => (
                <div
                  key={w._id}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {w.type === 'WEEKLY' ? 'WEEKLY RECURRING' : 'DATE OVERRIDE'}
                      </span>
                      {!w.isAvailable && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          Blackout
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-800">
                      {w.type === 'WEEKLY' ? DAYS[w.dayOfWeek] : w.date}
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {w.startTime} - {w.endTime}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(w._id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-slate-50 transition"
                    title="Remove window"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
