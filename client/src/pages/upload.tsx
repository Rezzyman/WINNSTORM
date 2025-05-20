import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Header, Footer } from '@/components/navbar';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { 
  Input 
} from '@/components/ui/input';
import { 
  Label 
} from '@/components/ui/label';
import { 
  Textarea 
} from '@/components/ui/textarea';
import { 
  Button 
} from '@/components/ui/button';
import {
  ArrowLeft, 
  Upload as UploadIcon, 
  CloudUpload, 
  Check, 
  Image
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { uploadFile } from '@/lib/firebase';
import { queryClient } from '@/lib/queryClient';

interface FileUploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

const UploadPage = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [propertyName, setPropertyName] = useState('');
  const [address, setAddress] = useState('');
  const [scanType, setScanType] = useState<'drone' | 'handheld'>('drone');
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  
  // Mock recent uploads
  const [recentUploads] = useState([
    { id: '1', name: 'thermal_scan_001.jpg', size: '3.2 MB', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { id: '2', name: 'thermal_scan_002.jpg', size: '2.8 MB', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
  ]);

  const uploadMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/properties', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/properties'] });
      window.hideLoading();
      navigate('/dashboard');
      toast({
        title: 'Upload successful',
        description: 'Your thermal scan has been uploaded and analyzed',
      });
    },
    onError: (error) => {
      window.hideLoading();
      toast({
        title: 'Upload failed',
        description: error.message || 'There was an error uploading your scan',
        variant: 'destructive',
      });
    }
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    
    const newFiles = Array.from(e.target.files).map(file => ({
      id: Math.random().toString(36).substring(2, 11),
      file,
      progress: 0,
      status: 'pending' as const
    }));
    
    setFiles([...files, ...newFiles]);
    
    // Reset input value so the same file can be selected again
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files?.length) {
      const newFiles = Array.from(e.dataTransfer.files).map(file => ({
        id: Math.random().toString(36).substring(2, 11),
        file,
        progress: 0,
        status: 'pending' as const
      }));
      
      setFiles([...files, ...newFiles]);
    }
  };

  const handleUpload = async () => {
    if (!propertyName || !address) {
      toast({
        title: 'Missing information',
        description: 'Please provide a property name and address',
        variant: 'destructive',
      });
      return;
    }

    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please upload at least one thermal image',
        variant: 'destructive',
      });
      return;
    }

    // Show loading overlay
    window.showLoading('Analyzing thermal data...', 'Identifying hotspots and moisture infiltration');

    try {
      // Upload files to Firebase Storage first
      const uploadPromises = files.map(async (file) => {
        const path = `scans/${Date.now()}_${file.file.name}`;
        const { downloadURL } = await uploadFile(file.file, path);
        return downloadURL;
      });

      const imageUrls = await Promise.all(uploadPromises);
      
      // Submit property data with image URLs
      const propertyData = {
        name: propertyName,
        address,
        scanType,
        notes,
        imageUrls,
        captureDate: new Date().toISOString()
      };

      uploadMutation.mutate(propertyData);
      
    } catch (error: any) {
      window.hideLoading();
      toast({
        title: 'Upload failed',
        description: error.message || 'There was an error uploading your files',
        variant: 'destructive',
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date: Date) => {
    const diffDays = Math.round((new Date().getTime() - date.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <Header />
      
      <main className="flex-grow pb-20">
        <div className="p-4">
          <div className="flex items-center mb-4">
            <button className="mr-2" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="text-neutral-dark" />
            </button>
            <div>
              <h2 className="text-xl font-semibold text-neutral-darker">Upload Thermal Scan</h2>
              <p className="text-neutral-dark text-sm">Upload thermal imagery for analysis</p>
            </div>
          </div>

          {/* Upload Form */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="mb-6">
                <Label className="block text-neutral-darker text-sm font-medium mb-2">
                  Property Information
                </Label>
                <Input
                  value={propertyName}
                  onChange={(e) => setPropertyName(e.target.value)}
                  className="w-full p-3 border border-neutral-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-3"
                  placeholder="Property Name (e.g. Office Complex)"
                />
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 border border-neutral-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Address"
                />
              </div>

              <div className="mb-6">
                <Label className="block text-neutral-darker text-sm font-medium mb-2">
                  Upload Thermal Images
                </Label>
                {/* Drag and Drop Area */}
                <div
                  className="border-2 border-dashed border-neutral-medium rounded-lg p-8 text-center cursor-pointer hover:bg-neutral-light transition"
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <CloudUpload className="h-12 w-12 text-neutral-dark mx-auto" />
                  <p className="mt-2 text-neutral-darker font-medium">Drag & drop files or click to browse</p>
                  <p className="text-sm text-neutral-dark mt-1">Supports JPEG, PNG and MP4 from FLIR-compatible devices</p>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    className="hidden"
                    multiple
                    accept=".jpg,.jpeg,.png,.mp4"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center p-2 border border-neutral-medium rounded-lg">
                        <Image className="text-neutral-dark mr-3" />
                        <div className="flex-grow">
                          <p className="text-sm font-medium text-neutral-darker">{file.file.name}</p>
                          <p className="text-xs text-neutral-dark">{formatFileSize(file.file.size)}</p>
                        </div>
                        {file.status === 'success' ? (
                          <Check className="text-success" />
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFiles(files.filter(f => f.id !== file.id));
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Options */}
              <div className="mb-6">
                <Label className="block text-neutral-darker text-sm font-medium mb-2">
                  Scan Type
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div 
                    className={`border rounded-lg p-3 flex items-center cursor-pointer ${
                      scanType === 'drone' ? 'border-primary bg-blue-50' : 'border-neutral-medium'
                    }`}
                    onClick={() => setScanType('drone')}
                  >
                    <input
                      type="radio"
                      name="scan-type"
                      id="drone"
                      className="h-4 w-4 text-primary focus:ring-primary"
                      checked={scanType === 'drone'}
                      onChange={() => setScanType('drone')}
                    />
                    <Label htmlFor="drone" className="ml-2 block text-sm text-neutral-darker cursor-pointer">
                      Drone Capture
                    </Label>
                  </div>
                  <div 
                    className={`border rounded-lg p-3 flex items-center cursor-pointer ${
                      scanType === 'handheld' ? 'border-primary bg-blue-50' : 'border-neutral-medium'
                    }`}
                    onClick={() => setScanType('handheld')}
                  >
                    <input
                      type="radio"
                      name="scan-type"
                      id="handheld"
                      className="h-4 w-4 text-primary focus:ring-primary"
                      checked={scanType === 'handheld'}
                      onChange={() => setScanType('handheld')}
                    />
                    <Label htmlFor="handheld" className="ml-2 block text-sm text-neutral-darker cursor-pointer">
                      Handheld Camera
                    </Label>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <Label htmlFor="notes" className="block text-neutral-darker text-sm font-medium mb-2">
                  Additional Notes
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 border border-neutral-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-primary h-24"
                  placeholder="Add any relevant details about the property or scan conditions..."
                />
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary-light text-white font-medium py-3 px-4 rounded-lg transition flex items-center justify-center"
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
              >
                <UploadIcon className="mr-2 h-5 w-5" />
                {uploadMutation.isPending ? 'Uploading...' : 'Upload & Analyze'}
              </Button>
            </CardContent>
          </Card>

          {/* Recently Uploaded */}
          {recentUploads.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-neutral-darker mb-3">Recently Uploaded</h3>
                <div className="space-y-3">
                  {recentUploads.map((item) => (
                    <div key={item.id} className="flex items-center p-2 border border-neutral-medium rounded-lg">
                      <Image className="text-neutral-dark mr-3" />
                      <div className="flex-grow">
                        <p className="text-sm font-medium text-neutral-darker">{item.name}</p>
                        <p className="text-xs text-neutral-dark">{item.size} - Uploaded {formatDate(item.date)}</p>
                      </div>
                      <Check className="text-success" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default UploadPage;
