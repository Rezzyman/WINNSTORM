import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

interface EducationalTooltipProps {
  content: string;
  learnMore?: string;
}

export function EducationalTooltip({ content, learnMore }: EducationalTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center touch-target ml-1"
            aria-label="Learn more"
            data-testid="tooltip-help"
          >
            <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-primary transition-colors" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs p-3 bg-popover text-popover-foreground"
        >
          <div className="space-y-2">
            <p className="text-sm font-medium">Why This Matters</p>
            <p className="text-sm">{content}</p>
            {learnMore && (
              <p className="text-xs text-muted-foreground italic border-t pt-2">
                {learnMore}
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
