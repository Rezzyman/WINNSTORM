import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';
import type { Property, ScheduledInspection } from '@shared/schema';

interface PropertyWithSchedule extends Property {
  scheduledInspection?: ScheduledInspection;
  latitude?: number;
  longitude?: number;
}

interface PropertyMapProps {
  properties: PropertyWithSchedule[];
  selectedPropertyId?: number;
  onPropertySelect?: (property: PropertyWithSchedule) => void;
  showRoute?: boolean;
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
}

export function PropertyMap({
  properties,
  selectedPropertyId,
  onPropertySelect,
  showRoute = false,
  centerLat = 39.8283,
  centerLng = -98.5795,
  zoom = 4,
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const directionsRendererRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      if (!mapRef.current) return;
      
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setMapError('Google Maps API key not configured');
        setIsLoading(false);
        return;
      }

      try {
        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry'],
        });

        await loader.load();

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: centerLat, lng: centerLng },
          zoom,
          mapTypeId: 'roadmap',
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
            { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
            { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#746855' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
          ],
        });

        mapInstanceRef.current = map;
        
        const directionsRenderer = new google.maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#FF6B00',
            strokeWeight: 4,
            strokeOpacity: 0.8,
          },
        });
        directionsRendererRef.current = directionsRenderer;

        setIsLoading(false);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        setMapError('Failed to load map');
        setIsLoading(false);
      }
    };

    initMap();
  }, [centerLat, centerLng, zoom]);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasValidCoordinates = false;

    properties.forEach((property, index) => {
      if (!property.latitude || !property.longitude) return;

      hasValidCoordinates = true;
      const position = { lat: property.latitude, lng: property.longitude };
      bounds.extend(position);

      const isSelected = property.id === selectedPropertyId;
      const hasSchedule = !!property.scheduledInspection;
      const status = property.scheduledInspection?.status;

      let iconColor = '#FF6B00';
      if (status === 'completed') iconColor = '#22C55E';
      else if (status === 'in_progress') iconColor = '#3B82F6';
      else if (status === 'cancelled') iconColor = '#EF4444';

      const marker = new google.maps.Marker({
        position,
        map: mapInstanceRef.current!,
        title: property.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: iconColor,
          fillOpacity: isSelected ? 1 : 0.8,
          strokeColor: isSelected ? '#FFFFFF' : iconColor,
          strokeWeight: isSelected ? 3 : 1,
          scale: isSelected ? 12 : 10,
        },
        label: showRoute ? {
          text: (index + 1).toString(),
          color: '#FFFFFF',
          fontSize: '11px',
          fontWeight: 'bold',
        } : undefined,
        zIndex: isSelected ? 1000 : index,
      });

      const infoContent = `
        <div style="color: #1A1A1A; padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 4px 0; font-weight: bold;">${property.name}</h3>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #666;">${property.address}</p>
          ${hasSchedule ? `
            <div style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; background: ${iconColor};"></span>
              <span>${status}</span>
            </div>
          ` : ''}
        </div>
      `;

      const infoWindow = new google.maps.InfoWindow({ content: infoContent });

      marker.addListener('click', () => {
        if (onPropertySelect) {
          onPropertySelect(property);
        }
        infoWindow.open(mapInstanceRef.current!, marker);
      });

      markersRef.current.push(marker);
    });

    if (hasValidCoordinates && properties.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
    } else if (hasValidCoordinates && properties.length === 1) {
      const prop = properties.find(p => p.latitude && p.longitude);
      if (prop) {
        mapInstanceRef.current.setCenter({ lat: prop.latitude!, lng: prop.longitude! });
        mapInstanceRef.current.setZoom(15);
      }
    }
  }, [properties, selectedPropertyId, onPropertySelect, showRoute]);

  useEffect(() => {
    if (!showRoute || !mapInstanceRef.current || !directionsRendererRef.current) return;

    const propertiesWithCoords = properties.filter(p => p.latitude && p.longitude);
    if (propertiesWithCoords.length < 2) {
      directionsRendererRef.current.setDirections({ routes: [] } as any);
      return;
    }

    const directionsService = new google.maps.DirectionsService();
    const origin = { lat: propertiesWithCoords[0].latitude!, lng: propertiesWithCoords[0].longitude! };
    const destination = { 
      lat: propertiesWithCoords[propertiesWithCoords.length - 1].latitude!, 
      lng: propertiesWithCoords[propertiesWithCoords.length - 1].longitude! 
    };

    const waypoints = propertiesWithCoords.slice(1, -1).map(p => ({
      location: { lat: p.latitude!, lng: p.longitude! },
      stopover: true,
    }));

    directionsService.route(
      {
        origin,
        destination,
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRendererRef.current?.setDirections(result);
        }
      }
    );
  }, [properties, showRoute]);

  if (mapError) {
    return (
      <Card className="bg-[#1A1A1A] border-white/10">
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center text-white/60">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
            <p>{mapError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1A1A1A] border-white/10 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-montserrat text-white">
          <MapPin className="w-5 h-5 text-[hsl(16,100%,50%)]" />
          Property Locations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A1A] z-10">
              <div className="animate-spin w-8 h-8 border-2 border-[hsl(16,100%,50%)] border-t-transparent rounded-full" />
            </div>
          )}
          <div 
            ref={mapRef} 
            className="w-full h-[400px]"
            data-testid="property-map"
          />
        </div>
        
        {showRoute && properties.length > 1 && (
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-sm text-white/80">
              <Navigation className="w-4 h-4 text-[hsl(16,100%,50%)]" />
              <span>Optimized route: {properties.length} stops</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PropertyListItemProps {
  property: PropertyWithSchedule;
  index?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function PropertyListItem({ property, index, isSelected, onClick }: PropertyListItemProps) {
  const status = property.scheduledInspection?.status;
  
  const getStatusBadge = () => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/50"><CheckCircle2 className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'scheduled':
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50"><Calendar className="w-3 h-3 mr-1" />Scheduled</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/50"><AlertTriangle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return null;
    }
  };

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 border transition-colors ${
        isSelected 
          ? 'bg-[hsl(16,100%,50%)]/10 border-[hsl(16,100%,50%)]/50' 
          : 'bg-white/5 border-white/10 hover:bg-white/10'
      }`}
      data-testid={`property-item-${property.id}`}
    >
      <div className="flex items-start gap-3">
        {index !== undefined && (
          <div className="flex-shrink-0 w-6 h-6 bg-[hsl(16,100%,50%)] text-white text-xs font-bold flex items-center justify-center">
            {index + 1}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-white truncate">{property.name}</h4>
          <p className="text-sm text-white/60 truncate">{property.address}</p>
          {property.scheduledInspection && (
            <div className="mt-2 flex items-center gap-2">
              {getStatusBadge()}
              {property.scheduledInspection.scheduledTime && (
                <span className="text-xs text-white/40">
                  {property.scheduledInspection.scheduledTime}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}
