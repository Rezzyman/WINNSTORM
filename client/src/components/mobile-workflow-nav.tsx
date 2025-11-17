import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface MobileWorkflowNavProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onComplete?: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
  stepTitle: string;
}

export function MobileWorkflowNav({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onComplete,
  isFirstStep,
  isLastStep,
  stepTitle
}: MobileWorkflowNavProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t-2 border-primary shadow-lg z-50 md:hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span className="font-medium text-foreground truncate ml-2">
            {stepTitle}
          </span>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        <div className="flex gap-3">
          <Button
            data-testid="button-previous-step"
            onClick={onPrevious}
            disabled={isFirstStep}
            variant="outline"
            size="lg"
            className="flex-1 mobile-nav-btn touch-target"
          >
            <ChevronLeft className="h-5 w-5 mr-1" />
            Previous
          </Button>
          
          {isLastStep ? (
            <Button
              data-testid="button-generate-report"
              onClick={onComplete}
              size="lg"
              className="flex-1 mobile-nav-btn touch-target bg-primary text-primary-foreground font-bold"
            >
              <Check className="h-5 w-5 mr-2" />
              Generate Report
            </Button>
          ) : (
            <Button
              data-testid="button-next-step"
              onClick={onNext}
              size="lg"
              className="flex-1 mobile-nav-btn touch-target bg-primary text-primary-foreground"
            >
              Next
              <ChevronRight className="h-5 w-5 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
