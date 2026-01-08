import ExcelJS from 'exceljs';
import Papa from 'papaparse';

export interface PropertyImportRow {
  name: string;
  address: string;
  city?: string;
  state?: string;
  zipCode?: string;
  buildingType?: string;
  squareFootage?: number;
  yearBuilt?: number;
  roofType?: string;
  roofAge?: number;
  overallCondition?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  notes?: string;
}

export interface ImportValidationResult {
  row: number;
  data: PropertyImportRow;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ImportResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  importedCount: number;
  skippedCount: number;
  errors: { row: number; message: string }[];
}

export interface ColumnMapping {
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

const REQUIRED_FIELDS = ['name', 'address'];

export async function parseExcelFile(buffer: Buffer): Promise<{ headers: string[]; rows: Record<string, any>[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  
  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount === 0) {
    return { headers: [], rows: [] };
  }
  
  const headers: string[] = [];
  const headerRow = worksheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value || '').trim();
  });
  
  const rows: Record<string, any>[] = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, any> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber - 1];
      if (header) {
        obj[header] = cell.value;
      }
    });
    if (Object.values(obj).some(v => v !== undefined && v !== null && v !== '')) {
      rows.push(obj);
    }
  });
  
  return { headers, rows };
}

export function parseCSVFile(content: string): { headers: string[]; rows: Record<string, any>[] } {
  const result = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header: string) => header.trim()
  });
  
  const headers = result.meta.fields || [];
  const rows = result.data as Record<string, any>[];
  
  return { headers, rows };
}

export function autoDetectColumnMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  
  const patterns: Record<keyof ColumnMapping, RegExp[]> = {
    name: [/^name$/i, /property.*name/i, /^property$/i, /^title$/i],
    address: [/^address$/i, /street.*address/i, /^street$/i, /property.*address/i],
    city: [/^city$/i, /^town$/i],
    state: [/^state$/i, /^province$/i, /^st$/i],
    zipCode: [/^zip/i, /postal.*code/i, /^zip.*code$/i],
    buildingType: [/building.*type/i, /property.*type/i, /^type$/i],
    squareFootage: [/sq.*ft/i, /square.*foot/i, /sqft/i, /^size$/i, /^area$/i],
    yearBuilt: [/year.*built/i, /built.*year/i, /construction.*year/i],
    roofType: [/roof.*type/i, /roofing/i],
    roofAge: [/roof.*age/i, /age.*roof/i],
    overallCondition: [/condition/i, /status/i],
    contactName: [/contact.*name/i, /owner.*name/i, /client.*name/i, /^contact$/i, /^owner$/i],
    contactPhone: [/phone/i, /telephone/i, /^tel$/i],
    contactEmail: [/email/i, /e-mail/i],
    notes: [/notes/i, /comments/i, /remarks/i, /description/i]
  };
  
  for (const header of headers) {
    for (const [field, regexList] of Object.entries(patterns)) {
      if (regexList.some(regex => regex.test(header))) {
        if (!mapping[field as keyof ColumnMapping]) {
          mapping[field as keyof ColumnMapping] = header;
        }
        break;
      }
    }
  }
  
  return mapping;
}

export function applyColumnMapping(
  rows: Record<string, any>[],
  mapping: ColumnMapping
): PropertyImportRow[] {
  return rows.map(row => {
    const mapped: PropertyImportRow = {
      name: mapping.name ? String(row[mapping.name] || '').trim() : '',
      address: mapping.address ? String(row[mapping.address] || '').trim() : ''
    };
    
    if (mapping.city) mapped.city = String(row[mapping.city] || '').trim();
    if (mapping.state) mapped.state = String(row[mapping.state] || '').trim();
    if (mapping.zipCode) mapped.zipCode = String(row[mapping.zipCode] || '').trim();
    if (mapping.buildingType) mapped.buildingType = String(row[mapping.buildingType] || '').trim();
    if (mapping.squareFootage) {
      const val = parseFloat(String(row[mapping.squareFootage]).replace(/[^0-9.]/g, ''));
      if (!isNaN(val)) mapped.squareFootage = val;
    }
    if (mapping.yearBuilt) {
      const val = parseInt(String(row[mapping.yearBuilt]).replace(/[^0-9]/g, ''));
      if (!isNaN(val) && val > 1800 && val <= new Date().getFullYear()) mapped.yearBuilt = val;
    }
    if (mapping.roofType) mapped.roofType = String(row[mapping.roofType] || '').trim();
    if (mapping.roofAge) {
      const val = parseInt(String(row[mapping.roofAge]).replace(/[^0-9]/g, ''));
      if (!isNaN(val) && val >= 0 && val <= 100) mapped.roofAge = val;
    }
    if (mapping.overallCondition) {
      const condition = String(row[mapping.overallCondition] || '').toLowerCase().trim();
      if (['excellent', 'good', 'fair', 'poor', 'critical'].includes(condition)) {
        mapped.overallCondition = condition;
      }
    }
    if (mapping.contactName) mapped.contactName = String(row[mapping.contactName] || '').trim();
    if (mapping.contactPhone) mapped.contactPhone = String(row[mapping.contactPhone] || '').trim();
    if (mapping.contactEmail) mapped.contactEmail = String(row[mapping.contactEmail] || '').trim();
    if (mapping.notes) mapped.notes = String(row[mapping.notes] || '').trim();
    
    // Combine address components if individual fields are provided
    if (mapped.city || mapped.state || mapped.zipCode) {
      const addressParts = [mapped.address];
      if (mapped.city) addressParts.push(mapped.city);
      if (mapped.state) addressParts.push(mapped.state);
      if (mapped.zipCode) addressParts.push(mapped.zipCode);
      mapped.address = addressParts.filter(Boolean).join(', ');
    }
    
    return mapped;
  });
}

export function validateImportRows(rows: PropertyImportRow[]): ImportValidationResult[] {
  return rows.map((row, index) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required field validation
    if (!row.name || row.name.length === 0) {
      errors.push('Property name is required');
    }
    if (!row.address || row.address.length === 0) {
      errors.push('Property address is required');
    }
    
    // Data quality warnings
    if (row.name && row.name.length < 3) {
      warnings.push('Property name is very short');
    }
    if (row.address && row.address.length < 10) {
      warnings.push('Address may be incomplete');
    }
    if (row.squareFootage && (row.squareFootage < 100 || row.squareFootage > 10000000)) {
      warnings.push('Square footage seems unusual');
    }
    if (row.yearBuilt && row.yearBuilt > new Date().getFullYear()) {
      warnings.push('Year built is in the future');
    }
    if (row.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.contactEmail)) {
      warnings.push('Email format may be invalid');
    }
    
    return {
      row: index + 1,
      data: row,
      isValid: errors.length === 0,
      errors,
      warnings
    };
  });
}

export function convertToPropertyInsert(
  row: PropertyImportRow,
  userId: number,
  projectId?: number
) {
  return {
    name: row.name,
    address: row.address,
    overallCondition: row.overallCondition,
    userId,
    projectId: projectId || null,
    buildingInfo: {
      buildingType: row.buildingType,
      squareFootage: row.squareFootage,
      yearBuilt: row.yearBuilt,
      contactName: row.contactName,
      contactPhone: row.contactPhone,
      contactEmail: row.contactEmail,
      notes: row.notes
    },
    roofSystemDetails: {
      roofType: row.roofType,
      roofAge: row.roofAge
    }
  };
}
