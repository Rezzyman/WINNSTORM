import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

export interface OfflineProperty {
  id: string;
  serverId?: number;
  projectId?: number;
  name: string;
  address: string;
  buildingInfo?: string;
  roofSystemDetails?: string;
  imageUrl?: string;
  overallCondition?: string;
  lastInspectionDate?: string;
  userId?: number;
  syncStatus: 'pending' | 'synced' | 'conflict';
  localUpdatedAt: string;
  serverUpdatedAt?: string;
}

export interface OfflineInspection {
  id: string;
  serverId?: number;
  propertyId: string;
  propertyServerId?: number;
  currentStep: number;
  stepData: string;
  evidenceIds: string;
  status: 'in_progress' | 'completed' | 'submitted';
  startedAt: string;
  completedAt?: string;
  syncStatus: 'pending' | 'synced' | 'conflict';
  localUpdatedAt: string;
  serverUpdatedAt?: string;
}

export interface OfflineEvidence {
  id: string;
  serverId?: number;
  inspectionId: string;
  inspectionServerId?: number;
  step: number;
  type: 'photo' | 'thermal' | 'document' | 'voice_memo';
  localPath: string;
  remoteUrl?: string;
  metadata: string;
  capturedAt: string;
  latitude?: number;
  longitude?: number;
  syncStatus: 'pending' | 'synced' | 'failed';
  uploadAttempts: number;
  localUpdatedAt: string;
}

export interface OfflineSyncQueue {
  id: string;
  entityType: 'property' | 'inspection' | 'evidence';
  entityId: string;
  action: 'create' | 'update' | 'delete';
  payload: string;
  createdAt: string;
  attempts: number;
  lastAttemptAt?: string;
  errorMessage?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

const DB_NAME = 'winnstorm_offline';
const DB_VERSION = 1;

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS properties (
  id TEXT PRIMARY KEY,
  serverId INTEGER,
  projectId INTEGER,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  buildingInfo TEXT,
  roofSystemDetails TEXT,
  imageUrl TEXT,
  overallCondition TEXT,
  lastInspectionDate TEXT,
  userId INTEGER,
  syncStatus TEXT DEFAULT 'pending',
  localUpdatedAt TEXT NOT NULL,
  serverUpdatedAt TEXT
);

CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY,
  serverId INTEGER,
  propertyId TEXT NOT NULL,
  propertyServerId INTEGER,
  currentStep INTEGER DEFAULT 0,
  stepData TEXT DEFAULT '{}',
  evidenceIds TEXT DEFAULT '[]',
  status TEXT DEFAULT 'in_progress',
  startedAt TEXT NOT NULL,
  completedAt TEXT,
  syncStatus TEXT DEFAULT 'pending',
  localUpdatedAt TEXT NOT NULL,
  serverUpdatedAt TEXT
);

CREATE TABLE IF NOT EXISTS evidence (
  id TEXT PRIMARY KEY,
  serverId INTEGER,
  inspectionId TEXT NOT NULL,
  inspectionServerId INTEGER,
  step INTEGER NOT NULL,
  type TEXT NOT NULL,
  localPath TEXT NOT NULL,
  remoteUrl TEXT,
  metadata TEXT DEFAULT '{}',
  capturedAt TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  syncStatus TEXT DEFAULT 'pending',
  uploadAttempts INTEGER DEFAULT 0,
  localUpdatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY,
  entityType TEXT NOT NULL,
  entityId TEXT NOT NULL,
  action TEXT NOT NULL,
  payload TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  lastAttemptAt TEXT,
  errorMessage TEXT,
  status TEXT DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS app_state (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_properties_sync ON properties(syncStatus);
CREATE INDEX IF NOT EXISTS idx_inspections_sync ON inspections(syncStatus);
CREATE INDEX IF NOT EXISTS idx_inspections_property ON inspections(propertyId);
CREATE INDEX IF NOT EXISTS idx_evidence_sync ON evidence(syncStatus);
CREATE INDEX IF NOT EXISTS idx_evidence_inspection ON evidence(inspectionId);
CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
`;

class OfflineDatabase {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private initialized = false;
  private isNative: boolean;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
    this.isNative = Capacitor.isNativePlatform();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      if (this.isNative) {
        const retCC = await this.sqlite.checkConnectionsConsistency();
        const isConn = (await this.sqlite.isConnection(DB_NAME, false)).result;

        if (retCC.result && isConn) {
          this.db = await this.sqlite.retrieveConnection(DB_NAME, false);
        } else {
          this.db = await this.sqlite.createConnection(
            DB_NAME,
            false,
            'no-encryption',
            DB_VERSION,
            false
          );
        }

        await this.db.open();
        await this.db.execute(CREATE_TABLES_SQL);
      } else {
        console.log('OfflineDatabase: Running in web mode - using IndexedDB fallback');
        await this.initWebFallback();
      }

      this.initialized = true;
      console.log('OfflineDatabase: Initialized successfully');
    } catch (error) {
      console.error('OfflineDatabase: Initialization failed', error);
      throw error;
    }
  }

  private async initWebFallback(): Promise<void> {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          (this as any).indexedDB = request.result;
          resolve();
        };
        
        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          
          if (!db.objectStoreNames.contains('properties')) {
            const propertiesStore = db.createObjectStore('properties', { keyPath: 'id' });
            propertiesStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          }
          
          if (!db.objectStoreNames.contains('inspections')) {
            const inspectionsStore = db.createObjectStore('inspections', { keyPath: 'id' });
            inspectionsStore.createIndex('propertyId', 'propertyId', { unique: false });
            inspectionsStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          }
          
          if (!db.objectStoreNames.contains('evidence')) {
            const evidenceStore = db.createObjectStore('evidence', { keyPath: 'id' });
            evidenceStore.createIndex('inspectionId', 'inspectionId', { unique: false });
            evidenceStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          }
          
          if (!db.objectStoreNames.contains('sync_queue')) {
            const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
            syncStore.createIndex('status', 'status', { unique: false });
          }

          if (!db.objectStoreNames.contains('app_state')) {
            db.createObjectStore('app_state', { keyPath: 'key' });
          }
        };
      });
    }
  }

  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async saveProperty(property: Omit<OfflineProperty, 'id' | 'localUpdatedAt' | 'syncStatus'>): Promise<OfflineProperty> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const newProperty: OfflineProperty = {
      ...property,
      id,
      syncStatus: 'pending',
      localUpdatedAt: now,
    };

    if (this.isNative && this.db) {
      await this.db.run(
        `INSERT INTO properties (id, serverId, projectId, name, address, buildingInfo, roofSystemDetails, imageUrl, overallCondition, lastInspectionDate, userId, syncStatus, localUpdatedAt, serverUpdatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newProperty.id,
          newProperty.serverId || null,
          newProperty.projectId || null,
          newProperty.name,
          newProperty.address,
          newProperty.buildingInfo || null,
          newProperty.roofSystemDetails || null,
          newProperty.imageUrl || null,
          newProperty.overallCondition || null,
          newProperty.lastInspectionDate || null,
          newProperty.userId || null,
          newProperty.syncStatus,
          newProperty.localUpdatedAt,
          newProperty.serverUpdatedAt || null,
        ]
      );
    } else {
      await this.webSave('properties', newProperty);
    }

    await this.addToSyncQueue('property', id, 'create', newProperty);
    return newProperty;
  }

  async updateProperty(id: string, updates: Partial<OfflineProperty>): Promise<void> {
    const now = new Date().toISOString();
    
    if (this.isNative && this.db) {
      const setClauses: string[] = [];
      const values: any[] = [];
      
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id') {
          setClauses.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      setClauses.push('localUpdatedAt = ?');
      values.push(now);
      setClauses.push('syncStatus = ?');
      values.push('pending');
      values.push(id);
      
      await this.db.run(
        `UPDATE properties SET ${setClauses.join(', ')} WHERE id = ?`,
        values
      );
    } else {
      const existing = await this.webGet('properties', id);
      if (existing) {
        await this.webSave('properties', {
          ...existing,
          ...updates,
          localUpdatedAt: now,
          syncStatus: 'pending',
        });
      }
    }

    await this.addToSyncQueue('property', id, 'update', updates);
  }

  async getProperty(id: string): Promise<OfflineProperty | null> {
    if (this.isNative && this.db) {
      const result = await this.db.query(`SELECT * FROM properties WHERE id = ?`, [id]);
      return result.values?.[0] || null;
    } else {
      return await this.webGet('properties', id);
    }
  }

  async getAllProperties(): Promise<OfflineProperty[]> {
    if (this.isNative && this.db) {
      const result = await this.db.query(`SELECT * FROM properties ORDER BY localUpdatedAt DESC`);
      return result.values || [];
    } else {
      return await this.webGetAll('properties');
    }
  }

  async getPendingProperties(): Promise<OfflineProperty[]> {
    if (this.isNative && this.db) {
      const result = await this.db.query(`SELECT * FROM properties WHERE syncStatus = 'pending'`);
      return result.values || [];
    } else {
      return await this.webGetByIndex('properties', 'syncStatus', 'pending');
    }
  }

  async saveInspection(inspection: Omit<OfflineInspection, 'id' | 'localUpdatedAt' | 'syncStatus'>): Promise<OfflineInspection> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const newInspection: OfflineInspection = {
      ...inspection,
      id,
      syncStatus: 'pending',
      localUpdatedAt: now,
    };

    if (this.isNative && this.db) {
      await this.db.run(
        `INSERT INTO inspections (id, serverId, propertyId, propertyServerId, currentStep, stepData, evidenceIds, status, startedAt, completedAt, syncStatus, localUpdatedAt, serverUpdatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newInspection.id,
          newInspection.serverId || null,
          newInspection.propertyId,
          newInspection.propertyServerId || null,
          newInspection.currentStep,
          newInspection.stepData,
          newInspection.evidenceIds,
          newInspection.status,
          newInspection.startedAt,
          newInspection.completedAt || null,
          newInspection.syncStatus,
          newInspection.localUpdatedAt,
          newInspection.serverUpdatedAt || null,
        ]
      );
    } else {
      await this.webSave('inspections', newInspection);
    }

    await this.addToSyncQueue('inspection', id, 'create', newInspection);
    return newInspection;
  }

  async updateInspection(id: string, updates: Partial<OfflineInspection>): Promise<void> {
    const now = new Date().toISOString();
    
    if (this.isNative && this.db) {
      const setClauses: string[] = [];
      const values: any[] = [];
      
      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id') {
          setClauses.push(`${key} = ?`);
          values.push(value);
        }
      });
      
      setClauses.push('localUpdatedAt = ?');
      values.push(now);
      setClauses.push('syncStatus = ?');
      values.push('pending');
      values.push(id);
      
      await this.db.run(
        `UPDATE inspections SET ${setClauses.join(', ')} WHERE id = ?`,
        values
      );
    } else {
      const existing = await this.webGet('inspections', id);
      if (existing) {
        await this.webSave('inspections', {
          ...existing,
          ...updates,
          localUpdatedAt: now,
          syncStatus: 'pending',
        });
      }
    }

    await this.addToSyncQueue('inspection', id, 'update', updates);
  }

  async getInspection(id: string): Promise<OfflineInspection | null> {
    if (this.isNative && this.db) {
      const result = await this.db.query(`SELECT * FROM inspections WHERE id = ?`, [id]);
      return result.values?.[0] || null;
    } else {
      return await this.webGet('inspections', id);
    }
  }

  async getInspectionsByProperty(propertyId: string): Promise<OfflineInspection[]> {
    if (this.isNative && this.db) {
      const result = await this.db.query(`SELECT * FROM inspections WHERE propertyId = ? ORDER BY startedAt DESC`, [propertyId]);
      return result.values || [];
    } else {
      return await this.webGetByIndex('inspections', 'propertyId', propertyId);
    }
  }

  async saveEvidence(evidence: Omit<OfflineEvidence, 'id' | 'localUpdatedAt' | 'syncStatus' | 'uploadAttempts'>): Promise<OfflineEvidence> {
    const id = this.generateId();
    const now = new Date().toISOString();
    
    const newEvidence: OfflineEvidence = {
      ...evidence,
      id,
      syncStatus: 'pending',
      uploadAttempts: 0,
      localUpdatedAt: now,
    };

    if (this.isNative && this.db) {
      await this.db.run(
        `INSERT INTO evidence (id, serverId, inspectionId, inspectionServerId, step, type, localPath, remoteUrl, metadata, capturedAt, latitude, longitude, syncStatus, uploadAttempts, localUpdatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newEvidence.id,
          newEvidence.serverId || null,
          newEvidence.inspectionId,
          newEvidence.inspectionServerId || null,
          newEvidence.step,
          newEvidence.type,
          newEvidence.localPath,
          newEvidence.remoteUrl || null,
          newEvidence.metadata,
          newEvidence.capturedAt,
          newEvidence.latitude || null,
          newEvidence.longitude || null,
          newEvidence.syncStatus,
          newEvidence.uploadAttempts,
          newEvidence.localUpdatedAt,
        ]
      );
    } else {
      await this.webSave('evidence', newEvidence);
    }

    await this.addToSyncQueue('evidence', id, 'create', newEvidence);
    return newEvidence;
  }

  async getEvidenceByInspection(inspectionId: string): Promise<OfflineEvidence[]> {
    if (this.isNative && this.db) {
      const result = await this.db.query(`SELECT * FROM evidence WHERE inspectionId = ? ORDER BY capturedAt ASC`, [inspectionId]);
      return result.values || [];
    } else {
      return await this.webGetByIndex('evidence', 'inspectionId', inspectionId);
    }
  }

  async getPendingEvidence(): Promise<OfflineEvidence[]> {
    if (this.isNative && this.db) {
      const result = await this.db.query(`SELECT * FROM evidence WHERE syncStatus = 'pending' ORDER BY capturedAt ASC`);
      return result.values || [];
    } else {
      return await this.webGetByIndex('evidence', 'syncStatus', 'pending');
    }
  }

  async markEvidenceSynced(id: string, remoteUrl: string, serverId: number): Promise<void> {
    const now = new Date().toISOString();
    
    if (this.isNative && this.db) {
      await this.db.run(
        `UPDATE evidence SET syncStatus = 'synced', remoteUrl = ?, serverId = ?, localUpdatedAt = ? WHERE id = ?`,
        [remoteUrl, serverId, now, id]
      );
    } else {
      const existing = await this.webGet('evidence', id);
      if (existing) {
        await this.webSave('evidence', {
          ...existing,
          syncStatus: 'synced',
          remoteUrl,
          serverId,
          localUpdatedAt: now,
        });
      }
    }
  }

  async incrementEvidenceUploadAttempts(id: string, errorMessage?: string): Promise<void> {
    const now = new Date().toISOString();
    
    if (this.isNative && this.db) {
      await this.db.run(
        `UPDATE evidence SET uploadAttempts = uploadAttempts + 1, syncStatus = CASE WHEN uploadAttempts >= 3 THEN 'failed' ELSE 'pending' END, localUpdatedAt = ? WHERE id = ?`,
        [now, id]
      );
    } else {
      const existing = await this.webGet('evidence', id) as OfflineEvidence | null;
      if (existing) {
        const newAttempts = existing.uploadAttempts + 1;
        await this.webSave('evidence', {
          ...existing,
          uploadAttempts: newAttempts,
          syncStatus: newAttempts >= 3 ? 'failed' : 'pending',
          localUpdatedAt: now,
        });
      }
    }
  }

  private async addToSyncQueue(
    entityType: 'property' | 'inspection' | 'evidence',
    entityId: string,
    action: 'create' | 'update' | 'delete',
    payload: any
  ): Promise<void> {
    const queueItem: OfflineSyncQueue = {
      id: this.generateId(),
      entityType,
      entityId,
      action,
      payload: JSON.stringify(payload),
      createdAt: new Date().toISOString(),
      attempts: 0,
      status: 'pending',
    };

    if (this.isNative && this.db) {
      await this.db.run(
        `INSERT INTO sync_queue (id, entityType, entityId, action, payload, createdAt, attempts, lastAttemptAt, errorMessage, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          queueItem.id,
          queueItem.entityType,
          queueItem.entityId,
          queueItem.action,
          queueItem.payload,
          queueItem.createdAt,
          queueItem.attempts,
          null,
          null,
          queueItem.status,
        ]
      );
    } else {
      await this.webSave('sync_queue', queueItem);
    }
  }

  async getPendingSyncItems(): Promise<OfflineSyncQueue[]> {
    if (this.isNative && this.db) {
      const result = await this.db.query(
        `SELECT * FROM sync_queue WHERE status = 'pending' ORDER BY createdAt ASC`
      );
      return result.values || [];
    } else {
      return await this.webGetByIndex('sync_queue', 'status', 'pending');
    }
  }

  async markSyncItemCompleted(id: string): Promise<void> {
    if (this.isNative && this.db) {
      await this.db.run(`UPDATE sync_queue SET status = 'completed' WHERE id = ?`, [id]);
    } else {
      const existing = await this.webGet('sync_queue', id);
      if (existing) {
        await this.webSave('sync_queue', { ...existing, status: 'completed' });
      }
    }
  }

  async markSyncItemFailed(id: string, errorMessage: string): Promise<void> {
    const now = new Date().toISOString();
    
    if (this.isNative && this.db) {
      await this.db.run(
        `UPDATE sync_queue SET attempts = attempts + 1, lastAttemptAt = ?, errorMessage = ?, status = CASE WHEN attempts >= 3 THEN 'failed' ELSE 'pending' END WHERE id = ?`,
        [now, errorMessage, id]
      );
    } else {
      const existing = await this.webGet('sync_queue', id) as OfflineSyncQueue | null;
      if (existing) {
        const newAttempts = existing.attempts + 1;
        await this.webSave('sync_queue', {
          ...existing,
          attempts: newAttempts,
          lastAttemptAt: now,
          errorMessage,
          status: newAttempts >= 3 ? 'failed' : 'pending',
        });
      }
    }
  }

  async getAppState(key: string): Promise<string | null> {
    if (this.isNative && this.db) {
      const result = await this.db.query(`SELECT value FROM app_state WHERE key = ?`, [key]);
      return result.values?.[0]?.value || null;
    } else {
      const item = await this.webGet('app_state', key);
      return item?.value || null;
    }
  }

  async setAppState(key: string, value: string): Promise<void> {
    const now = new Date().toISOString();
    
    if (this.isNative && this.db) {
      await this.db.run(
        `INSERT OR REPLACE INTO app_state (key, value, updatedAt) VALUES (?, ?, ?)`,
        [key, value, now]
      );
    } else {
      await this.webSave('app_state', { key, value, updatedAt: now });
    }
  }

  async getSyncStats(): Promise<{
    pendingProperties: number;
    pendingInspections: number;
    pendingEvidence: number;
    pendingQueueItems: number;
    failedQueueItems: number;
  }> {
    if (this.isNative && this.db) {
      const [props, insp, evid, pending, failed] = await Promise.all([
        this.db.query(`SELECT COUNT(*) as count FROM properties WHERE syncStatus = 'pending'`),
        this.db.query(`SELECT COUNT(*) as count FROM inspections WHERE syncStatus = 'pending'`),
        this.db.query(`SELECT COUNT(*) as count FROM evidence WHERE syncStatus = 'pending'`),
        this.db.query(`SELECT COUNT(*) as count FROM sync_queue WHERE status = 'pending'`),
        this.db.query(`SELECT COUNT(*) as count FROM sync_queue WHERE status = 'failed'`),
      ]);

      return {
        pendingProperties: props.values?.[0]?.count || 0,
        pendingInspections: insp.values?.[0]?.count || 0,
        pendingEvidence: evid.values?.[0]?.count || 0,
        pendingQueueItems: pending.values?.[0]?.count || 0,
        failedQueueItems: failed.values?.[0]?.count || 0,
      };
    } else {
      const [pendingProps, pendingInsp, pendingEvid, pendingQueue, failedQueue] = await Promise.all([
        this.webGetByIndex('properties', 'syncStatus', 'pending'),
        this.webGetByIndex('inspections', 'syncStatus', 'pending'),
        this.webGetByIndex('evidence', 'syncStatus', 'pending'),
        this.webGetByIndex('sync_queue', 'status', 'pending'),
        this.webGetByIndex('sync_queue', 'status', 'failed'),
      ]);

      return {
        pendingProperties: pendingProps.length,
        pendingInspections: pendingInsp.length,
        pendingEvidence: pendingEvid.length,
        pendingQueueItems: pendingQueue.length,
        failedQueueItems: failedQueue.length,
      };
    }
  }

  async clearAllData(): Promise<void> {
    if (this.isNative && this.db) {
      await this.db.execute(`DELETE FROM evidence`);
      await this.db.execute(`DELETE FROM inspections`);
      await this.db.execute(`DELETE FROM properties`);
      await this.db.execute(`DELETE FROM sync_queue`);
      await this.db.execute(`DELETE FROM app_state`);
    } else {
      const db = (this as any).indexedDB as IDBDatabase;
      if (db) {
        const stores = ['properties', 'inspections', 'evidence', 'sync_queue', 'app_state'];
        for (const storeName of stores) {
          const transaction = db.transaction(storeName, 'readwrite');
          transaction.objectStore(storeName).clear();
        }
      }
    }
  }

  private async webSave(storeName: string, data: any): Promise<void> {
    const db = (this as any).indexedDB as IDBDatabase;
    if (!db) return;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async webGet(storeName: string, id: string): Promise<any> {
    const db = (this as any).indexedDB as IDBDatabase;
    if (!db) return null;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  private async webGetAll(storeName: string): Promise<any[]> {
    const db = (this as any).indexedDB as IDBDatabase;
    if (!db) return [];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  private async webGetByIndex(storeName: string, indexName: string, value: string): Promise<any[]> {
    const db = (this as any).indexedDB as IDBDatabase;
    if (!db) return [];

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async close(): Promise<void> {
    if (this.isNative && this.db) {
      await this.sqlite.closeConnection(DB_NAME, false);
      this.db = null;
      this.initialized = false;
    }
  }
}

export const offlineDb = new OfflineDatabase();
