import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Edit3, 
  Trash2
} from 'lucide-react';

interface RoofSection {
  id: string;
  number: number;
  type: 'polygon' | 'rectangle' | 'circle';
  coordinates: any[];
  area?: number;
  label: string;
  notes: string;
}

interface GoogleMapsDrawingProps {
  address: string;
  onAddressChange: (address: string) => void;
  roofSections: RoofSection[];
  onSectionsChange: (sections: RoofSection[]) => void;
}

export const GoogleMapsDrawing = memo(function GoogleMapsDrawing({
  address,
  onAddressChange,
  roofSections,
  onSectionsChange
}: GoogleMapsDrawingProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);
  const initializingRef = useRef(false);
  const mountedRef = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    let isCancelled = false;
    
    const initMap = async () => {
      // Guard against double initialization
      if (mapInstanceRef.current || initializingRef.current) {
        if (mapInstanceRef.current) {
          setIsLoading(false);
        }
        return;
      }
      
      initializingRef.current = true;

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        setMapError('Google Maps API key not configured');
        setIsLoading(false);
        initializingRef.current = false;
        return;
      }
      
      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry']
      });

      try {
        await loader.load();
        
        if (isCancelled || !mountedRef.current) return;
        
        const container = mapContainerRef.current;
        if (!container) {
          setIsLoading(false);
          initializingRef.current = false;
          return;
        }

        const google = (window as any).google;
        
        const mapInstance = new google.maps.Map(container, {
          center: { lat: 39.8283, lng: -98.5795 },
          zoom: 4,
          mapTypeId: 'satellite',
          tilt: 0,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: google.maps.ControlPosition.TOP_CENTER,
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
          }
        });

        mapInstanceRef.current = mapInstance;
        geocoderRef.current = new google.maps.Geocoder();
        
        if (isCancelled || !mountedRef.current) return;
        
        setIsLoading(false);
        initializingRef.current = false;
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        if (!isCancelled && mountedRef.current) {
          setMapError('Failed to load Google Maps');
          setIsLoading(false);
        }
        initializingRef.current = false;
      }
    };

    initMap();
    
    return () => {
      isCancelled = true;
      mountedRef.current = false;
    };
  }, []);

  const handleAddressSearch = useCallback(() => {
    if (!geocoderRef.current || !mapInstanceRef.current || !address) return;

    geocoderRef.current.geocode({ address }, (results: any, status: any) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        mapInstanceRef.current.setCenter(location);
        mapInstanceRef.current.setZoom(20);
        
        const marker = new (window as any).google.maps.Marker({
          position: location,
          map: mapInstanceRef.current,
          title: address,
          icon: {
            path: (window as any).google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
            fillColor: '#FF0000',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 8,
            rotation: 180
          }
        });
        overlaysRef.current.push(marker);
      }
    });
  }, [address]);

  const deleteSection = useCallback((sectionId: string) => {
    const updatedSections = roofSections.filter(section => section.id !== sectionId);
    onSectionsChange(updatedSections);
  }, [roofSections, onSectionsChange]);

  const formatArea = (area: number): string => {
    if (area < 1000) {
      return `${area.toFixed(1)} sq ft`;
    } else {
      return `${(area / 10.764).toFixed(1)} sq m`;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            Property Location
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="address">Property Address</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => onAddressChange(e.target.value)}
                placeholder="Enter property address..."
                className="mt-1"
              />
            </div>
            <Button onClick={handleAddressSearch} className="mt-6">Search</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-primary" />
            Property Map View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Search for an address above to view the property on satellite imagery.
          </p>
          
          <div 
            ref={mapContainerRef}
            className="w-full h-96 rounded-lg border border-border relative"
            style={{ minHeight: '400px' }}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading Google Maps...</p>
                </div>
              </div>
            )}
            {mapError && (
              <div className="absolute inset-0 bg-background flex items-center justify-center z-10">
                <div className="text-center p-6">
                  <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">{mapError}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Map functionality requires a Google Maps API key
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {roofSections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Roof Sections ({roofSections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {roofSections.map((section) => (
                <div key={section.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="min-w-[60px]">
                      #{section.number}
                    </Badge>
                    <div>
                      <p className="font-medium">{section.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {section.type.charAt(0).toUpperCase() + section.type.slice(1)}
                        {section.area && ` • ${formatArea(section.area)}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteSection(section.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
