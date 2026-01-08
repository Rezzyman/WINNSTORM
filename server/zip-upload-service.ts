import AdmZip from 'adm-zip';
import path from 'path';
import fs from 'fs';
import { storage } from './storage';
import { analyzeInspectionImage, ImageAnalysisRequest } from './ai-assistant';

export interface ExtractedImage {
  filename: string;
  originalPath: string;
  mimeType: string;
  size: number;
  base64Data: string;
  category?: string;
}

export interface ZipExtractionResult {
  success: boolean;
  totalFiles: number;
  extractedImages: ExtractedImage[];
  skippedFiles: string[];
  error?: string;
}

export interface ImageAnalysisResult {
  filename: string;
  analysis: {
    damageDetected: boolean;
    damageType?: string;
    severity?: 'minor' | 'moderate' | 'severe';
    affectedComponents?: string[];
    description: string;
    confidence: number;
    recommendations?: string[];
    thermalAnomalies?: {
      detected: boolean;
      hotspots?: number;
      coldspots?: number;
      temperatureVariance?: string;
    };
  };
  error?: string;
}

export interface BulkAnalysisResult {
  sessionId: string;
  totalImages: number;
  processedImages: number;
  results: ImageAnalysisResult[];
  summary: {
    totalDamageDetected: number;
    severityBreakdown: { minor: number; moderate: number; severe: number };
    commonDamageTypes: string[];
    affectedComponentsSummary: string[];
    overallAssessment: string;
  };
  processingTimeMs: number;
}

export interface AnalysisProgressCallback {
  (progress: { current: number; total: number; currentFile: string; status: string }): void;
}

const SUPPORTED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff', '.tif'];

function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return SUPPORTED_IMAGE_EXTENSIONS.includes(ext);
}

function getMimeType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.tiff': 'image/tiff',
    '.tif': 'image/tiff',
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

function categorizeImage(filepath: string): string {
  const lowerPath = filepath.toLowerCase();
  if (lowerPath.includes('thermal') || lowerPath.includes('flir') || lowerPath.includes('ir_')) {
    return 'thermal';
  }
  if (lowerPath.includes('roof') || lowerPath.includes('shingle')) {
    return 'roof';
  }
  if (lowerPath.includes('gutter') || lowerPath.includes('downspout')) {
    return 'gutters';
  }
  if (lowerPath.includes('siding') || lowerPath.includes('exterior')) {
    return 'siding';
  }
  if (lowerPath.includes('window') || lowerPath.includes('glass')) {
    return 'windows';
  }
  if (lowerPath.includes('hvac') || lowerPath.includes('ac_') || lowerPath.includes('condenser')) {
    return 'hvac';
  }
  if (lowerPath.includes('fence') || lowerPath.includes('gate')) {
    return 'fence';
  }
  if (lowerPath.includes('test_square') || lowerPath.includes('testsquare')) {
    return 'test_square';
  }
  if (lowerPath.includes('soft_metal') || lowerPath.includes('vent') || lowerPath.includes('flashing')) {
    return 'soft_metals';
  }
  return 'general';
}

export async function extractImagesFromZip(zipBuffer: Buffer): Promise<ZipExtractionResult> {
  try {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries();
    
    const extractedImages: ExtractedImage[] = [];
    const skippedFiles: string[] = [];
    
    for (const entry of entries) {
      if (entry.isDirectory) continue;
      
      const filename = entry.entryName;
      
      if (filename.startsWith('__MACOSX/') || filename.includes('.DS_Store')) {
        continue;
      }
      
      if (!isImageFile(filename)) {
        skippedFiles.push(filename);
        continue;
      }
      
      const buffer = entry.getData();
      const base64Data = buffer.toString('base64');
      const mimeType = getMimeType(filename);
      
      extractedImages.push({
        filename: path.basename(filename),
        originalPath: filename,
        mimeType,
        size: buffer.length,
        base64Data,
        category: categorizeImage(filename),
      });
    }
    
    return {
      success: true,
      totalFiles: entries.length,
      extractedImages,
      skippedFiles,
    };
  } catch (error) {
    return {
      success: false,
      totalFiles: 0,
      extractedImages: [],
      skippedFiles: [],
      error: error instanceof Error ? error.message : 'Unknown error extracting ZIP',
    };
  }
}

export async function analyzeImageWithAI(
  image: ExtractedImage,
  propertyContext?: string
): Promise<ImageAnalysisResult> {
  try {
    const imageDataUrl = `data:${image.mimeType};base64,${image.base64Data}`;
    
    const imageType: 'photo' | 'thermal' | 'drone' | 'document' = 
      image.category === 'thermal' ? 'thermal' : 'photo';
    
    const analysisRequest: ImageAnalysisRequest = {
      imageUrl: imageDataUrl,
      imageType,
      step: 'terrestrial_walk',
      propertyContext: propertyContext || `Analyzing ${image.category} image: ${image.filename}`,
    };
    
    const aiResponse = await analyzeInspectionImage(analysisRequest);
    
    const responseText = aiResponse.summary.toLowerCase();
    const damageKeywords = ['damage', 'crack', 'dent', 'hole', 'missing', 'broken', 'deteriorat', 'wear', 'impact', 'hail'];
    const damageDetected = damageKeywords.some(keyword => responseText.includes(keyword)) || 
      aiResponse.detectedElements.some(el => el.severity && el.severity !== 'low');
    
    let severity: 'minor' | 'moderate' | 'severe' = 'minor';
    const hasSevere = aiResponse.detectedElements.some(el => el.severity === 'critical' || el.severity === 'high');
    const hasModerate = aiResponse.detectedElements.some(el => el.severity === 'medium');
    if (hasSevere || responseText.includes('severe') || responseText.includes('significant')) {
      severity = 'severe';
    } else if (hasModerate || responseText.includes('moderate')) {
      severity = 'moderate';
    }
    
    const affectedComponents: string[] = aiResponse.detectedElements.map(el => el.type);
    
    let thermalAnomalies = undefined;
    if (image.category === 'thermal') {
      thermalAnomalies = {
        detected: responseText.includes('hotspot') || responseText.includes('cold') || responseText.includes('thermal'),
        hotspots: aiResponse.detectedElements.filter(el => el.description.toLowerCase().includes('hot')).length,
        coldspots: aiResponse.detectedElements.filter(el => el.description.toLowerCase().includes('cold')).length,
        temperatureVariance: 'Detected via AI analysis',
      };
    }
    
    const avgConfidence = aiResponse.detectedElements.length > 0 
      ? aiResponse.detectedElements.reduce((sum, el) => sum + el.confidence, 0) / aiResponse.detectedElements.length
      : 0.5;
    
    return {
      filename: image.filename,
      analysis: {
        damageDetected,
        damageType: damageDetected ? extractDamageType(responseText) : undefined,
        severity: damageDetected ? severity : undefined,
        affectedComponents: affectedComponents.length > 0 ? affectedComponents : undefined,
        description: aiResponse.summary,
        confidence: avgConfidence,
        recommendations: aiResponse.recommendations,
        thermalAnomalies,
      },
    };
  } catch (error) {
    return {
      filename: image.filename,
      analysis: {
        damageDetected: false,
        description: 'Analysis failed',
        confidence: 0,
      },
      error: error instanceof Error ? error.message : 'Unknown error during analysis',
    };
  }
}

function extractDamageType(responseText: string): string {
  if (responseText.includes('hail')) return 'hail damage';
  if (responseText.includes('wind')) return 'wind damage';
  if (responseText.includes('water') || responseText.includes('moisture')) return 'water damage';
  if (responseText.includes('impact')) return 'impact damage';
  if (responseText.includes('wear') || responseText.includes('age')) return 'wear and tear';
  if (responseText.includes('crack')) return 'cracking';
  return 'general damage';
}

export async function analyzeBulkImages(
  images: ExtractedImage[],
  propertyContext?: string,
  onProgress?: AnalysisProgressCallback
): Promise<BulkAnalysisResult> {
  const startTime = Date.now();
  const sessionId = `bulk_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const results: ImageAnalysisResult[] = [];
  const BATCH_SIZE = 3;
  
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    
    const batchPromises = batch.map((image, batchIndex) => {
      if (onProgress) {
        onProgress({
          current: i + batchIndex + 1,
          total: images.length,
          currentFile: image.filename,
          status: 'analyzing',
        });
      }
      return analyzeImageWithAI(image, propertyContext);
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    if (i + BATCH_SIZE < images.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  const damageResults = results.filter(r => r.analysis.damageDetected);
  const severityBreakdown = {
    minor: damageResults.filter(r => r.analysis.severity === 'minor').length,
    moderate: damageResults.filter(r => r.analysis.severity === 'moderate').length,
    severe: damageResults.filter(r => r.analysis.severity === 'severe').length,
  };
  
  const damageTypes = new Set<string>();
  const affectedComponents = new Set<string>();
  
  damageResults.forEach(r => {
    if (r.analysis.damageType) damageTypes.add(r.analysis.damageType);
    r.analysis.affectedComponents?.forEach(c => affectedComponents.add(c));
  });
  
  let overallAssessment = 'No significant damage detected.';
  if (severityBreakdown.severe > 0) {
    overallAssessment = `Severe damage detected in ${severityBreakdown.severe} image(s). Immediate attention recommended.`;
  } else if (severityBreakdown.moderate > 0) {
    overallAssessment = `Moderate damage detected in ${severityBreakdown.moderate} image(s). Further inspection recommended.`;
  } else if (severityBreakdown.minor > 0) {
    overallAssessment = `Minor damage detected in ${severityBreakdown.minor} image(s). Monitor for progression.`;
  }
  
  return {
    sessionId,
    totalImages: images.length,
    processedImages: results.length,
    results,
    summary: {
      totalDamageDetected: damageResults.length,
      severityBreakdown,
      commonDamageTypes: Array.from(damageTypes),
      affectedComponentsSummary: Array.from(affectedComponents),
      overallAssessment,
    },
    processingTimeMs: Date.now() - startTime,
  };
}

export async function generateStormyReportFromAnalysis(
  bulkAnalysis: BulkAnalysisResult,
  propertyAddress: string,
  knowledgeBaseContext: string[]
): Promise<string> {
  const { summary, results } = bulkAnalysis;
  
  const damageFindings = results
    .filter(r => r.analysis.damageDetected)
    .map(r => `- ${r.filename}: ${r.analysis.description} (${r.analysis.severity} severity)`)
    .join('\n');
  
  const prompt = `You are Stormy, the AI assistant for WinnStorm damage assessment. Based on the following bulk image analysis results, generate a professional damage assessment summary following the Winn Methodology.

PROPERTY: ${propertyAddress}

ANALYSIS SUMMARY:
- Total Images Analyzed: ${bulkAnalysis.totalImages}
- Damage Detected: ${summary.totalDamageDetected} images
- Severity Breakdown: Minor: ${summary.severityBreakdown.minor}, Moderate: ${summary.severityBreakdown.moderate}, Severe: ${summary.severityBreakdown.severe}
- Damage Types Found: ${summary.commonDamageTypes.join(', ') || 'None'}
- Affected Components: ${summary.affectedComponentsSummary.join(', ') || 'None'}

DETAILED FINDINGS:
${damageFindings || 'No damage detected in analyzed images.'}

KNOWLEDGE BASE CONTEXT:
${knowledgeBaseContext.join('\n\n')}

Please provide:
1. Executive Summary (2-3 sentences)
2. Key Findings organized by component
3. Recommended Actions
4. Priority Level (Low/Medium/High/Critical)

Format the response in a clear, professional manner suitable for inclusion in a Winn Report.`;

  return prompt;
}
