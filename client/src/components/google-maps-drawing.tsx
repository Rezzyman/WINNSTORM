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
  Trash2,
  Pentagon,
  RotateCcw,
  Check,
  X
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
  const sectionPolygonsRef = useRef<Map<string, any>>(new Map());
  const currentPolygonRef = useRef<any>(null);
  const currentMarkersRef = useRef<any[]>([]);
  const clickListenerRef = useRef<any>(null);
  const initializingRef = useRef(false);
  const mountedRef = useRef(true);
  const drawingPointsRef = useRef<{lat: number, lng: number}[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [pointCount, setPointCount] = useState(0);

  const removeClickListener = useCallback(() => {
    if (clickListenerRef.current) {
      const google = (window as any).google;
      if (google && google.maps && google.maps.event) {
        google.maps.event.removeListener(clickListenerRef.current);
      }
      clickListenerRef.current = null;
    }
  }, []);

  const cleanupCurrentDrawing = useCallback(() => {
    removeClickListener();
    
    if (currentPolygonRef.current) {
      currentPolygonRef.current.setMap(null);
      currentPolygonRef.current = null;
    }
    currentMarkersRef.current.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') {
        marker.setMap(null);
      }
    });
    currentMarkersRef.current = [];
    drawingPointsRef.current = [];
    setPointCount(0);
    setIsDrawing(false);
  }, [removeClickListener]);

  const cleanupAllOverlays = useCallback(() => {
    removeClickListener();
    
    overlaysRef.current.forEach(overlay => {
      if (overlay && typeof overlay.setMap === 'function') {
        overlay.setMap(null);
      }
    });
    overlaysRef.current = [];
    
    sectionPolygonsRef.current.forEach(polygon => {
      if (polygon && typeof polygon.setMap === 'function') {
        polygon.setMap(null);
      }
    });
    sectionPolygonsRef.current.clear();
    
    cleanupCurrentDrawing();
  }, [cleanupCurrentDrawing, removeClickListener]);

  useEffect(() => {
    mountedRef.current = true;
    let isCancelled = false;
    
    const initMap = async () => {
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
      cleanupAllOverlays();
      mapInstanceRef.current = null;
      geocoderRef.current = null;
    };
  }, [cleanupAllOverlays]);

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

  const startDrawing = useCallback(() => {
    if (!mapInstanceRef.current) return;
    
    cleanupCurrentDrawing();
    setIsDrawing(true);
    drawingPointsRef.current = [];
    setPointCount(0);
    
    const google = (window as any).google;
    const map = mapInstanceRef.current;
    
    clickListenerRef.current = map.addListener('click', (e: any) => {
      if (!mountedRef.current) return;
      
      const latLng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      drawingPointsRef.current.push(latLng);
      setPointCount(drawingPointsRef.current.length);
      
      const marker = new google.maps.Marker({
        position: latLng,
        map: map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: '#FF6600',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          scale: 6
        }
      });
      currentMarkersRef.current.push(marker);
      
      if (currentPolygonRef.current) {
        currentPolygonRef.current.setMap(null);
      }
      
      if (drawingPointsRef.current.length >= 2) {
        const polygon = new google.maps.Polygon({
          paths: drawingPointsRef.current,
          strokeColor: '#FF6600',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#FF6600',
          fillOpacity: 0.35,
          map: map,
          editable: false
        });
        currentPolygonRef.current = polygon;
      }
    });
  }, [cleanupCurrentDrawing]);

  const completeDrawing = useCallback(() => {
    if (drawingPointsRef.current.length < 3) {
      cleanupCurrentDrawing();
      return;
    }
    
    removeClickListener();
    
    const google = (window as any).google;
    
    let area = 0;
    if (currentPolygonRef.current) {
      area = google.maps.geometry.spherical.computeArea(currentPolygonRef.current.getPath());
      area = area * 10.764;
    }
    
    const sectionId = `section-${Date.now()}`;
    const newSection: RoofSection = {
      id: sectionId,
      number: roofSections.length + 1,
      type: 'polygon',
      coordinates: [...drawingPointsRef.current],
      area: area,
      label: `Section ${roofSections.length + 1}`,
      notes: ''
    };
    
    if (currentPolygonRef.current) {
      currentPolygonRef.current.setOptions({
        strokeColor: '#4CAF50',
        fillColor: '#4CAF50',
        editable: false
      });
      sectionPolygonsRef.current.set(sectionId, currentPolygonRef.current);
      currentPolygonRef.current = null;
    }
    
    currentMarkersRef.current.forEach(marker => marker.setMap(null));
    currentMarkersRef.current = [];
    
    onSectionsChange([...roofSections, newSection]);
    drawingPointsRef.current = [];
    setPointCount(0);
    setIsDrawing(false);
  }, [roofSections, onSectionsChange, cleanupCurrentDrawing, removeClickListener]);

  const cancelDrawing = useCallback(() => {
    cleanupCurrentDrawing();
  }, [cleanupCurrentDrawing]);

  const deleteSection = useCallback((sectionId: string) => {
    const polygon = sectionPolygonsRef.current.get(sectionId);
    if (polygon && typeof polygon.setMap === 'function') {
      polygon.setMap(null);
    }
    sectionPolygonsRef.current.delete(sectionId);
    
    const updatedSections = roofSections.filter(section => section.id !== sectionId);
    onSectionsChange(updatedSections);
  }, [roofSections, onSectionsChange]);

  const clearAllSections = useCallback(() => {
    cleanupAllOverlays();
    onSectionsChange([]);
  }, [cleanupAllOverlays, onSectionsChange]);

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
                data-testid="input-address"
              />
            </div>
            <Button onClick={handleAddressSearch} className="mt-6" data-testid="button-search-address">Search</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              Roof Section Drawing
            </span>
            <div className="flex gap-2">
              {!isDrawing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={startDrawing}
                    disabled={isLoading || !!mapError}
                    data-testid="button-start-drawing"
                  >
                    <Pentagon className="h-4 w-4 mr-1" />
                    Draw Section
                  </Button>
                  {roofSections.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllSections}
                      data-testid="button-clear-all"
                    >
                      <RotateCcw className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={completeDrawing}
                    disabled={pointCount < 3}
                    data-testid="button-complete-drawing"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Complete ({pointCount} points)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={cancelDrawing}
                    data-testid="button-cancel-drawing"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isDrawing && (
            <div className="p-3 mb-4 bg-primary/10 border border-primary/30 rounded-lg">
              <p className="text-sm text-primary font-medium">
                Click on the map to add points. Add at least 3 points to create a roof section, then click "Complete".
              </p>
            </div>
          )}
          
          <div 
            ref={mapContainerRef}
            className={`w-full h-96 rounded-lg border relative ${isDrawing ? 'border-primary cursor-crosshair' : 'border-border'}`}
            style={{ minHeight: '400px' }}
            data-testid="map-container"
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
                <div 
                  key={section.id} 
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                  data-testid={`card-section-${section.id}`}
                >
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
                    data-testid={`button-delete-section-${section.id}`}
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
