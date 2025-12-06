export interface QualityCheckResult {
  overallScore: number;
  issues: QualityIssue[];
  passed: boolean;
  recommendations: string[];
}

export interface QualityIssue {
  type: 'blur' | 'lighting' | 'framing' | 'resolution' | 'focus' | 'exposure';
  severity: 'minor' | 'moderate' | 'severe';
  description: string;
  suggestion: string;
}

export interface EvidenceWithQuality {
  id: string;
  type: 'photo' | 'thermal' | 'document' | 'voice_memo';
  dataUrl?: string;
  qualityScore?: number;
  qualityIssues?: QualityIssue[];
  isValid?: boolean;
}

class EvidenceQualityService {
  private baseUrl: string = '';

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  async checkQuality(imageDataUrl: string, type: 'photo' | 'thermal' = 'photo'): Promise<QualityCheckResult> {
    try {
      const response = await fetch(`${this.baseUrl}/api/ai/check-quality`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ imageDataUrl, type }),
      });

      if (!response.ok) {
        return this.performClientSideCheck(imageDataUrl, type);
      }

      return await response.json();
    } catch (error) {
      console.warn('Server quality check failed, using client-side:', error);
      return this.performClientSideCheck(imageDataUrl, type);
    }
  }

  private async performClientSideCheck(imageDataUrl: string, type: 'photo' | 'thermal'): Promise<QualityCheckResult> {
    const issues: QualityIssue[] = [];
    let score = 100;

    try {
      const img = await this.loadImage(imageDataUrl);
      
      if (img.width < 800 || img.height < 600) {
        issues.push({
          type: 'resolution',
          severity: 'moderate',
          description: 'Image resolution is lower than recommended',
          suggestion: 'Use higher resolution settings on your camera',
        });
        score -= 15;
      }

      if (img.width < 400 || img.height < 300) {
        issues.push({
          type: 'resolution',
          severity: 'severe',
          description: 'Image resolution is too low for professional reports',
          suggestion: 'Recapture at higher resolution',
        });
        score -= 25;
      }

      const aspectRatio = img.width / img.height;
      if (aspectRatio < 0.5 || aspectRatio > 2) {
        issues.push({
          type: 'framing',
          severity: 'minor',
          description: 'Unusual aspect ratio detected',
          suggestion: 'Check camera orientation settings',
        });
        score -= 5;
      }

      const fileSize = this.estimateFileSize(imageDataUrl);
      if (fileSize < 50000 && type === 'photo') {
        issues.push({
          type: 'exposure',
          severity: 'minor',
          description: 'File size suggests possible compression or low detail',
          suggestion: 'Ensure adequate lighting and higher quality settings',
        });
        score -= 10;
      }

    } catch (error) {
      issues.push({
        type: 'focus',
        severity: 'moderate',
        description: 'Unable to fully analyze image',
        suggestion: 'Ensure image is not corrupted',
      });
      score -= 20;
    }

    const recommendations: string[] = [];
    if (issues.some(i => i.type === 'resolution')) {
      recommendations.push('Consider retaking photos at higher resolution');
    }
    if (issues.some(i => i.type === 'lighting' || i.type === 'exposure')) {
      recommendations.push('Improve lighting conditions for better clarity');
    }
    if (issues.some(i => i.type === 'blur' || i.type === 'focus')) {
      recommendations.push('Hold camera steady and ensure subject is in focus');
    }

    return {
      overallScore: Math.max(0, Math.min(100, score)),
      issues,
      passed: score >= 60,
      recommendations,
    };
  }

  private loadImage(dataUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  private estimateFileSize(dataUrl: string): number {
    const base64Length = dataUrl.split(',')[1]?.length || 0;
    return Math.round((base64Length * 3) / 4);
  }

  async batchCheckQuality(items: EvidenceWithQuality[]): Promise<EvidenceWithQuality[]> {
    const results = await Promise.all(
      items.map(async (item) => {
        if (item.type === 'voice_memo' || !item.dataUrl) {
          return {
            ...item,
            qualityScore: 100,
            qualityIssues: [],
            isValid: true,
          };
        }

        const result = await this.checkQuality(item.dataUrl, item.type as 'photo' | 'thermal');
        return {
          ...item,
          qualityScore: result.overallScore,
          qualityIssues: result.issues,
          isValid: result.passed,
        };
      })
    );

    return results;
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  }

  getScoreBadgeColor(score: number): string {
    if (score >= 80) return 'bg-green-500/20 text-green-500 border-green-500/50';
    if (score >= 60) return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
    return 'bg-red-500/20 text-red-500 border-red-500/50';
  }

  getScoreLabel(score: number): string {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Acceptable';
    if (score >= 60) return 'Fair';
    return 'Poor';
  }

  getSeverityIcon(severity: QualityIssue['severity']): string {
    switch (severity) {
      case 'severe': return '⚠️';
      case 'moderate': return '⚡';
      case 'minor': return 'ℹ️';
      default: return '';
    }
  }

  formatIssueType(type: QualityIssue['type']): string {
    const labels: Record<QualityIssue['type'], string> = {
      blur: 'Motion Blur',
      lighting: 'Lighting Issue',
      framing: 'Framing',
      resolution: 'Resolution',
      focus: 'Focus',
      exposure: 'Exposure',
    };
    return labels[type];
  }
}

export const evidenceQualityService = new EvidenceQualityService();
