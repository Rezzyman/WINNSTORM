import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase';

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const currentUser = auth.currentUser;
  const headers = new Headers(options.headers);
  
  if (currentUser) {
    try {
      const idToken = await currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${idToken}`);
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });
}

interface ColumnMapping {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  buildingType?: string;
  squareFootage?: string;
  yearBuilt?: string;
  roofType?: string;
  roofAge?: string;
  overallCondition?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

interface ValidationResult {
  row: number;
  data: Record<string, any>;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ImportResult {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errors: { row: number; message: string }[];
}

const MAPPING_FIELDS = [
  { key: 'name', label: 'Property Name', required: true },
  { key: 'address', label: 'Address', required: true },
  { key: 'city', label: 'City', required: false },
  { key: 'state', label: 'State', required: false },
  { key: 'zipCode', label: 'ZIP Code', required: false },
  { key: 'buildingType', label: 'Building Type', required: false },
  { key: 'squareFootage', label: 'Square Footage', required: false },
  { key: 'yearBuilt', label: 'Year Built', required: false },
  { key: 'roofType', label: 'Roof Type', required: false },
  { key: 'roofAge', label: 'Roof Age', required: false },
  { key: 'overallCondition', label: 'Condition', required: false },
  { key: 'contactName', label: 'Contact Name', required: false },
  { key: 'contactPhone', label: 'Contact Phone', required: false },
  { key: 'contactEmail', label: 'Contact Email', required: false },
  { key: 'notes', label: 'Notes', required: false },
];

type ImportStep = 'upload' | 'mapping' | 'validation' | 'importing' | 'complete';

export function PropertyImport({ onComplete }: { onComplete?: () => void }) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [preview, setPreview] = useState<Record<string, any>[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetchWithAuth('/api/properties/import/parse', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to parse file');
      }

      const data = await response.json();
      setHeaders(data.headers);
      setMapping(data.suggestedMapping);
      setPreview(data.preview);
      setStep('mapping');

      toast({
        title: "File Parsed Successfully",
        description: `Found ${data.rowCount} rows with ${data.headers.length} columns`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Parse File",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls'))) {
      handleFileUpload(droppedFile);
    } else {
      toast({
        title: "Invalid File Type",
        description: "Please upload a CSV or Excel file",
        variant: "destructive",
      });
    }
  }, [handleFileUpload, toast]);

  const handleValidate = async () => {
    if (!file) return;
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));

      const response = await fetchWithAuth('/api/properties/import/validate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Validation failed');
      }

      const data = await response.json();
      setValidationResults(data.results);
      setStep('validation');

      toast({
        title: "Validation Complete",
        description: `${data.validRows} valid, ${data.invalidRows} invalid rows`,
      });
    } catch (error: any) {
      toast({
        title: "Validation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setStep('importing');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mapping', JSON.stringify(mapping));

      const response = await fetchWithAuth('/api/properties/import/execute', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Import failed');
      }

      const data = await response.json();
      setImportResult(data);
      setStep('complete');

      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.importedCount} properties`,
      });
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
      setStep('validation');
    } finally {
      setIsLoading(false);
    }
  };

  const updateMapping = (field: string, value: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: value === '__none__' ? undefined : value
    }));
  };

  const resetImport = () => {
    setStep('upload');
    setFile(null);
    setHeaders([]);
    setMapping({});
    setPreview([]);
    setValidationResults([]);
    setImportResult(null);
  };

  const validCount = validationResults.filter(r => r.isValid).length;
  const invalidCount = validationResults.filter(r => !r.isValid).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        {['upload', 'mapping', 'validation', 'complete'].map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step === s || ['upload', 'mapping', 'validation', 'complete'].indexOf(step) > i
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {i + 1}
            </div>
            {i < 3 && (
              <div className={`w-12 h-0.5 ${
                ['upload', 'mapping', 'validation', 'complete'].indexOf(step) > i
                  ? 'bg-primary'
                  : 'bg-muted'
              }`} />
            )}
          </div>
        ))}
      </div>

      {step === 'upload' && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Upload Property List</CardTitle>
            <CardDescription className="text-muted-foreground">
              Upload a CSV or Excel file with your property data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-border rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
              data-testid="file-dropzone"
            >
              {isLoading ? (
                <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin" />
              ) : (
                <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              )}
              <h3 className="text-lg font-medium text-foreground mb-2">
                {isLoading ? 'Processing...' : 'Drop your file here'}
              </h3>
              <p className="text-muted-foreground mb-4">or click to browse</p>
              <p className="text-sm text-muted-foreground">Supports CSV, XLS, XLSX (max 10MB)</p>
              <Input
                id="file-input"
                type="file"
                accept=".csv,.xls,.xlsx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f);
                }}
                data-testid="file-input"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'mapping' && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Map Columns</CardTitle>
            <CardDescription className="text-muted-foreground">
              Match your file columns to property fields
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {MAPPING_FIELDS.map(field => (
                <div key={field.key} className="flex items-center gap-3">
                  <Label className="w-32 text-foreground flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  <Select
                    value={mapping[field.key as keyof ColumnMapping] || '__none__'}
                    onValueChange={(value) => updateMapping(field.key, value)}
                  >
                    <SelectTrigger className="flex-1 bg-muted border-input" data-testid={`mapping-${field.key}`}>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-input">
                      <SelectItem value="__none__">-- Not mapped --</SelectItem>
                      {headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {preview.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-foreground mb-2">Preview (first 5 rows)</h4>
                <ScrollArea className="h-48 rounded border border-border">
                  <div className="p-2 space-y-2">
                    {preview.map((row, i) => (
                      <div key={i} className="bg-muted p-2 rounded text-sm">
                        <span className="font-medium">{row[mapping.name || ''] || 'No name'}</span>
                        <span className="text-muted-foreground ml-2">
                          {row[mapping.address || ''] || 'No address'}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={resetImport} className="border-border" data-testid="btn-reset">
                Start Over
              </Button>
              <Button
                onClick={handleValidate}
                disabled={!mapping.name || !mapping.address || isLoading}
                className="bg-gradient-to-r from-primary to-cyan-500"
                data-testid="btn-validate"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Validate Data
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'validation' && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Validation Results</CardTitle>
            <CardDescription className="text-muted-foreground">
              Review the data before importing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 mb-4">
              <Badge variant="default" className="bg-green-600" data-testid="valid-count">
                <CheckCircle className="w-4 h-4 mr-1" />
                {validCount} Valid
              </Badge>
              <Badge variant="destructive" data-testid="invalid-count">
                <XCircle className="w-4 h-4 mr-1" />
                {invalidCount} Invalid
              </Badge>
            </div>

            <ScrollArea className="h-64 rounded border border-border">
              <div className="p-2 space-y-2">
                {validationResults.map((result) => (
                  <div
                    key={result.row}
                    className={`p-3 rounded ${result.isValid ? 'bg-green-900/20' : 'bg-red-900/20'}`}
                  >
                    <div className="flex items-center gap-2">
                      {result.isValid ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="font-medium text-foreground">Row {result.row}</span>
                      <span className="text-muted-foreground">
                        {result.data.name} - {result.data.address}
                      </span>
                    </div>
                    {result.errors.length > 0 && (
                      <div className="ml-6 mt-1 text-sm text-red-400">
                        {result.errors.join(', ')}
                      </div>
                    )}
                    {result.warnings.length > 0 && (
                      <div className="ml-6 mt-1 text-sm text-yellow-400 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {result.warnings.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setStep('mapping')} className="border-border" data-testid="btn-back">
                Back to Mapping
              </Button>
              <Button
                onClick={handleImport}
                disabled={validCount === 0 || isLoading}
                className="bg-gradient-to-r from-primary to-cyan-500"
                data-testid="btn-import"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Import {validCount} Properties
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'importing' && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Importing Properties</CardTitle>
            <CardDescription className="text-muted-foreground">
              Please wait while we import your properties...
            </CardDescription>
          </CardHeader>
          <CardContent className="py-12 text-center">
            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
            <p className="text-muted-foreground">Processing {validCount} properties...</p>
          </CardContent>
        </Card>
      )}

      {step === 'complete' && importResult && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-500" />
              Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-900/20 p-4 rounded">
                <div className="text-3xl font-bold text-green-500" data-testid="imported-count">
                  {importResult.importedCount}
                </div>
                <div className="text-sm text-muted-foreground">Properties Imported</div>
              </div>
              <div className="bg-red-900/20 p-4 rounded">
                <div className="text-3xl font-bold text-red-500" data-testid="skipped-count">
                  {importResult.skippedCount}
                </div>
                <div className="text-sm text-muted-foreground">Skipped/Errors</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-foreground mb-2">Errors</h4>
                <ScrollArea className="h-32 rounded border border-border">
                  <div className="p-2 space-y-1">
                    {importResult.errors.map((err, i) => (
                      <div key={i} className="text-sm text-red-400">
                        Row {err.row}: {err.message}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={resetImport} className="border-border" data-testid="btn-import-more">
                Import More
              </Button>
              <Button
                onClick={() => onComplete?.()}
                className="bg-gradient-to-r from-primary to-cyan-500"
                data-testid="btn-done"
              >
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default PropertyImport;
