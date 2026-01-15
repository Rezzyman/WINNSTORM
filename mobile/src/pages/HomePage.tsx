import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Camera, MessageCircle, ChevronRight, MapPin, Clock, Zap } from 'lucide-react';
import { cn, hapticFeedback, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { demoInspections, demoStats, type DemoInspection } from '@/lib/demo-data';

export default function HomePage() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [recentInspections, setRecentInspections] = useState<DemoInspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use demo data for showcase
    const loadDemoData = () => {
      setTimeout(() => {
        setRecentInspections(demoInspections.slice(0, 3));
        setIsLoading(false);
      }, 500); // Simulate loading
    };
    loadDemoData();
  }, []);

  const handleCameraPress = () => {
    hapticFeedback('medium');
    navigate('/camera');
  };

  const handleStormyPress = () => {
    hapticFeedback('medium');
    navigate('/stormy');
  };

  return (
    <div className="h-full overflow-y-auto pt-safe">
      {/* Header */}
      <div className="px-5 pt-4 pb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-white">WinnStorm</h1>
            <p className="text-slate-400 text-sm">
              {user ? `Welcome, ${user.name?.split(' ')[0] || 'Inspector'}` : 'Damage Assessment'}
            </p>
          </div>
          <img src="/logo.png" alt="" className="w-12 h-12 rounded-xl" />
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="px-5 space-y-4 mb-8">
        {/* Big Camera Button */}
        <button
          onClick={handleCameraPress}
          className={cn(
            'w-full bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-6',
            'flex items-center gap-5 shadow-lg shadow-primary-500/25',
            'active:scale-[0.98] transition-transform'
          )}
        >
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <Camera className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 text-left">
            <h2 className="text-xl font-bold text-white mb-1">Start Inspection</h2>
            <p className="text-white/80 text-sm">Capture damage photos & analyze</p>
          </div>
          <ChevronRight className="w-6 h-6 text-white/60" />
        </button>

        {/* Stormy AI Button */}
        <button
          onClick={handleStormyPress}
          className={cn(
            'w-full bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl p-6',
            'flex items-center gap-5 border border-slate-600',
            'active:scale-[0.98] transition-transform'
          )}
        >
          <div className="w-16 h-16 rounded-2xl overflow-hidden relative">
            <img src="/stormy-avatar.png" alt="Stormy" className="w-full h-full object-cover" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-700" />
          </div>
          <div className="flex-1 text-left">
            <h2 className="text-xl font-bold text-white mb-1">Ask Stormy</h2>
            <p className="text-slate-400 text-sm">Voice AI assistant for inspections</p>
          </div>
          <ChevronRight className="w-6 h-6 text-slate-500" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="px-5 mb-6">
        <div className="grid grid-cols-3 gap-3">
          <QuickStat icon={Zap} label="Today" value={String(demoStats.today)} color="primary" />
          <QuickStat icon={Clock} label="Pending" value={String(demoStats.pending)} color="amber" />
          <QuickStat icon={MapPin} label="Nearby" value={String(demoStats.nearbyJobs)} color="blue" />
        </div>
      </div>

      {/* Recent Inspections */}
      <div className="px-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Inspections</h3>
          <button
            onClick={() => navigate('/inspections')}
            className="text-primary-400 text-sm font-medium"
          >
            View All
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : recentInspections.length > 0 ? (
          <div className="space-y-3">
            {recentInspections.map((inspection) => (
              <button
                key={inspection.id}
                onClick={() => {
                  hapticFeedback('light');
                  navigate(`/property/${inspection.id}`);
                }}
                className={cn(
                  'w-full bg-slate-800 rounded-2xl p-4 text-left',
                  'flex items-center gap-4 border border-slate-700',
                  'active:bg-slate-750 transition-colors'
                )}
              >
                <div className="w-12 h-12 bg-slate-700 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{inspection.address}</p>
                  <p className="text-slate-400 text-sm truncate">{inspection.clientName}</p>
                  <p className="text-slate-500 text-xs">{inspection.city}, {inspection.state}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <StatusBadge status={inspection.status} />
                  <p className="text-slate-500 text-xs mt-1">{inspection.photoCount} photos</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-2xl p-8 text-center border border-dashed border-slate-700">
            <Camera className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No inspections yet</p>
            <p className="text-slate-500 text-xs mt-1">Start your first inspection above</p>
          </div>
        )}
      </div>
    </div>
  );
}

function QuickStat({ icon: Icon, label, value, color }: {
  icon: typeof Zap;
  label: string;
  value: string;
  color: 'primary' | 'amber' | 'blue';
}) {
  const colorClasses = {
    primary: 'bg-primary-500/20 text-primary-400',
    amber: 'bg-amber-500/20 text-amber-400',
    blue: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <div className="bg-slate-800 rounded-2xl p-4 text-center border border-slate-700">
      <div className={cn('w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center', colorClasses[color])}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-slate-500 text-xs">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' },
    in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'In Progress' },
    completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Complete' },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={cn('text-xs font-medium px-2 py-1 rounded-full', config.bg, config.text)}>
      {config.label}
    </span>
  );
}
