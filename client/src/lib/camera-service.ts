import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Geolocation } from '@capacitor/geolocation';

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  filePath?: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  type: 'photo' | 'thermal';
  metadata: PhotoMetadata;
}

export interface PhotoMetadata {
  width?: number;
  height?: number;
  format: string;
  source: 'camera' | 'gallery' | 'import';
  deviceInfo?: string;
  notes?: string;
}

class CameraService {
  private isNative: boolean;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const cameraPermission = await Camera.checkPermissions();
      
      if (cameraPermission.camera !== 'granted') {
        const result = await Camera.requestPermissions({ permissions: ['camera', 'photos'] });
        if (result.camera !== 'granted') {
          return false;
        }
      }

      if (this.isNative) {
        const locationPermission = await Geolocation.checkPermissions();
        if (locationPermission.location !== 'granted') {
          await Geolocation.requestPermissions();
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return false;
    }
  }

  async capturePhoto(options?: {
    quality?: number;
    includeLocation?: boolean;
    source?: 'camera' | 'gallery';
  }): Promise<CapturedPhoto | null> {
    const { quality = 90, includeLocation = true, source = 'camera' } = options || {};

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error('Camera permissions not granted');
      }

      const photo = await Camera.getPhoto({
        quality,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: source === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        width: 2048,
        height: 2048,
        correctOrientation: true,
        saveToGallery: false,
      });

      let latitude: number | undefined;
      let longitude: number | undefined;

      if (includeLocation && this.isNative) {
        try {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (locationError) {
          console.warn('Failed to get location:', locationError);
        }
      } else if (includeLocation && !this.isNative) {
        try {
          const position = await this.getWebLocation();
          latitude = position.latitude;
          longitude = position.longitude;
        } catch (locationError) {
          console.warn('Failed to get web location:', locationError);
        }
      }

      const capturedPhoto: CapturedPhoto = {
        id: this.generateId(),
        dataUrl: photo.dataUrl!,
        timestamp: new Date().toISOString(),
        latitude,
        longitude,
        type: 'photo',
        metadata: {
          format: photo.format,
          source: source === 'camera' ? 'camera' : 'gallery',
        },
      };

      if (this.isNative) {
        const savedPath = await this.saveToFileSystem(capturedPhoto);
        capturedPhoto.filePath = savedPath;
      }

      return capturedPhoto;
    } catch (error) {
      console.error('Failed to capture photo:', error);
      return null;
    }
  }

  async captureFromGallery(): Promise<CapturedPhoto | null> {
    return this.capturePhoto({ source: 'gallery' });
  }

  async importThermalImage(file?: File): Promise<CapturedPhoto | null> {
    try {
      let dataUrl: string;
      let filename: string;

      if (file) {
        dataUrl = await this.fileToDataUrl(file);
        filename = file.name;
      } else {
        const result = await this.pickFileFromSystem();
        if (!result) return null;
        dataUrl = result.dataUrl;
        filename = result.filename;
      }

      let latitude: number | undefined;
      let longitude: number | undefined;

      if (this.isNative) {
        try {
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 10000,
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (error) {
          console.warn('Failed to get location for thermal image:', error);
        }
      }

      const isThermal = this.detectThermalImage(filename, dataUrl);

      const capturedPhoto: CapturedPhoto = {
        id: this.generateId(),
        dataUrl,
        timestamp: new Date().toISOString(),
        latitude,
        longitude,
        type: isThermal ? 'thermal' : 'photo',
        metadata: {
          format: this.getFileExtension(filename),
          source: 'import',
          notes: isThermal ? 'Thermal image imported' : undefined,
        },
      };

      if (this.isNative) {
        const savedPath = await this.saveToFileSystem(capturedPhoto);
        capturedPhoto.filePath = savedPath;
      }

      return capturedPhoto;
    } catch (error) {
      console.error('Failed to import thermal image:', error);
      return null;
    }
  }

  private detectThermalImage(filename: string, _dataUrl: string): boolean {
    const thermalPatterns = [
      /flir/i,
      /thermal/i,
      /ir_/i,
      /_ir\./i,
      /radiometric/i,
      /seek/i,
      /testo/i,
    ];

    return thermalPatterns.some(pattern => pattern.test(filename));
  }

  private async pickFileFromSystem(): Promise<{ dataUrl: string; filename: string } | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,.jpg,.jpeg,.png,.tiff,.tif,.radiometric';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
          const dataUrl = await this.fileToDataUrl(file);
          resolve({ dataUrl, filename: file.name });
        } else {
          resolve(null);
        }
      };

      input.click();
    });
  }

  private async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private async saveToFileSystem(photo: CapturedPhoto): Promise<string> {
    try {
      const filename = `winnstorm_${photo.type}_${photo.id}.jpg`;
      const base64Data = photo.dataUrl.split(',')[1];

      await Filesystem.writeFile({
        path: `WinnStorm/Evidence/${filename}`,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });

      return `WinnStorm/Evidence/${filename}`;
    } catch (error) {
      console.error('Failed to save photo to filesystem:', error);
      return '';
    }
  }

  private async getWebLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'jpg';
  }

  async getPhotoFromPath(filePath: string): Promise<string | null> {
    if (!this.isNative) return null;

    try {
      const result = await Filesystem.readFile({
        path: filePath,
        directory: Directory.Documents,
      });

      return `data:image/jpeg;base64,${result.data}`;
    } catch (error) {
      console.error('Failed to read photo from path:', error);
      return null;
    }
  }

  async deletePhoto(filePath: string): Promise<boolean> {
    if (!this.isNative || !filePath) return true;

    try {
      await Filesystem.deleteFile({
        path: filePath,
        directory: Directory.Documents,
      });
      return true;
    } catch (error) {
      console.error('Failed to delete photo:', error);
      return false;
    }
  }
}

export const cameraService = new CameraService();
