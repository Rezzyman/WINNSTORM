import { Capacitor } from '@capacitor/core';
import { offlineDb, OfflineSyncQueue, OfflineProperty, OfflineInspection, OfflineEvidence } from './offline-database';

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors: string[];
}

interface ConflictResolution {
  entityType: 'property' | 'inspection' | 'evidence';
  entityId: string;
  localData: any;
  serverData: any;
  resolution: 'keep_local' | 'keep_server' | 'merge';
  resolvedData?: any;
}

class SyncService {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private syncStatus: SyncStatus = 'idle';
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private syncInterval: number | null = null;
  private baseUrl: string = '';

  constructor() {
    this.setupNetworkListener();
    this.baseUrl = window.location.origin;
  }

  private setupNetworkListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyListeners('idle');
        this.triggerSync();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyListeners('offline');
      });

      this.isOnline = navigator.onLine;
    }
  }

  addStatusListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.syncStatus);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(status: SyncStatus): void {
    this.syncStatus = status;
    this.listeners.forEach(listener => listener(status));
  }

  getStatus(): SyncStatus {
    return this.syncStatus;
  }

  isNetworkAvailable(): boolean {
    return this.isOnline;
  }

  startAutoSync(intervalMs: number = 30000): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = window.setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.triggerSync();
      }
    }, intervalMs);

    if (this.isOnline) {
      this.triggerSync();
    }
  }

  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  async triggerSync(): Promise<SyncResult> {
    if (!this.isOnline) {
      return { success: false, syncedItems: 0, failedItems: 0, errors: ['Network unavailable'] };
    }

    if (this.isSyncing) {
      return { success: false, syncedItems: 0, failedItems: 0, errors: ['Sync already in progress'] };
    }

    this.isSyncing = true;
    this.notifyListeners('syncing');

    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      errors: [],
    };

    try {
      const pendingItems = await offlineDb.getPendingSyncItems();

      for (const item of pendingItems) {
        try {
          await this.processSyncItem(item);
          await offlineDb.markSyncItemCompleted(item.id);
          result.syncedItems++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          await offlineDb.markSyncItemFailed(item.id, errorMessage);
          result.failedItems++;
          result.errors.push(`${item.entityType}/${item.entityId}: ${errorMessage}`);
        }
      }

      await this.uploadPendingEvidence();

      this.notifyListeners('idle');
    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Sync failed');
      this.notifyListeners('error');
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async processSyncItem(item: OfflineSyncQueue): Promise<void> {
    const payload = JSON.parse(item.payload);

    switch (item.entityType) {
      case 'property':
        await this.syncProperty(item.action, item.entityId, payload);
        break;
      case 'inspection':
        await this.syncInspection(item.action, item.entityId, payload);
        break;
      case 'evidence':
        break;
    }
  }

  private async syncProperty(
    action: 'create' | 'update' | 'delete',
    entityId: string,
    payload: any
  ): Promise<void> {
    const property = await offlineDb.getProperty(entityId);
    if (!property) return;

    if (action === 'create') {
      const response = await fetch(`${this.baseUrl}/api/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: property.name,
          address: property.address,
          buildingInfo: property.buildingInfo ? JSON.parse(property.buildingInfo) : null,
          roofSystemDetails: property.roofSystemDetails ? JSON.parse(property.roofSystemDetails) : null,
          overallCondition: property.overallCondition,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create property: ${response.statusText}`);
      }

      const serverProperty = await response.json();
      await offlineDb.updateProperty(entityId, {
        serverId: serverProperty.id,
        syncStatus: 'synced',
        serverUpdatedAt: new Date().toISOString(),
      });
    } else if (action === 'update' && property.serverId) {
      const serverResponse = await fetch(`${this.baseUrl}/api/properties/${property.serverId}`, {
        method: 'GET',
        credentials: 'include',
      });

      if (serverResponse.ok) {
        const serverData = await serverResponse.json();
        
        if (serverData.updatedAt && property.serverUpdatedAt) {
          const serverUpdated = new Date(serverData.updatedAt).getTime();
          const localServerUpdated = new Date(property.serverUpdatedAt).getTime();
          
          if (serverUpdated > localServerUpdated) {
            const conflict = await this.resolveConflict('property', entityId, property, serverData);
            if (conflict.resolution === 'keep_server') {
              await offlineDb.updateProperty(entityId, {
                ...serverData,
                syncStatus: 'synced',
                serverUpdatedAt: serverData.updatedAt,
              });
              return;
            }
          }
        }
      }

      const response = await fetch(`${this.baseUrl}/api/properties/${property.serverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to update property: ${response.statusText}`);
      }

      await offlineDb.updateProperty(entityId, {
        syncStatus: 'synced',
        serverUpdatedAt: new Date().toISOString(),
      });
    }
  }

  private async syncInspection(
    action: 'create' | 'update' | 'delete',
    entityId: string,
    payload: any
  ): Promise<void> {
    const inspection = await offlineDb.getInspection(entityId);
    if (!inspection) return;

    if (action === 'create') {
      const response = await fetch(`${this.baseUrl}/api/inspections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          propertyId: inspection.propertyServerId,
          currentStep: inspection.currentStep,
          stepData: JSON.parse(inspection.stepData),
          status: inspection.status,
          startedAt: inspection.startedAt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create inspection: ${response.statusText}`);
      }

      const serverInspection = await response.json();
      await offlineDb.updateInspection(entityId, {
        serverId: serverInspection.id,
        syncStatus: 'synced',
        serverUpdatedAt: new Date().toISOString(),
      });
    } else if (action === 'update' && inspection.serverId) {
      const response = await fetch(`${this.baseUrl}/api/inspections/${inspection.serverId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentStep: inspection.currentStep,
          stepData: JSON.parse(inspection.stepData),
          status: inspection.status,
          completedAt: inspection.completedAt,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update inspection: ${response.statusText}`);
      }

      await offlineDb.updateInspection(entityId, {
        syncStatus: 'synced',
        serverUpdatedAt: new Date().toISOString(),
      });
    }
  }

  private async uploadPendingEvidence(): Promise<void> {
    const pendingEvidence = await offlineDb.getPendingEvidence();

    for (const evidence of pendingEvidence) {
      try {
        if (Capacitor.isNativePlatform()) {
          const formData = new FormData();
          
          const response = await fetch(evidence.localPath);
          const blob = await response.blob();
          const filename = evidence.localPath.split('/').pop() || 'evidence.jpg';
          formData.append('file', blob, filename);
          formData.append('inspectionId', evidence.inspectionServerId?.toString() || '');
          formData.append('step', evidence.step.toString());
          formData.append('type', evidence.type);
          formData.append('metadata', evidence.metadata);
          if (evidence.latitude) formData.append('latitude', evidence.latitude.toString());
          if (evidence.longitude) formData.append('longitude', evidence.longitude.toString());

          const uploadResponse = await fetch(`${this.baseUrl}/api/evidence/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Upload failed: ${uploadResponse.statusText}`);
          }

          const result = await uploadResponse.json();
          await offlineDb.markEvidenceSynced(evidence.id, result.url, result.id);
        } else {
          if (evidence.localPath.startsWith('data:') || evidence.localPath.startsWith('blob:')) {
            const formData = new FormData();
            
            const response = await fetch(evidence.localPath);
            const blob = await response.blob();
            formData.append('file', blob, `evidence-${evidence.id}.jpg`);
            formData.append('inspectionId', evidence.inspectionServerId?.toString() || '');
            formData.append('step', evidence.step.toString());
            formData.append('type', evidence.type);
            formData.append('metadata', evidence.metadata);

            const uploadResponse = await fetch(`${this.baseUrl}/api/evidence/upload`, {
              method: 'POST',
              credentials: 'include',
              body: formData,
            });

            if (uploadResponse.ok) {
              const result = await uploadResponse.json();
              await offlineDb.markEvidenceSynced(evidence.id, result.url, result.id);
            }
          }
        }
      } catch (error) {
        await offlineDb.incrementEvidenceUploadAttempts(
          evidence.id,
          error instanceof Error ? error.message : 'Upload failed'
        );
      }
    }
  }

  private async resolveConflict(
    entityType: 'property' | 'inspection' | 'evidence',
    entityId: string,
    localData: any,
    serverData: any
  ): Promise<ConflictResolution> {
    const localTime = new Date(localData.localUpdatedAt).getTime();
    const serverTime = new Date(serverData.updatedAt || serverData.createdAt).getTime();

    if (localTime > serverTime) {
      return {
        entityType,
        entityId,
        localData,
        serverData,
        resolution: 'keep_local',
      };
    }

    return {
      entityType,
      entityId,
      localData,
      serverData,
      resolution: 'keep_server',
    };
  }

  async pullServerData(userId: number): Promise<void> {
    if (!this.isOnline) return;

    try {
      const propertiesResponse = await fetch(`${this.baseUrl}/api/properties?userId=${userId}`, {
        credentials: 'include',
      });

      if (propertiesResponse.ok) {
        const serverProperties = await propertiesResponse.json();
        
        for (const serverProp of serverProperties) {
          const existingProps = await offlineDb.getAllProperties();
          const existing = existingProps.find(p => p.serverId === serverProp.id);
          
          if (!existing) {
            await offlineDb.saveProperty({
              serverId: serverProp.id,
              projectId: serverProp.projectId,
              name: serverProp.name,
              address: serverProp.address,
              buildingInfo: serverProp.buildingInfo ? JSON.stringify(serverProp.buildingInfo) : undefined,
              roofSystemDetails: serverProp.roofSystemDetails ? JSON.stringify(serverProp.roofSystemDetails) : undefined,
              imageUrl: serverProp.imageUrl,
              overallCondition: serverProp.overallCondition,
              lastInspectionDate: serverProp.lastInspectionDate,
              userId: serverProp.userId,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to pull server data:', error);
    }
  }
}

export const syncService = new SyncService();
