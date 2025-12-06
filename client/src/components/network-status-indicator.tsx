import { Wifi, WifiOff, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useSyncStatus } from '@/hooks/use-offline-database';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NetworkStatusIndicatorProps {
  showDetails?: boolean;
  className?: string;
}

export function NetworkStatusIndicator({ 
  showDetails = false,
  className 
}: NetworkStatusIndicatorProps) {
  const { isOnline, status, triggerSync } = useNetworkStatus();
  const { hasPendingChanges, hasFailedChanges, totalPending } = useSyncStatus();

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff className="h-4 w-4 text-red-500" />;
    }
    if (status === 'syncing') {
      return <RefreshCw className="h-4 w-4 text-[hsl(16,100%,50%)] animate-spin" />;
    }
    if (hasFailedChanges) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
    if (hasPendingChanges) {
      return <RefreshCw className="h-4 w-4 text-white/60" />;
    }
    return <Wifi className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (status === 'syncing') return 'Syncing...';
    if (hasFailedChanges) return 'Sync errors';
    if (hasPendingChanges) return `${totalPending} pending`;
    return 'All synced';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500/20 border-red-500/50';
    if (status === 'syncing') return 'bg-[hsl(16,100%,50%)]/20 border-[hsl(16,100%,50%)]/50';
    if (hasFailedChanges) return 'bg-yellow-500/20 border-yellow-500/50';
    if (hasPendingChanges) return 'bg-white/10 border-white/30';
    return 'bg-green-500/20 border-green-500/50';
  };

  if (showDetails) {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-none border',
        getStatusColor(),
        className
      )}>
        {getStatusIcon()}
        <span className="text-sm text-white/80">{getStatusText()}</span>
        {isOnline && hasPendingChanges && status !== 'syncing' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => triggerSync()}
            className="h-6 px-2 text-xs touch-target"
            data-testid="button-sync-now"
          >
            Sync Now
          </Button>
        )}
      </div>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => isOnline && hasPendingChanges && triggerSync()}
          className={cn(
            'relative flex items-center justify-center w-8 h-8 rounded-none touch-target',
            getStatusColor(),
            className
          )}
          data-testid="button-network-status"
        >
          {getStatusIcon()}
          {hasPendingChanges && !hasFailedChanges && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-[hsl(16,100%,50%)] rounded-full flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">
                {totalPending > 9 ? '9+' : totalPending}
              </span>
            </span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{getStatusText()}</p>
        {hasPendingChanges && isOnline && status !== 'syncing' && (
          <p className="text-xs text-white/60">Click to sync</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

export function NetworkStatusBanner() {
  const { isOnline, status, triggerSync } = useNetworkStatus();
  const { hasPendingChanges, totalPending } = useSyncStatus();

  if (isOnline && !hasPendingChanges) return null;

  return (
    <div className={cn(
      'fixed bottom-safe-area-bottom left-0 right-0 z-50 px-4 py-3 flex items-center justify-between',
      !isOnline ? 'bg-red-600' : 'bg-[hsl(16,100%,50%)]'
    )}>
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="h-5 w-5 text-white" />
            <span className="text-white font-medium">You're offline</span>
          </>
        ) : status === 'syncing' ? (
          <>
            <RefreshCw className="h-5 w-5 text-white animate-spin" />
            <span className="text-white font-medium">Syncing changes...</span>
          </>
        ) : (
          <>
            <RefreshCw className="h-5 w-5 text-white" />
            <span className="text-white font-medium">{totalPending} changes pending</span>
          </>
        )}
      </div>
      {isOnline && status !== 'syncing' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => triggerSync()}
          className="text-white hover:bg-white/20 touch-target"
          data-testid="button-banner-sync"
        >
          <Check className="h-4 w-4 mr-1" />
          Sync Now
        </Button>
      )}
    </div>
  );
}

export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-red-600 text-white text-center py-1 text-sm font-medium">
      <WifiOff className="h-4 w-4 inline mr-2" />
      Working Offline - Changes will sync when connected
    </div>
  );
}
