import { ReactNode } from 'react';
import { LucideIcon, FileQuestion, Building2, Camera, ClipboardList, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  action,
  secondaryAction,
  children,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3">
          {action && (
            <Button onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// Pre-configured empty states for common use cases
export function EmptyPropertiesState({ onAddProperty }: { onAddProperty: () => void }) {
  return (
    <EmptyState
      icon={Building2}
      title="No Properties Yet"
      description="Get started by adding your first property to inspect. You can add properties manually or import them in bulk."
      action={{
        label: "Add Property",
        onClick: onAddProperty,
      }}
    />
  );
}

export function EmptyScansState({ onStartScan }: { onStartScan: () => void }) {
  return (
    <EmptyState
      icon={Camera}
      title="No Scans Yet"
      description="Start a thermal scan to assess the condition of this property. Upload thermal images to detect issues."
      action={{
        label: "Start Scan",
        onClick: onStartScan,
      }}
    />
  );
}

export function EmptyInspectionsState({ onNewInspection }: { onNewInspection: () => void }) {
  return (
    <EmptyState
      icon={ClipboardList}
      title="No Inspections Yet"
      description="Create your first inspection using the Winn Methodology. Our AI assistant will guide you through the process."
      action={{
        label: "Start Inspection",
        onClick: onNewInspection,
      }}
    />
  );
}

export function EmptyClientsState({ onAddClient }: { onAddClient: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="No Clients Yet"
      description="Add your first client to start managing their properties and inspections in one place."
      action={{
        label: "Add Client",
        onClick: onAddClient,
      }}
    />
  );
}

export function EmptySearchResults({ onClearFilters }: { onClearFilters?: () => void }) {
  return (
    <EmptyState
      icon={FileQuestion}
      title="No Results Found"
      description="We couldn't find anything matching your search criteria. Try adjusting your filters or search terms."
      action={onClearFilters ? {
        label: "Clear Filters",
        onClick: onClearFilters,
      } : undefined}
    />
  );
}
