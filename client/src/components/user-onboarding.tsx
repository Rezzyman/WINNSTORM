import { useState } from 'react';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CloudUpload, GraduationCap, FileText, CheckCircle, ChevronRight } from 'lucide-react';

interface OnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
  userEmail: string;
}

const ONBOARDING_STEPS = [
  {
    title: 'Welcome to WinnStorm™',
    description: 'Your professional damage assessment platform using the proven Winn Methodology.',
    icon: CheckCircle,
    color: 'text-primary',
  },
  {
    title: 'Upload Your First Scan',
    description: 'Start by uploading thermal imagery of a property for comprehensive analysis.',
    icon: CloudUpload,
    color: 'text-cyan-500',
    action: {
      label: 'Upload Scan',
      path: '/upload',
    },
  },
  {
    title: 'Get Certified',
    description: 'Access our training portal to earn your WinnStorm™ certification and advance your career.',
    icon: GraduationCap,
    color: 'text-blue-500',
    action: {
      label: 'Start Training',
      path: '/training',
    },
  },
  {
    title: 'Generate Winn Reports',
    description: 'Create comprehensive damage assessment reports trusted by insurance professionals.',
    icon: FileText,
    color: 'text-primary',
  },
];

export function UserOnboarding({ isOpen, onComplete, userEmail }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [, navigate] = useLocation();
  
  const currentStepData = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleActionClick = (path: string) => {
    onComplete();
    navigate(path);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <img src="/winnstorm-logo.png" alt="WinnStorm" className="h-16" />
          </div>
          <DialogTitle className="text-center text-2xl">
            {currentStepData.title}
          </DialogTitle>
        </DialogHeader>

        <div className="py-6">
          {/* Progress indicator */}
          <div className="flex justify-center gap-2 mb-8">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'w-8 bg-primary'
                    : index < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className={`p-6 rounded-full bg-gradient-to-br from-primary/10 to-cyan-500/10`}>
                <currentStepData.icon className={`h-16 w-16 ${currentStepData.color}`} />
              </div>
            </div>
            <p className="text-lg text-muted-foreground max-w-md mx-auto">
              {currentStepData.description}
            </p>
          </div>

          {/* Quick start cards */}
          {currentStep === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <Card 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleActionClick('/upload')}
                data-testid="onboarding-upload-card"
              >
                <CardContent className="p-6 text-center">
                  <CloudUpload className="h-10 w-10 text-cyan-500 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Upload First Scan</h3>
                  <p className="text-sm text-muted-foreground">
                    Start analyzing thermal imagery
                  </p>
                </CardContent>
              </Card>
              
              <Card 
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleActionClick('/training')}
                data-testid="onboarding-training-card"
              >
                <CardContent className="p-6 text-center">
                  <GraduationCap className="h-10 w-10 text-blue-500 mx-auto mb-3" />
                  <h3 className="font-semibold mb-2">Start Training</h3>
                  <p className="text-sm text-muted-foreground">
                    Get certified in the Winn Methodology
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action button for specific steps */}
          {currentStep > 0 && currentStepData.action && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => handleActionClick(currentStepData.action!.path)}
                className="gap-2"
                size="lg"
                data-testid={`onboarding-action-${currentStep}`}
              >
                {currentStepData.action.label}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleSkip}
            data-testid="onboarding-skip"
          >
            Skip Tutorial
          </Button>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                data-testid="onboarding-back"
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              data-testid="onboarding-next"
            >
              {isLastStep ? "Get Started" : "Next"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
