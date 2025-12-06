import { useState, useEffect, useCallback } from 'react';
import { offlineDb, OfflineProperty, OfflineInspection, OfflineEvidence } from '@/lib/offline-database';

export function useOfflineDatabase() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const init = async () => {
      if (isInitialized || isInitializing) return;
      
      setIsInitializing(true);
      try {
        await offlineDb.initialize();
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize offline database:', err);
        setError(err instanceof Error ? err : new Error('Database initialization failed'));
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [isInitialized, isInitializing]);

  return {
    isInitialized,
    isInitializing,
    error,
    db: offlineDb,
  };
}

export function useOfflineProperties() {
  const { db, isInitialized } = useOfflineDatabase();
  const [properties, setProperties] = useState<OfflineProperty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isInitialized) return;
    
    setIsLoading(true);
    try {
      const allProperties = await db.getAllProperties();
      setProperties(allProperties);
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, isInitialized]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveProperty = useCallback(async (
    property: Omit<OfflineProperty, 'id' | 'localUpdatedAt' | 'syncStatus'>
  ) => {
    const saved = await db.saveProperty(property);
    await refresh();
    return saved;
  }, [db, refresh]);

  const updateProperty = useCallback(async (id: string, updates: Partial<OfflineProperty>) => {
    await db.updateProperty(id, updates);
    await refresh();
  }, [db, refresh]);

  return {
    properties,
    isLoading,
    refresh,
    saveProperty,
    updateProperty,
  };
}

export function useOfflineInspections(propertyId?: string) {
  const { db, isInitialized } = useOfflineDatabase();
  const [inspections, setInspections] = useState<OfflineInspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isInitialized) return;
    
    setIsLoading(true);
    try {
      if (propertyId) {
        const propertyInspections = await db.getInspectionsByProperty(propertyId);
        setInspections(propertyInspections);
      }
    } catch (error) {
      console.error('Failed to load inspections:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, isInitialized, propertyId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const startInspection = useCallback(async (propertyId: string, propertyServerId?: number) => {
    const inspection = await db.saveInspection({
      propertyId,
      propertyServerId,
      currentStep: 0,
      stepData: '{}',
      evidenceIds: '[]',
      status: 'in_progress',
      startedAt: new Date().toISOString(),
    });
    await refresh();
    return inspection;
  }, [db, refresh]);

  const updateInspection = useCallback(async (id: string, updates: Partial<OfflineInspection>) => {
    await db.updateInspection(id, updates);
    await refresh();
  }, [db, refresh]);

  return {
    inspections,
    isLoading,
    refresh,
    startInspection,
    updateInspection,
  };
}

export function useOfflineEvidence(inspectionId?: string) {
  const { db, isInitialized } = useOfflineDatabase();
  const [evidence, setEvidence] = useState<OfflineEvidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isInitialized || !inspectionId) return;
    
    setIsLoading(true);
    try {
      const inspectionEvidence = await db.getEvidenceByInspection(inspectionId);
      setEvidence(inspectionEvidence);
    } catch (error) {
      console.error('Failed to load evidence:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, isInitialized, inspectionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveEvidence = useCallback(async (
    data: Omit<OfflineEvidence, 'id' | 'localUpdatedAt' | 'syncStatus' | 'uploadAttempts'>
  ) => {
    const saved = await db.saveEvidence(data);
    await refresh();
    return saved;
  }, [db, refresh]);

  return {
    evidence,
    isLoading,
    refresh,
    saveEvidence,
  };
}

export function useSyncStatus() {
  const { db, isInitialized } = useOfflineDatabase();
  const [stats, setStats] = useState({
    pendingProperties: 0,
    pendingInspections: 0,
    pendingEvidence: 0,
    pendingQueueItems: 0,
    failedQueueItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!isInitialized) return;
    
    setIsLoading(true);
    try {
      const syncStats = await db.getSyncStats();
      setStats(syncStats);
    } catch (error) {
      console.error('Failed to get sync stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [db, isInitialized]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [refresh]);

  const hasPendingChanges = stats.pendingProperties > 0 || 
    stats.pendingInspections > 0 || 
    stats.pendingEvidence > 0 || 
    stats.pendingQueueItems > 0;

  const hasFailedChanges = stats.failedQueueItems > 0;

  const totalPending = stats.pendingQueueItems;

  return {
    stats,
    isLoading,
    refresh,
    hasPendingChanges,
    hasFailedChanges,
    totalPending,
  };
}
