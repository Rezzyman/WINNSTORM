import type { ScheduledInspection, Property } from '@shared/schema';
import { format, addDays, startOfDay, endOfDay, isSameDay, isAfter, isBefore } from 'date-fns';

export interface ScheduleSlot {
  date: Date;
  time: string;
  available: boolean;
  scheduledInspection?: ScheduledInspection;
}

export interface DaySchedule {
  date: Date;
  slots: ScheduleSlot[];
  totalScheduled: number;
  totalHours: number;
}

export interface WeekSchedule {
  startDate: Date;
  endDate: Date;
  days: DaySchedule[];
  totalInspections: number;
}

export interface PropertyWithLocation extends Property {
  latitude?: number;
  longitude?: number;
  distance?: number;
}

export interface RouteStop {
  property: PropertyWithLocation;
  scheduledInspection?: ScheduledInspection;
  orderIndex: number;
  arrivalTime?: string;
  estimatedDuration: number;
  travelTimeFromPrevious?: number;
  distanceFromPrevious?: number;
}

export interface OptimizedRoute {
  stops: RouteStop[];
  totalDistance: number;
  totalTravelTime: number;
  totalInspectionTime: number;
  estimatedEndTime: string;
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30'
];

class SchedulingService {
  private baseUrl: string = '';

  constructor() {
    this.baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  }

  async getScheduledInspections(
    startDate: Date,
    endDate: Date,
    inspectorId?: number
  ): Promise<ScheduledInspection[]> {
    const params = new URLSearchParams({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });
    if (inspectorId) params.append('inspectorId', inspectorId.toString());

    const response = await fetch(`${this.baseUrl}/api/schedule?${params}`, {
      credentials: 'include',
    });

    if (!response.ok) throw new Error('Failed to fetch schedule');
    return response.json();
  }

  async scheduleInspection(data: {
    propertyId: number;
    scheduledDate: Date;
    scheduledTime?: string;
    estimatedDuration?: number;
    priority?: string;
    notes?: string;
    accessInstructions?: string;
    contactName?: string;
    contactPhone?: string;
  }): Promise<ScheduledInspection> {
    const response = await fetch(`${this.baseUrl}/api/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to schedule inspection');
    return response.json();
  }

  async updateScheduledInspection(
    id: number,
    updates: Partial<ScheduledInspection>
  ): Promise<ScheduledInspection> {
    const response = await fetch(`${this.baseUrl}/api/schedule/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updates),
    });

    if (!response.ok) throw new Error('Failed to update scheduled inspection');
    return response.json();
  }

  async cancelScheduledInspection(id: number, reason: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/schedule/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) throw new Error('Failed to cancel scheduled inspection');
  }

  generateWeekSchedule(
    startDate: Date,
    scheduledInspections: ScheduledInspection[]
  ): WeekSchedule {
    const days: DaySchedule[] = [];
    let totalInspections = 0;

    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i);
      const dayInspections = scheduledInspections.filter(si =>
        isSameDay(new Date(si.scheduledDate), date)
      );

      const slots: ScheduleSlot[] = TIME_SLOTS.map(time => {
        const matchingInspection = dayInspections.find(si => si.scheduledTime === time);
        return {
          date,
          time,
          available: !matchingInspection,
          scheduledInspection: matchingInspection,
        };
      });

      const totalHours = dayInspections.reduce(
        (sum, si) => sum + (si.estimatedDuration || 60) / 60,
        0
      );

      days.push({
        date,
        slots,
        totalScheduled: dayInspections.length,
        totalHours,
      });

      totalInspections += dayInspections.length;
    }

    return {
      startDate,
      endDate: addDays(startDate, 6),
      days,
      totalInspections,
    };
  }

  generateDaySchedule(
    date: Date,
    scheduledInspections: ScheduledInspection[]
  ): DaySchedule {
    const dayInspections = scheduledInspections.filter(si =>
      isSameDay(new Date(si.scheduledDate), date)
    );

    const slots: ScheduleSlot[] = TIME_SLOTS.map(time => {
      const matchingInspection = dayInspections.find(si => si.scheduledTime === time);
      return {
        date,
        time,
        available: !matchingInspection,
        scheduledInspection: matchingInspection,
      };
    });

    const totalHours = dayInspections.reduce(
      (sum, si) => sum + (si.estimatedDuration || 60) / 60,
      0
    );

    return {
      date,
      slots,
      totalScheduled: dayInspections.length,
      totalHours,
    };
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 3959;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  optimizeRoute(
    properties: PropertyWithLocation[],
    startLat?: number,
    startLon?: number
  ): OptimizedRoute {
    if (properties.length === 0) {
      return {
        stops: [],
        totalDistance: 0,
        totalTravelTime: 0,
        totalInspectionTime: 0,
        estimatedEndTime: '',
      };
    }

    const validProperties = properties.filter(p => p.latitude && p.longitude);
    if (validProperties.length === 0) {
      const stops = properties.map((p, i) => ({
        property: p,
        orderIndex: i,
        estimatedDuration: 60,
      }));
      return {
        stops,
        totalDistance: 0,
        totalTravelTime: 0,
        totalInspectionTime: properties.length * 60,
        estimatedEndTime: '',
      };
    }

    const ordered = this.nearestNeighborRoute(validProperties, startLat, startLon);
    
    let totalDistance = 0;
    let totalTravelTime = 0;
    const avgSpeed = 30;

    const stops: RouteStop[] = ordered.map((property, index) => {
      let distanceFromPrevious = 0;
      let travelTimeFromPrevious = 0;

      if (index === 0 && startLat && startLon && property.latitude && property.longitude) {
        distanceFromPrevious = this.calculateDistance(
          startLat, startLon, property.latitude, property.longitude
        );
      } else if (index > 0) {
        const prev = ordered[index - 1];
        if (prev.latitude && prev.longitude && property.latitude && property.longitude) {
          distanceFromPrevious = this.calculateDistance(
            prev.latitude, prev.longitude, property.latitude, property.longitude
          );
        }
      }

      travelTimeFromPrevious = (distanceFromPrevious / avgSpeed) * 60;
      totalDistance += distanceFromPrevious;
      totalTravelTime += travelTimeFromPrevious;

      return {
        property,
        orderIndex: index,
        estimatedDuration: 60,
        distanceFromPrevious: Math.round(distanceFromPrevious * 10) / 10,
        travelTimeFromPrevious: Math.round(travelTimeFromPrevious),
      };
    });

    const totalInspectionTime = stops.length * 60;

    return {
      stops,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalTravelTime: Math.round(totalTravelTime),
      totalInspectionTime,
      estimatedEndTime: '',
    };
  }

  private nearestNeighborRoute(
    properties: PropertyWithLocation[],
    startLat?: number,
    startLon?: number
  ): PropertyWithLocation[] {
    if (properties.length <= 1) return [...properties];

    const remaining = [...properties];
    const route: PropertyWithLocation[] = [];
    
    let currentLat = startLat ?? 0;
    let currentLon = startLon ?? 0;

    if (!startLat || !startLon) {
      const first = remaining.shift()!;
      route.push(first);
      currentLat = first.latitude || 0;
      currentLon = first.longitude || 0;
    }

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const p = remaining[i];
        if (p.latitude && p.longitude) {
          const distance = this.calculateDistance(
            currentLat, currentLon, p.latitude, p.longitude
          );
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestIndex = i;
          }
        }
      }

      const next = remaining.splice(nearestIndex, 1)[0];
      route.push(next);
      currentLat = next.latitude || currentLat;
      currentLon = next.longitude || currentLon;
    }

    return route;
  }

  getAvailableTimeSlots(): string[] {
    return [...TIME_SLOTS];
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'urgent': return 'bg-red-500/20 text-red-500 border-red-500/50';
      case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
      case 'normal': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      case 'low': return 'bg-white/10 text-white/60 border-white/30';
      default: return 'bg-white/10 text-white/60 border-white/30';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-500 border-green-500/50';
      case 'in_progress': return 'bg-blue-500/20 text-blue-500 border-blue-500/50';
      case 'scheduled': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'cancelled': return 'bg-red-500/20 text-red-500 border-red-500/50';
      default: return 'bg-white/10 text-white/60 border-white/30';
    }
  }
}

export const schedulingService = new SchedulingService();
