import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { InspectionCalendar } from '@/components/inspection-calendar';
import { PropertyMap, PropertyListItem } from '@/components/property-map';
import { schedulingService } from '@/lib/scheduling-service';
import { 
  Calendar, 
  MapPin, 
  Plus, 
  Route, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  Navigation,
  RefreshCw
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';
import type { Property, ScheduledInspection } from '@shared/schema';

interface ScheduleWithProperty extends ScheduledInspection {
  property?: Property;
}

interface PropertyWithSchedule extends Property {
  scheduledInspection?: ScheduledInspection;
  latitude?: number;
  longitude?: number;
}

export default function SchedulePage() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithSchedule | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogDate, setAddDialogDate] = useState<Date>(new Date());
  const [showRouteOptimization, setShowRouteOptimization] = useState(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'map'>('calendar');

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });

  const { data: scheduleData, isLoading: scheduleLoading } = useQuery<ScheduledInspection[]>({
    queryKey: ['/api/schedule', weekStart.toISOString(), weekEnd.toISOString()],
  });

  const { data: propertiesData, isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/schedule', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/schedule'] });
      setShowAddDialog(false);
      toast({
        title: 'Inspection Scheduled',
        description: 'The inspection has been added to your schedule.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to schedule inspection. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const inspectionsWithProperties: ScheduleWithProperty[] = (scheduleData || []).map(schedule => ({
    ...schedule,
    property: propertiesData?.find(p => p.id === schedule.propertyId),
  }));

  const propertiesWithSchedules: PropertyWithSchedule[] = (propertiesData || []).map(property => {
    const schedule = scheduleData?.find(s => s.propertyId === property.id);
    return {
      ...property,
      scheduledInspection: schedule,
    };
  });

  const todaysInspections = inspectionsWithProperties.filter(i => {
    const scheduleDate = new Date(i.scheduledDate);
    const today = new Date();
    return scheduleDate.toDateString() === today.toDateString();
  });

  const optimizedRoute = showRouteOptimization
    ? schedulingService.optimizeRoute(propertiesWithSchedules.filter(p => p.scheduledInspection))
    : null;

  const handleAddInspection = (date: Date) => {
    setAddDialogDate(date);
    setShowAddDialog(true);
  };

  const handleInspectionClick = (inspection: ScheduleWithProperty) => {
    const property = propertiesWithSchedules.find(p => p.id === inspection.propertyId);
    if (property) {
      setSelectedProperty(property);
    }
  };

  return (
    <>
      <Helmet>
        <title>Schedule - WinnStorm™</title>
        <meta name="description" content="Manage your inspection schedule with multi-property scheduling and route optimization." />
      </Helmet>

      <div className="min-h-screen bg-[#121212] pb-safe">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-montserrat font-bold text-white uppercase tracking-wide">
                Inspection Schedule
              </h1>
              <p className="text-white/60 mt-1">
                Manage your inspections and optimize routes for field work
              </p>
            </div>
            
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="flex bg-white/5 p-1">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className={viewMode === 'calendar' 
                    ? 'bg-[hsl(16,100%,50%)] text-white' 
                    : 'text-white/60 hover:text-white'}
                  data-testid="view-calendar"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Calendar
                </Button>
                <Button
                  variant={viewMode === 'map' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('map')}
                  className={viewMode === 'map' 
                    ? 'bg-[hsl(16,100%,50%)] text-white' 
                    : 'text-white/60 hover:text-white'}
                  data-testid="view-map"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Map
                </Button>
              </div>
              
              <Button
                onClick={() => setShowAddDialog(true)}
                className="bg-[hsl(16,100%,50%)] hover:bg-[hsl(16,100%,45%)] text-white"
                data-testid="add-inspection-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Schedule
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {viewMode === 'calendar' ? (
                <InspectionCalendar
                  inspections={inspectionsWithProperties}
                  isLoading={scheduleLoading}
                  selectedDate={selectedDate}
                  onDateSelect={setSelectedDate}
                  onInspectionClick={handleInspectionClick}
                  onAddInspection={handleAddInspection}
                />
              ) : (
                <PropertyMap
                  properties={propertiesWithSchedules.filter(p => p.scheduledInspection)}
                  selectedPropertyId={selectedProperty?.id}
                  onPropertySelect={setSelectedProperty}
                  showRoute={showRouteOptimization}
                />
              )}

              {viewMode === 'map' && (
                <Card className="mt-4 bg-[#1A1A1A] border-white/10">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg font-montserrat text-white">
                        <Route className="w-5 h-5 text-[hsl(16,100%,50%)]" />
                        Route Optimization
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRouteOptimization(!showRouteOptimization)}
                        className="border-white/20 text-white/60 hover:bg-white/10"
                        data-testid="toggle-route"
                      >
                        {showRouteOptimization ? 'Hide Route' : 'Show Route'}
                      </Button>
                    </div>
                  </CardHeader>
                  {showRouteOptimization && optimizedRoute && (
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-white/5">
                          <div className="text-2xl font-bold text-white">{optimizedRoute.stops.length}</div>
                          <div className="text-xs text-white/60">Stops</div>
                        </div>
                        <div className="p-3 bg-white/5">
                          <div className="text-2xl font-bold text-white">{optimizedRoute.totalDistance.toFixed(1)}</div>
                          <div className="text-xs text-white/60">Miles</div>
                        </div>
                        <div className="p-3 bg-white/5">
                          <div className="text-2xl font-bold text-white">{schedulingService.formatDuration(optimizedRoute.totalTravelTime)}</div>
                          <div className="text-xs text-white/60">Travel Time</div>
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Card className="bg-[#1A1A1A] border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg font-montserrat text-white">
                    <Clock className="w-5 h-5 text-[hsl(16,100%,50%)]" />
                    Today's Inspections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {todaysInspections.length > 0 ? (
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {todaysInspections.map((inspection) => (
                          <button
                            key={inspection.id}
                            onClick={() => handleInspectionClick(inspection)}
                            className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                            data-testid={`today-inspection-${inspection.id}`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-white">
                                  {inspection.property?.name || `Property #${inspection.propertyId}`}
                                </h4>
                                <p className="text-sm text-white/60 mt-1">{inspection.scheduledTime || 'TBD'}</p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-white/40" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="text-center py-8 text-white/40">
                      <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No inspections scheduled for today</p>
                      <Button
                        variant="link"
                        onClick={() => handleAddInspection(new Date())}
                        className="mt-2 text-[hsl(16,100%,50%)]"
                        data-testid="add-today-inspection"
                      >
                        Schedule one now
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A] border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg font-montserrat text-white">
                    <MapPin className="w-5 h-5 text-[hsl(16,100%,50%)]" />
                    Properties
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2">
                      {propertiesWithSchedules.map((property, index) => (
                        <PropertyListItem
                          key={property.id}
                          property={property}
                          index={showRouteOptimization ? index : undefined}
                          isSelected={selectedProperty?.id === property.id}
                          onClick={() => setSelectedProperty(property)}
                        />
                      ))}
                      {propertiesWithSchedules.length === 0 && (
                        <div className="text-center py-4 text-white/40">
                          No properties found
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#1A1A1A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="font-montserrat">Schedule Inspection</DialogTitle>
          </DialogHeader>
          <ScheduleForm
            date={addDialogDate}
            properties={propertiesData || []}
            onSubmit={(data) => createScheduleMutation.mutate(data)}
            isLoading={createScheduleMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

interface ScheduleFormProps {
  date: Date;
  properties: Property[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

function ScheduleForm({ date, properties, onSubmit, isLoading }: ScheduleFormProps) {
  const [formData, setFormData] = useState({
    propertyId: '',
    scheduledDate: format(date, 'yyyy-MM-dd'),
    scheduledTime: '09:00',
    estimatedDuration: '60',
    priority: 'normal',
    notes: '',
    accessInstructions: '',
    contactName: '',
    contactPhone: '',
  });

  const timeSlots = schedulingService.getAvailableTimeSlots();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      propertyId: parseInt(formData.propertyId),
      scheduledDate: new Date(formData.scheduledDate),
      scheduledTime: formData.scheduledTime,
      estimatedDuration: parseInt(formData.estimatedDuration),
      priority: formData.priority,
      notes: formData.notes || undefined,
      accessInstructions: formData.accessInstructions || undefined,
      contactName: formData.contactName || undefined,
      contactPhone: formData.contactPhone || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Property</Label>
        <Select
          value={formData.propertyId}
          onValueChange={(value) => setFormData({ ...formData, propertyId: value })}
        >
          <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-property">
            <SelectValue placeholder="Select a property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id.toString()}>
                {property.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date</Label>
          <Input
            type="date"
            value={formData.scheduledDate}
            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
            className="bg-white/5 border-white/10"
            data-testid="input-date"
          />
        </div>
        <div className="space-y-2">
          <Label>Time</Label>
          <Select
            value={formData.scheduledTime}
            onValueChange={(value) => setFormData({ ...formData, scheduledTime: value })}
          >
            <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-time">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeSlots.map((time) => (
                <SelectItem key={time} value={time}>
                  {time}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Duration (minutes)</Label>
          <Select
            value={formData.estimatedDuration}
            onValueChange={(value) => setFormData({ ...formData, estimatedDuration: value })}
          >
            <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 min</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
              <SelectItem value="180">3 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => setFormData({ ...formData, priority: value })}
          >
            <SelectTrigger className="bg-white/5 border-white/10" data-testid="select-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="bg-white/5 border-white/10"
          placeholder="Any additional notes..."
          data-testid="input-notes"
        />
      </div>

      <Button
        type="submit"
        disabled={!formData.propertyId || isLoading}
        className="w-full bg-[hsl(16,100%,50%)] hover:bg-[hsl(16,100%,45%)] text-white"
        data-testid="submit-schedule"
      >
        {isLoading ? 'Scheduling...' : 'Schedule Inspection'}
      </Button>
    </form>
  );
}
