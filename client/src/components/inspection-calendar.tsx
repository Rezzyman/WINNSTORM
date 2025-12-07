import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, isToday, addWeeks, subWeeks } from 'date-fns';
import type { ScheduledInspection, Property } from '@shared/schema';

interface InspectionWithProperty extends ScheduledInspection {
  property?: Property;
}

interface InspectionCalendarProps {
  inspections: InspectionWithProperty[];
  isLoading?: boolean;
  onDateSelect?: (date: Date) => void;
  onInspectionClick?: (inspection: InspectionWithProperty) => void;
  onAddInspection?: (date: Date) => void;
  selectedDate?: Date;
}

type ViewMode = 'week' | 'day';

export function InspectionCalendar({
  inspections,
  isLoading = false,
  onDateSelect,
  onInspectionClick,
  onAddInspection,
  selectedDate,
}: InspectionCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = useMemo(() => startOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate]);
  const weekEnd = useMemo(() => endOfWeek(currentDate, { weekStartsOn: 0 }), [currentDate]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [weekStart]);

  const getInspectionsForDay = (date: Date) => {
    return inspections.filter(i => isSameDay(new Date(i.scheduledDate), date));
  };

  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToPrevWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const handleDateClick = (date: Date) => {
    if (viewMode === 'week') {
      setCurrentDate(date);
      setViewMode('day');
    }
    onDateSelect?.(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'scheduled': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-white/30';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Badge className="bg-red-500/20 text-red-400 border-red-500/50 text-[10px]">Urgent</Badge>;
      case 'high': return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50 text-[10px]">High</Badge>;
      default: return null;
    }
  };

  return (
    <Card className="bg-[#1A1A1A] border-white/10">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-montserrat text-white">
            <CalendarIcon className="w-5 h-5 text-[hsl(16,100%,50%)]" />
            Inspection Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode(viewMode === 'week' ? 'day' : 'week')}
              className="text-white/60 hover:text-white hover:bg-white/10"
              data-testid="toggle-view-mode"
            >
              {viewMode === 'week' ? 'Day View' : 'Week View'}
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevWeek}
            className="text-white/60 hover:text-white hover:bg-white/10"
            data-testid="prev-week"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-4">
            <h3 className="text-white font-medium">
              {viewMode === 'week' 
                ? `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
                : format(currentDate, 'EEEE, MMMM d, yyyy')
              }
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="text-white/60 border-white/20 hover:bg-white/10"
              data-testid="go-to-today"
            >
              Today
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextWeek}
            className="text-white/60 hover:text-white hover:bg-white/10"
            data-testid="next-week"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[hsl(16,100%,50%)]" />
          </div>
        ) : viewMode === 'week' ? (
          <WeekView
            weekDays={weekDays}
            inspections={inspections}
            selectedDate={selectedDate}
            onDateClick={handleDateClick}
            onInspectionClick={onInspectionClick}
            onAddInspection={onAddInspection}
            getStatusColor={getStatusColor}
            getPriorityBadge={getPriorityBadge}
          />
        ) : (
          <DayView
            date={currentDate}
            inspections={getInspectionsForDay(currentDate)}
            onInspectionClick={onInspectionClick}
            onAddInspection={onAddInspection}
            getStatusColor={getStatusColor}
            getPriorityBadge={getPriorityBadge}
          />
        )}
      </CardContent>
    </Card>
  );
}

interface WeekViewProps {
  weekDays: Date[];
  inspections: InspectionWithProperty[];
  selectedDate?: Date;
  onDateClick: (date: Date) => void;
  onInspectionClick?: (inspection: InspectionWithProperty) => void;
  onAddInspection?: (date: Date) => void;
  getStatusColor: (status: string) => string;
  getPriorityBadge: (priority: string) => JSX.Element | null;
}

function WeekView({
  weekDays,
  inspections,
  selectedDate,
  onDateClick,
  onInspectionClick,
  onAddInspection,
  getStatusColor,
  getPriorityBadge,
}: WeekViewProps) {
  const getInspectionsForDay = (date: Date) => {
    return inspections.filter(i => isSameDay(new Date(i.scheduledDate), date));
  };

  return (
    <div className="grid grid-cols-7 gap-1">
      {weekDays.map((day, i) => {
        const dayInspections = getInspectionsForDay(day);
        const isSelected = selectedDate && isSameDay(day, selectedDate);
        const today = isToday(day);
        
        return (
          <div
            key={i}
            className={`min-h-[120px] p-2 border cursor-pointer transition-colors ${
              isSelected 
                ? 'border-[hsl(16,100%,50%)] bg-[hsl(16,100%,50%)]/10' 
                : today
                  ? 'border-blue-500/50 bg-blue-500/5'
                  : 'border-white/10 hover:bg-white/5'
            }`}
            onClick={() => onDateClick(day)}
            data-testid={`calendar-day-${format(day, 'yyyy-MM-dd')}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm font-medium ${today ? 'text-blue-400' : 'text-white/60'}`}>
                {format(day, 'EEE')}
              </div>
              <div className={`w-6 h-6 flex items-center justify-center text-sm ${
                today 
                  ? 'bg-blue-500 text-white' 
                  : isSelected 
                    ? 'bg-[hsl(16,100%,50%)] text-white' 
                    : 'text-white'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
            
            <div className="space-y-1">
              {dayInspections.slice(0, 3).map((inspection) => (
                <button
                  key={inspection.id}
                  className={`w-full text-left p-1 text-xs ${getStatusColor(inspection.status)} bg-opacity-20 hover:bg-opacity-30 transition-colors truncate`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspectionClick?.(inspection);
                  }}
                  data-testid={`inspection-item-${inspection.id}`}
                >
                  <div className="flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 ${getStatusColor(inspection.status)}`} />
                    <span className="truncate text-white">
                      {inspection.scheduledTime || ''} {inspection.property?.name || `Property #${inspection.propertyId}`}
                    </span>
                  </div>
                </button>
              ))}
              {dayInspections.length > 3 && (
                <div className="text-xs text-white/40 pl-1">
                  +{dayInspections.length - 3} more
                </div>
              )}
              {dayInspections.length === 0 && onAddInspection && (
                <button
                  className="w-full p-1 text-xs text-white/30 hover:text-white/50 flex items-center justify-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddInspection(day);
                  }}
                  data-testid={`add-inspection-${format(day, 'yyyy-MM-dd')}`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface DayViewProps {
  date: Date;
  inspections: InspectionWithProperty[];
  onInspectionClick?: (inspection: InspectionWithProperty) => void;
  onAddInspection?: (date: Date) => void;
  getStatusColor: (status: string) => string;
  getPriorityBadge: (priority: string) => JSX.Element | null;
}

function DayView({
  date,
  inspections,
  onInspectionClick,
  onAddInspection,
  getStatusColor,
  getPriorityBadge,
}: DayViewProps) {
  const sortedInspections = [...inspections].sort((a, b) => {
    if (!a.scheduledTime || !b.scheduledTime) return 0;
    return a.scheduledTime.localeCompare(b.scheduledTime);
  });

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {timeSlots.map((time) => {
          const slotInspections = sortedInspections.filter(i => 
            i.scheduledTime?.startsWith(time.split(':')[0])
          );
          
          return (
            <div key={time} className="flex gap-4">
              <div className="w-16 text-sm text-white/40 py-2">
                {time}
              </div>
              <div className="flex-1 min-h-[60px] border-l border-white/10 pl-4">
                {slotInspections.length > 0 ? (
                  slotInspections.map((inspection) => (
                    <button
                      key={inspection.id}
                      onClick={() => onInspectionClick?.(inspection)}
                      className={`w-full text-left p-3 mb-2 border-l-4 ${
                        inspection.status === 'completed' 
                          ? 'border-l-green-500 bg-green-500/10' 
                          : inspection.status === 'in_progress'
                            ? 'border-l-blue-500 bg-blue-500/10'
                            : 'border-l-yellow-500 bg-yellow-500/10'
                      } hover:bg-white/10 transition-colors`}
                      data-testid={`day-inspection-${inspection.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-white">
                            {inspection.property?.name || `Property #${inspection.propertyId}`}
                          </h4>
                          <div className="flex items-center gap-2 mt-1 text-sm text-white/60">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{inspection.property?.address || 'No address'}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-sm text-white/60">
                            <Clock className="w-3 h-3" />
                            <span>{inspection.scheduledTime || 'TBD'} - {inspection.estimatedDuration || 60}min</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {getPriorityBadge(inspection.priority)}
                          <Badge className={`${
                            inspection.status === 'completed' 
                              ? 'bg-green-500/20 text-green-400' 
                              : inspection.status === 'in_progress'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                          } text-[10px]`}>
                            {inspection.status}
                          </Badge>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <button
                    onClick={() => onAddInspection?.(date)}
                    className="w-full h-[48px] border border-dashed border-white/10 hover:border-white/30 flex items-center justify-center text-white/30 hover:text-white/50 transition-colors"
                    data-testid={`add-inspection-slot-${time}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
