import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Plus, Search, MapPin, Calendar, ChevronRight, Filter, RefreshCw, Building2 } from 'lucide-react';
import { cn, hapticFeedback, formatDate } from '@/lib/utils';
import { demoInspections, type DemoInspection } from '@/lib/demo-data';

type FilterStatus = 'all' | 'pending' | 'in_progress' | 'completed';

export default function InspectionsPage() {
  const [, navigate] = useLocation();
  const [inspections, setInspections] = useState<DemoInspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const fetchInspections = (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    // Use demo data
    setTimeout(() => {
      setInspections(demoInspections);
      setIsLoading(false);
      setIsRefreshing(false);
    }, 500);
  };

  useEffect(() => {
    fetchInspections();
  }, []);

  const handleRefresh = () => {
    hapticFeedback('light');
    fetchInspections(true);
  };

  const handleNewInspection = () => {
    hapticFeedback('medium');
    navigate('/camera');
  };

  const filteredInspections = inspections.filter((inspection) => {
    const matchesSearch =
      !searchQuery ||
      inspection.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inspection.city.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' || inspection.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const statusCounts = {
    all: inspections.length,
    pending: inspections.filter((i) => i.status === 'pending').length,
    in_progress: inspections.filter((i) => i.status === 'in_progress').length,
    completed: inspections.filter((i) => i.status === 'completed').length,
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 pt-safe">
      {/* Header */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Inspections</h1>
            <p className="text-slate-400 text-sm">{inspections.length} total jobs</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700"
          >
            <RefreshCw className={cn('w-5 h-5 text-slate-400', isRefreshing && 'animate-spin')} />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by address or city..."
            className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-2xl pl-12 pr-4 py-3 text-[16px] border border-slate-700 focus:outline-none focus:border-primary-500"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 scrollbar-hide">
          {(['all', 'pending', 'in_progress', 'completed'] as const).map((status) => (
            <button
              key={status}
              onClick={() => {
                hapticFeedback('light');
                setFilterStatus(status);
              }}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all',
                filterStatus === status
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              )}
            >
              {status === 'all' ? 'All' : status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1.5 opacity-70">({statusCounts[status]})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Inspection List */}
      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredInspections.length > 0 ? (
          <div className="space-y-3">
            {filteredInspections.map((inspection) => (
              <button
                key={inspection.id}
                onClick={() => {
                  hapticFeedback('light');
                  navigate(`/property/${inspection.id}`);
                }}
                className={cn(
                  'w-full bg-slate-800 rounded-2xl p-4',
                  'flex items-center gap-4 border border-slate-700',
                  'active:bg-slate-750 transition-colors text-left'
                )}
              >
                <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{inspection.address}</p>
                  <p className="text-slate-400 text-sm truncate">{inspection.clientName}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-primary-400 text-xs font-medium">
                      {inspection.damageType}
                    </span>
                    <span className="text-slate-500 text-xs">
                      {inspection.photoCount} photos
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusBadge status={inspection.status} />
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">No inspections found</p>
            <p className="text-slate-500 text-sm mt-1">
              {searchQuery ? 'Try a different search' : 'Start a new inspection to get going'}
            </p>
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={handleNewInspection}
        className={cn(
          'fixed bottom-24 right-5 w-16 h-16 bg-primary-500 rounded-2xl',
          'flex items-center justify-center shadow-lg shadow-primary-500/30',
          'active:scale-95 transition-transform'
        )}
      >
        <Plus className="w-8 h-8 text-white" strokeWidth={2.5} />
      </button>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' },
    in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Active' },
    completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Done' },
  };

  const { bg, text, label } = config[status] || config.pending;

  return (
    <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', bg, text)}>
      {label}
    </span>
  );
}
