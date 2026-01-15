import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { ChevronLeft, Camera, MapPin, Calendar, FileText, Share2, MoreVertical, Image, Trash2, AlertTriangle, Building2, User } from 'lucide-react';
import { cn, hapticFeedback, formatDate, formatTime } from '@/lib/utils';
import { getInspectionById, getPhotosForInspection, type DemoInspection, type DemoPhoto } from '@/lib/demo-data';

export default function PropertyPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [property, setProperty] = useState<DemoInspection | null>(null);
  const [photos, setPhotos] = useState<DemoPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'photos' | 'details' | 'report'>('photos');
  const [selectedPhoto, setSelectedPhoto] = useState<DemoPhoto | null>(null);

  useEffect(() => {
    // Use demo data
    setTimeout(() => {
      const inspectionId = parseInt(id || '0');
      const inspection = getInspectionById(inspectionId);
      const inspectionPhotos = getPhotosForInspection(inspectionId);

      setProperty(inspection || null);
      setPhotos(inspectionPhotos);
      setIsLoading(false);
    }, 300);
  }, [id]);

  const handleBack = () => {
    hapticFeedback('light');
    navigate(-1);
  };

  const handleAddPhotos = () => {
    hapticFeedback('medium');
    navigate(`/camera/${id}`);
  };

  const handleGenerateReport = async () => {
    hapticFeedback('medium');
    try {
      const res = await fetch(`/api/reports/generate/${id}`, { method: 'POST' });
      if (res.ok) {
        // Show success feedback
      }
    } catch (err) {
      console.error('Report error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-slate-900 p-8">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <p className="text-white font-semibold text-lg">Property not found</p>
        <button onClick={handleBack} className="mt-4 text-primary-400">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800 pt-safe">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleBack}
            className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{property.address}</h1>
            <p className="text-slate-400 text-sm">
              {property.city}, {property.state} {property.zipCode}
            </p>
          </div>
          <button className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center">
            <MoreVertical className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-4 px-4 pb-3">
          <StatusBadge status={property.status} />
          <span className="text-slate-500 text-sm flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {formatDate(property.createdAt)}
          </span>
          <span className="text-slate-500 text-sm">{photos.length} photos</span>
        </div>

        {/* Tabs */}
        <div className="flex border-t border-slate-700">
          {(['photos', 'details', 'report'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                hapticFeedback('light');
                setActiveTab(tab);
              }}
              className={cn(
                'flex-1 py-3 text-sm font-medium capitalize transition-colors',
                activeTab === tab
                  ? 'text-primary-400 border-b-2 border-primary-400'
                  : 'text-slate-400'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'photos' && (
          <PhotosTab photos={photos} onAddPhotos={handleAddPhotos} onSelectPhoto={setSelectedPhoto} />
        )}
        {activeTab === 'details' && <DetailsTab property={property} />}
        {activeTab === 'report' && <ReportTab property={property} photos={photos} onGenerate={handleGenerateReport} />}
      </div>

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}

function PhotosTab({
  photos,
  onAddPhotos,
  onSelectPhoto,
}: {
  photos: DemoPhoto[];
  onAddPhotos: () => void;
  onSelectPhoto: (photo: DemoPhoto) => void;
}) {
  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-8">
        <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-4">
          <Image className="w-10 h-10 text-slate-600" />
        </div>
        <p className="text-white font-semibold text-lg mb-1">No photos yet</p>
        <p className="text-slate-400 text-sm text-center mb-6">
          Add photos to document the damage
        </p>
        <button
          onClick={onAddPhotos}
          className="bg-primary-500 text-white px-6 py-3 rounded-2xl font-semibold flex items-center gap-2"
        >
          <Camera className="w-5 h-5" />
          Take Photos
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo) => (
          <button
            key={photo.id}
            onClick={() => {
              hapticFeedback('light');
              onSelectPhoto(photo);
            }}
            className="aspect-square bg-slate-800 rounded-xl overflow-hidden relative"
          >
            <img src={photo.url} alt="" className="w-full h-full object-cover" />
            {photo.type && (
              <span className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full capitalize">
                {photo.type}
              </span>
            )}
          </button>
        ))}
        <button
          onClick={onAddPhotos}
          className="aspect-square bg-slate-800 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-slate-600 active:bg-slate-750"
        >
          <Camera className="w-6 h-6 text-slate-500 mb-1" />
          <span className="text-slate-500 text-xs">Add</span>
        </button>
      </div>
    </div>
  );
}

function DetailsTab({ property }: { property: DemoInspection }) {
  return (
    <div className="p-4 space-y-4">
      <DetailCard label="Client" value={property.clientName} icon={User} />
      <DetailCard label="Address" value={`${property.address}\n${property.city}, ${property.state} ${property.zipCode}`} icon={MapPin} />
      <DetailCard label="Property Type" value={property.propertyType === 'commercial' ? 'Commercial' : 'Residential'} icon={Building2} />
      <DetailCard label="Damage Type" value={property.damageType} icon={AlertTriangle} />
      <DetailCard label="Status" value={property.status.replace('_', ' ')} icon={FileText} />
      <DetailCard label="Created" value={`${formatDate(property.createdAt)} at ${formatTime(property.createdAt)}`} icon={Calendar} />
      {property.notes && (
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
          <p className="text-slate-400 text-sm mb-2">Notes</p>
          <p className="text-white whitespace-pre-wrap">{property.notes}</p>
        </div>
      )}
    </div>
  );
}

function DetailCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof MapPin }) {
  return (
    <div className="bg-slate-800 rounded-2xl p-4 flex items-start gap-4 border border-slate-700">
      <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <p className="text-slate-400 text-sm mb-0.5">{label}</p>
        <p className="text-white font-medium whitespace-pre-line capitalize">{value}</p>
      </div>
    </div>
  );
}

function ReportTab({
  property,
  photos,
  onGenerate,
}: {
  property: DemoInspection;
  photos: DemoPhoto[];
  onGenerate: () => void;
}) {
  const canGenerate = photos.length >= 3;

  return (
    <div className="p-4 space-y-4">
      <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700">
        <h3 className="text-white font-semibold text-lg mb-2">Generate Report</h3>
        <p className="text-slate-400 text-sm mb-4">
          Create a comprehensive damage assessment report using the Winn Methodology.
        </p>

        <div className="space-y-3 mb-6">
          <CheckItem checked={true} label="Property information complete" />
          <CheckItem checked={photos.length > 0} label={`Photos captured (${photos.length})`} />
          <CheckItem checked={photos.length >= 3} label="Minimum 3 photos required" />
        </div>

        <button
          onClick={onGenerate}
          disabled={!canGenerate}
          className={cn(
            'w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2',
            canGenerate
              ? 'bg-primary-500 text-white active:bg-primary-600'
              : 'bg-slate-700 text-slate-500'
          )}
        >
          <FileText className="w-5 h-5" />
          Generate Report
        </button>
      </div>

      <button className="w-full bg-slate-800 rounded-2xl p-4 flex items-center gap-4 border border-slate-700 active:bg-slate-750">
        <Share2 className="w-5 h-5 text-slate-400" />
        <span className="text-white font-medium">Share Property</span>
      </button>
    </div>
  );
}

function CheckItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'w-5 h-5 rounded-full flex items-center justify-center',
          checked ? 'bg-green-500' : 'bg-slate-700'
        )}
      >
        {checked && <span className="text-white text-xs">✓</span>}
      </div>
      <span className={checked ? 'text-white' : 'text-slate-500'}>{label}</span>
    </div>
  );
}

function PhotoModal({ photo, onClose }: { photo: DemoPhoto; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black" onClick={onClose}>
      <div className="h-full flex flex-col pt-safe pb-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onClose} className="text-white font-medium">
            Close
          </button>
          <span className="text-slate-400 text-sm capitalize">{photo.type}</span>
          <button className="text-red-400">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <img src={photo.url} alt="" className="max-h-full max-w-full object-contain rounded-lg" />
        </div>
        {photo.analysis && (
          <div className="px-4 pb-4">
            <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-4">
              <p className="text-slate-400 text-sm mb-1">AI Analysis</p>
              <p className="text-white text-sm">{photo.analysis}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' },
    in_progress: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'In Progress' },
    completed: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Completed' },
  };

  const { bg, text, label } = config[status] || config.pending;

  return (
    <span className={cn('text-xs font-semibold px-3 py-1 rounded-full', bg, text)}>
      {label}
    </span>
  );
}
