import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileText, CheckCircle, Clock, XCircle, LogOut, Shield } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Helmet } from 'react-helmet-async';

interface TeamSession {
  authenticated: boolean;
  email: string;
  name: string;
}

interface KnowledgeDocument {
  id: number;
  title: string;
  description: string | null;
  documentType: string;
  originalFileName: string;
  fileSize: number;
  approvedAt: string | null;
  createdAt: string;
}

interface KnowledgeCategory {
  id: number;
  name: string;
  description: string | null;
}

export default function TeamPortal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teamName, setTeamName] = useState('');
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [uploadDocType, setUploadDocType] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/team/session', { credentials: 'include' });
      if (response.ok) {
        const data: TeamSession = await response.json();
        setIsAuthenticated(true);
        setTeamName(data.name);
      }
    } catch (error) {
      console.log('Not authenticated');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('/api/team/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setTeamName(data.name);
        toast({ title: 'Welcome!', description: `Logged in as ${data.name}` });
      } else {
        setLoginError(data.message || 'Login failed');
      }
    } catch (error) {
      setLoginError('Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/team/logout', { method: 'POST', credentials: 'include' });
    setIsAuthenticated(false);
    setTeamName('');
  };

  const { data: categories = [] } = useQuery<KnowledgeCategory[]>({
    queryKey: ['/api/team/categories'],
    enabled: isAuthenticated,
  });

  const { data: myDocuments = [], refetch: refetchDocuments } = useQuery<KnowledgeDocument[]>({
    queryKey: ['/api/team/documents'],
    enabled: isAuthenticated,
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle || !uploadDocType) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('title', uploadTitle);
      formData.append('description', uploadDescription);
      formData.append('category', uploadCategory);
      formData.append('documentType', uploadDocType);

      const response = await fetch('/api/team/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast({ title: 'Success', description: 'Document uploaded! Pending admin approval.' });
        setUploadTitle('');
        setUploadDescription('');
        setUploadCategory('');
        setUploadDocType('');
        setUploadFile(null);
        refetchDocuments();
      } else {
        toast({ title: 'Error', description: data.message || 'Upload failed', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Upload failed. Please try again.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusBadge = (doc: KnowledgeDocument) => {
    if (doc.approvedAt) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-900/50 text-green-400 text-xs rounded">
          <CheckCircle className="w-3 h-3" /> Approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-900/50 text-yellow-400 text-xs rounded">
        <Clock className="w-3 h-3" /> Pending Review
      </span>
    );
  };

  if (!isAuthenticated) {
    return (
      <>
        <Helmet>
          <title>Team Knowledge Portal | WinnStorm</title>
        </Helmet>
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-[#2a2a2a] border-[#3a3a3a]">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Shield className="w-12 h-12 text-orange-500" />
              </div>
              <CardTitle className="text-2xl text-white">Team Knowledge Portal</CardTitle>
              <CardDescription className="text-gray-400">
                Upload training materials and documents for Stormy AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                    data-testid="input-team-email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                    data-testid="input-team-password"
                    required
                  />
                </div>
                {loginError && (
                  <p className="text-red-400 text-sm" data-testid="text-login-error">{loginError}</p>
                )}
                <Button
                  type="submit"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={isLoggingIn}
                  data-testid="button-team-login"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Knowledge Upload | WinnStorm</title>
      </Helmet>
      <div className="min-h-screen bg-[#1a1a1a]">
        <header className="bg-[#2a2a2a] border-b border-[#3a3a3a] px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-orange-500" />
              <div>
                <h1 className="text-xl font-bold text-white">Team Knowledge Portal</h1>
                <p className="text-sm text-gray-400">Welcome, {teamName}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-gray-400 hover:text-white"
              data-testid="button-team-logout"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <main className="max-w-6xl mx-auto p-6 space-y-8">
          <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-orange-500" />
                Upload Document
              </CardTitle>
              <CardDescription className="text-gray-400">
                Upload training materials, class transcripts, and documentation for Stormy AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-300">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Class 1 - Thermal Basics"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                      data-testid="input-upload-title"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="docType" className="text-gray-300">Document Type *</Label>
                    <Select value={uploadDocType} onValueChange={setUploadDocType}>
                      <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white" data-testid="select-doc-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a]">
                        <SelectItem value="class_transcript">Class Transcript</SelectItem>
                        <SelectItem value="training_material">Training Material</SelectItem>
                        <SelectItem value="methodology_guide">Methodology Guide</SelectItem>
                        <SelectItem value="field_notes">Field Notes</SelectItem>
                        <SelectItem value="case_study">Case Study</SelectItem>
                        <SelectItem value="reference_document">Reference Document</SelectItem>
                        <SelectItem value="audio_recording">Audio Recording</SelectItem>
                        <SelectItem value="video_recording">Video Recording</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-300">Category</Label>
                  <Select value={uploadCategory} onValueChange={setUploadCategory}>
                    <SelectTrigger className="bg-[#1a1a1a] border-[#3a3a3a] text-white" data-testid="select-category">
                      <SelectValue placeholder="Select category (optional)" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2a2a2a] border-[#3a3a3a]">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-gray-300">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the content..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="bg-[#1a1a1a] border-[#3a3a3a] text-white min-h-[80px]"
                    data-testid="input-upload-description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file" className="text-gray-300">File *</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="bg-[#1a1a1a] border-[#3a3a3a] text-white"
                    accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.xls,.json,.jpg,.jpeg,.png,.gif,.webp,.mp3,.wav,.m4a,.mp4,.webm,.mov"
                    data-testid="input-upload-file"
                    required
                  />
                  <p className="text-xs text-gray-500">
                    Supported: PDF, Word, Excel, Text, Images, Audio, Video (max 200MB)
                  </p>
                </div>
                <Button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700"
                  disabled={isUploading}
                  data-testid="button-upload"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-[#2a2a2a] border-[#3a3a3a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-500" />
                My Uploads
              </CardTitle>
              <CardDescription className="text-gray-400">
                Documents you've uploaded. Admin approval required before Stormy can use them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myDocuments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
              ) : (
                <div className="space-y-3">
                  {myDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-[#3a3a3a]"
                      data-testid={`document-${doc.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <FileText className="w-8 h-8 text-gray-500" />
                        <div>
                          <h4 className="text-white font-medium">{doc.title}</h4>
                          <p className="text-sm text-gray-500">
                            {doc.originalFileName} • {formatFileSize(doc.fileSize)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(doc)}
                        <span className="text-xs text-gray-500">
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
}
