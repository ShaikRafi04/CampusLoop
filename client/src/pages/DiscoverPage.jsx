import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  Search,
  Filter,
  Coins,
  Clock,
  Star,
  User,
  ArrowRight,
  Compass,
  Loader2,
  X,
} from 'lucide-react';

const CATEGORIES = [
  'All Categories',
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

export const DiscoverPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [skills, setSkills] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filter states initialized from URL params
  const [q, setQ] = useState(searchParams.get('q') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || '');
  const [format, setFormat] = useState(searchParams.get('format') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));

  const fetchSkills = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (category && category !== 'All Categories') params.set('category', category);
      if (difficulty) params.set('difficulty', difficulty);
      if (format) params.set('format', format);
      if (sort) params.set('sort', sort);
      params.set('page', page.toString());
      params.set('limit', '12');

      const res = await api.get(`/skills?${params.toString()}`);
      setSkills(res.data.data || []);
      if (res.data.meta) setMeta(res.data.meta);
    } catch (err) {
      console.error('Error fetching discovery skills', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, [category, difficulty, format, sort, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchSkills();
  };

  const handleClearFilters = () => {
    setQ('');
    setCategory('');
    setDifficulty('');
    setFormat('');
    setSort('newest');
    setPage(1);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Discover Peer Mentors</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search course topics, exam prep, and technical skills taught by fellow students.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-4 shadow-sm border-slate-200">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by topic, tag, or mentor name..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50 focus:bg-white transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={difficulty}
              onChange={(e) => {
                setDifficulty(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Levels</option>
              <option value="BEGINNER">Beginner</option>
              <option value="INTERMEDIATE">Intermediate</option>
              <option value="ADVANCED">Advanced</option>
            </select>

            <select
              value={format}
              onChange={(e) => {
                setFormat(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All Formats</option>
              <option value="ONLINE">Online</option>
              <option value="IN_PERSON">In-Person</option>
            </select>

            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="newest">Sort: Newest</option>
              <option value="rating_desc">Sort: Highest Rated</option>
              <option value="cost_asc">Sort: Lowest Credits</option>
              <option value="experience_desc">Sort: Most Experienced</option>
            </select>

            <Button type="submit" variant="primary" size="sm" className="py-2.5">
              Search
            </Button>
          </div>
        </form>
      </Card>

      {/* Grid of Offerings */}
      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          <p className="text-sm text-slate-500">Searching offerings...</p>
        </div>
      ) : skills.length === 0 ? (
        <Card className="p-12 text-center max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <Compass className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Matching Offerings</h3>
          <p className="text-sm text-slate-500 mb-6">
            We couldn't find any skill offerings matching your filter criteria. Try adjusting your search query or reset filters.
          </p>
          <Button variant="outline" size="md" onClick={handleClearFilters}>
            Clear All Filters
          </Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skills.map((skill) => (
              <Card key={skill._id} className="flex flex-col justify-between p-6 hover:shadow-lg">
                <div>
                  {/* Category and Credit Cost Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-100">
                      {skill.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      {skill.creditCost} Credits
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-2 leading-snug line-clamp-2">
                    {skill.title}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 mb-4 leading-relaxed">
                    {skill.description}
                  </p>

                  {/* Attributes */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-4">
                    <span className="font-semibold text-slate-700">{skill.difficulty}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> {skill.durationMinutes} min
                    </span>
                    <span>•</span>
                    <span>{skill.format}</span>
                  </div>

                  {/* Tags */}
                  {skill.tags && skill.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {skill.tags.map((t, idx) => (
                        <span key={idx} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mentor Footer */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/users/${skill.ownerId?._id || skill.ownerId}`}
                    className="flex items-center gap-2 group"
                  >
                    {skill.ownerId?.profileImage ? (
                      <img
                        src={skill.ownerId.profileImage}
                        alt={skill.mentorName || 'Mentor'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        {(skill.mentorName || 'M').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition truncate max-w-[120px]">
                        {skill.mentorName || skill.ownerId?.name || 'Classmate'}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        {skill.ratingSummary?.count > 0 ? (
                          <>
                            <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                            <span>{skill.ratingSummary.average.toFixed(1)}</span>
                          </>
                        ) : (
                          <span>New</span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <Link
                    to={`/skills/${skill._id}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition"
                  >
                    View Slots <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-6">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
              >
                Previous
              </Button>
              <span className="text-xs font-bold text-slate-600 px-3">
                Page {meta.page} of {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, meta.totalPages))}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
