import type { WinnMethodologyStep } from '@shared/schema';
import { WINN_METHODOLOGY_STEPS } from '@shared/schema';

export interface StepCompleteness {
  step: WinnMethodologyStep;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  score: number;
  photosCount: number;
  requiredPhotos: number;
  voiceMemosCount: number;
  aiValidated: boolean;
  issues: string[];
  completionTime?: number;
}

export interface InspectionCompletenessResult {
  overallScore: number;
  status: 'incomplete' | 'partial' | 'complete' | 'validated';
  stepScores: StepCompleteness[];
  totalPhotos: number;
  totalVoiceMemos: number;
  estimatedReportQuality: 'basic' | 'standard' | 'professional' | 'premium';
  readyForReportGeneration: boolean;
  recommendations: string[];
  stormyMessage: string;
}

export interface InspectionStepData {
  step: WinnMethodologyStep;
  photos: number;
  voiceMemos: number;
  thermalImages: number;
  aiValidated: boolean;
  skipped: boolean;
  skipReason?: string;
  completedAt?: string;
}

const STEP_WEIGHTS: Record<WinnMethodologyStep, number> = {
  weather_verification: 10,
  thermal_imaging: 20,
  terrestrial_walk: 15,
  test_squares: 15,
  soft_metals: 10,
  moisture_testing: 15,
  core_samples: 10,
  report_assembly: 5,
};

const STEP_PHOTO_REQUIREMENTS: Record<WinnMethodologyStep, number> = {
  weather_verification: 0,
  thermal_imaging: 3,
  terrestrial_walk: 4,
  test_squares: 2,
  soft_metals: 2,
  moisture_testing: 2,
  core_samples: 2,
  report_assembly: 0,
};

class InspectionCompletenessService {
  calculateCompleteness(stepData: InspectionStepData[]): InspectionCompletenessResult {
    const stepScores: StepCompleteness[] = [];
    let totalWeight = 0;
    let earnedWeight = 0;
    let totalPhotos = 0;
    let totalVoiceMemos = 0;

    for (const stepName of WINN_METHODOLOGY_STEPS) {
      const data = stepData.find(s => s.step === stepName);
      const requiredPhotos = STEP_PHOTO_REQUIREMENTS[stepName];
      const weight = STEP_WEIGHTS[stepName];
      totalWeight += weight;

      if (!data) {
        stepScores.push({
          step: stepName,
          status: 'not_started',
          score: 0,
          photosCount: 0,
          requiredPhotos,
          voiceMemosCount: 0,
          aiValidated: false,
          issues: ['Step not started'],
        });
        continue;
      }

      if (data.skipped) {
        stepScores.push({
          step: stepName,
          status: 'skipped',
          score: 50,
          photosCount: data.photos,
          requiredPhotos,
          voiceMemosCount: data.voiceMemos,
          aiValidated: false,
          issues: data.skipReason ? [`Skipped: ${data.skipReason}`] : ['Step was skipped'],
        });
        earnedWeight += weight * 0.5;
        continue;
      }

      const issues: string[] = [];
      let stepScore = 0;

      const photoScore = requiredPhotos > 0 
        ? Math.min(100, (data.photos / requiredPhotos) * 100)
        : 100;
      
      if (data.photos < requiredPhotos) {
        issues.push(`Need ${requiredPhotos - data.photos} more photos`);
      }

      const aiBonus = data.aiValidated ? 10 : 0;
      stepScore = Math.min(100, photoScore + aiBonus);

      if (!data.aiValidated && requiredPhotos > 0) {
        issues.push('AI validation recommended');
      }

      const status: StepCompleteness['status'] = 
        stepScore >= 100 ? 'completed' :
        stepScore > 0 ? 'in_progress' : 'not_started';

      stepScores.push({
        step: stepName,
        status,
        score: Math.round(stepScore),
        photosCount: data.photos,
        requiredPhotos,
        voiceMemosCount: data.voiceMemos,
        aiValidated: data.aiValidated,
        issues,
        completionTime: data.completedAt ? Date.parse(data.completedAt) : undefined,
      });

      earnedWeight += weight * (stepScore / 100);
      totalPhotos += data.photos;
      totalVoiceMemos += data.voiceMemos;
    }

    const overallScore = Math.round((earnedWeight / totalWeight) * 100);
    
    const status: InspectionCompletenessResult['status'] = 
      overallScore >= 95 ? 'validated' :
      overallScore >= 75 ? 'complete' :
      overallScore >= 25 ? 'partial' : 'incomplete';

    const estimatedReportQuality: InspectionCompletenessResult['estimatedReportQuality'] =
      overallScore >= 90 && totalPhotos >= 15 ? 'premium' :
      overallScore >= 75 && totalPhotos >= 10 ? 'professional' :
      overallScore >= 50 && totalPhotos >= 5 ? 'standard' : 'basic';

    const recommendations = this.generateRecommendations(stepScores, overallScore);
    const stormyMessage = this.generateStormyMessage(stepScores, overallScore, status);

    return {
      overallScore,
      status,
      stepScores,
      totalPhotos,
      totalVoiceMemos,
      estimatedReportQuality,
      readyForReportGeneration: overallScore >= 70,
      recommendations,
      stormyMessage,
    };
  }

  private generateRecommendations(stepScores: StepCompleteness[], overallScore: number): string[] {
    const recommendations: string[] = [];

    const incompleteSteps = stepScores.filter(s => s.status !== 'completed' && s.status !== 'skipped');
    if (incompleteSteps.length > 0) {
      const stepNames = incompleteSteps.slice(0, 3).map(s => this.formatStepName(s.step));
      recommendations.push(`Complete the following steps: ${stepNames.join(', ')}`);
    }

    const needsPhotos = stepScores.filter(s => s.photosCount < s.requiredPhotos);
    if (needsPhotos.length > 0) {
      const totalNeeded = needsPhotos.reduce((sum, s) => sum + (s.requiredPhotos - s.photosCount), 0);
      recommendations.push(`Capture ${totalNeeded} more photos across ${needsPhotos.length} steps`);
    }

    const needsValidation = stepScores.filter(s => !s.aiValidated && s.status === 'completed');
    if (needsValidation.length > 0) {
      recommendations.push('Request AI validation for completed steps to improve report quality');
    }

    if (overallScore < 50) {
      recommendations.push('Focus on completing thermal imaging and terrestrial walk steps first');
    }

    return recommendations;
  }

  private generateStormyMessage(
    stepScores: StepCompleteness[], 
    overallScore: number,
    status: InspectionCompletenessResult['status']
  ): string {
    if (status === 'validated') {
      return "Outstanding work! This inspection is fully validated and ready for a premium-quality report. You've covered all the bases!";
    }

    if (status === 'complete') {
      return "Great job! The inspection is complete. Consider adding AI validation to a few steps for an even stronger report.";
    }

    if (status === 'partial') {
      const nextStep = stepScores.find(s => s.status !== 'completed' && s.status !== 'skipped');
      if (nextStep) {
        return `Good progress! Let's focus on ${this.formatStepName(nextStep.step)} next. ${nextStep.issues[0] || 'Ready to continue?'}`;
      }
      return "Keep going! You're making solid progress on this inspection.";
    }

    return "Let's get started! Begin with weather verification to establish the storm event timeline.";
  }

  private formatStepName(step: WinnMethodologyStep): string {
    return step
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  }

  getStatusBadgeColor(status: InspectionCompletenessResult['status']): string {
    switch (status) {
      case 'validated': return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'complete': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      case 'partial': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'incomplete': return 'bg-red-500/20 text-red-500 border-red-500/50';
      default: return 'bg-white/10 text-white/60 border-white/30';
    }
  }

  getQualityBadgeColor(quality: InspectionCompletenessResult['estimatedReportQuality']): string {
    switch (quality) {
      case 'premium': return 'bg-purple-500/20 text-purple-500 border-purple-500/50';
      case 'professional': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      case 'standard': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'basic': return 'bg-white/10 text-white/60 border-white/30';
      default: return 'bg-white/10 text-white/60 border-white/30';
    }
  }
}

export const inspectionCompletenessService = new InspectionCompletenessService();
