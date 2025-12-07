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
  Square, 
  Circle, 
  Type,
  RotateCcw 
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

// Store map instances outside React to prevent DOM conflicts
let globalMapInstance: any = null;
let globalDrawingManager: any = null;
let globalGeocoder: any = null;
let globalOverlays: any[] = [];

export const GoogleMapsDrawing = memo(function GoogleMapsDrawing({
  address,
  onAddressChange,
  roofSections,
  onSectionsChange
}: GoogleMapsDrawingProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const initializingRef = useRef(false);
  const mountedRef = useRef(true);
  const sectionCounterRef = useRef(1);
  const roofSectionsRef = useRef<RoofSection[]>(roofSections);
  const onSectionsChangeRef = useRef(onSectionsChange);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [mapReady, setMapReady] = useState(false);

  // Keep refs in sync with props
  useEffect(() => {
    sectionCounterRef.current = roofSections.length + 1;
    roofSectionsRef.current = roofSections;
  }, [roofSections]);
  
  useEffect(() => {
    onSectionsChangeRef.current = onSectionsChange;
  }, [onSectionsChange]);

  useEffect(() => {
    mountedRef.current = true;
    
    const initMap = async () => {
      // Guard against double initialization
      if (globalMapInstance || initializingRef.current) {
        if (globalMapInstance) {
          setIsLoading(false);
          setMapReady(true);
        }
        return;
      }
      
      initializingRef.current = true;
      
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['drawing', 'places', 'geometry']
      });

      try {
        await loader.load();
        
        if (!mountedRef.current) return;
        
        const container = mapContainerRef.current;
        if (!container) {
          setIsLoading(false);
          initializingRef.current = false;
          return;
        }

        const mapInstance = new (window as any).google.maps.Map(container, {
          center: { lat: 39.8283, lng: -98.5795 },
          zoom: 4,
          mapTypeId: 'satellite',
          tilt: 0,
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: (window as any).google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            position: (window as any).google.maps.ControlPosition.TOP_CENTER,
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
          }
        });

        const drawingManagerInstance = new (window as any).google.maps.drawing.DrawingManager({
          drawingMode: null,
          drawingControl: false,
          polygonOptions: {
            fillColor: '#00BFFF',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: '#0080FF',
            clickable: false,
            editable: true,
            zIndex: 1
          },
          rectangleOptions: {
            fillColor: '#32CD32',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: '#228B22',
            clickable: false,
            editable: true,
            zIndex: 1
          },
          circleOptions: {
            fillColor: '#FFD700',
            fillOpacity: 0.3,
            strokeWeight: 2,
            strokeColor: '#FFA500',
            clickable: false,
            editable: true,
            zIndex: 1
          }
        });

        drawingManagerInstance.setMap(mapInstance);

        // Handle drawing completion
        (window as any).google.maps.event.addListener(drawingManagerInstance, 'overlaycomplete', (event: any) => {
          const overlay = event.overlay;
          const type = event.type;
          
          const currentCounter = sectionCounterRef.current;
          
          const newSection: RoofSection = {
            id: `section-${Date.now()}`,
            number: currentCounter,
            type: type as 'polygon' | 'rectangle' | 'circle',
            coordinates: [],
            label: `Section ${currentCounter}`,
            notes: ''
          };

          if (type === 'polygon') {
            const path = overlay.getPath();
            const coords: any[] = [];
            for (let i = 0; i < path.getLength(); i++) {
              coords.push(path.getAt(i));
            }
            newSection.coordinates = coords;
            newSection.area = (window as any).google.maps.geometry.spherical.computeArea(path);
          } else if (type === 'rectangle') {
            const bounds = overlay.getBounds();
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            newSection.coordinates = [
              sw,
              new (window as any).google.maps.LatLng(sw.lat(), ne.lng()),
              ne,
              new (window as any).google.maps.LatLng(ne.lat(), sw.lng())
            ];
            newSection.area = (window as any).google.maps.geometry.spherical.computeArea([
              sw,
              new (window as any).google.maps.LatLng(sw.lat(), ne.lng()),
              ne,
              new (window as any).google.maps.LatLng(ne.lat(), sw.lng())
            ]);
          } else if (type === 'circle') {
            const center = overlay.getCenter();
            const radius = overlay.getRadius();
            newSection.coordinates = [center];
            newSection.area = Math.PI * radius * radius;
          }

          const sectionLabel = new (window as any).google.maps.Marker({
            position: newSection.coordinates[0] || overlay.getCenter(),
            map: mapInstance,
            label: {
              text: newSection.number.toString(),
              color: '#FFFFFF',
              fontWeight: 'bold',
              fontSize: '16px'
            },
            icon: {
              path: (window as any).google.maps.SymbolPath.CIRCLE,
              fillColor: '#FF0000',
              fillOpacity: 1,
              strokeColor: '#FFFFFF',
              strokeWeight: 2,
              scale: 15
            }
          });

          globalOverlays.push(overlay, sectionLabel);
          
          // Use refs to get current values (avoids stale closure)
          const currentSections = roofSectionsRef.current;
          onSectionsChangeRef.current([...currentSections, newSection]);
          
          drawingManagerInstance.setDrawingMode(null);
        });

        globalMapInstance = mapInstance;
        globalDrawingManager = drawingManagerInstance;
        globalGeocoder = new (window as any).google.maps.Geocoder();
        
        if (mountedRef.current) {
          setIsLoading(false);
          setMapReady(true);
        }
      } catch (error) {
        console.error('Error loading Google Maps:', error);
        if (mountedRef.current) {
          setIsLoading(false);
        }
        initializingRef.current = false;
      }
    };

    initMap();
    
    return () => {
      mountedRef.current = false;
    };
  }, [onSectionsChange]);

  const handleAddressSearch = useCallback(() => {
    if (!globalGeocoder || !globalMapInstance || !address) return;

    globalGeocoder.geocode({ address }, (results: any, status: any) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        globalMapInstance.setCenter(location);
        globalMapInstance.setZoom(20);
        
        new (window as any).google.maps.Marker({
          position: location,
          map: globalMapInstance,
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
      }
    });
  }, [address]);

  const setDrawingMode = useCallback((mode: any) => {
    if (!globalDrawingManager) return;
    globalDrawingManager.setDrawingMode(mode);
    setSelectedTool(mode || '');
  }, []);

  const clearAllDrawings = useCallback(() => {
    globalOverlays.forEach(overlay => {
      if (overlay && typeof overlay.setMap === 'function') {
        overlay.setMap(null);
      }
    });
    globalOverlays = [];
    onSectionsChange([]);
  }, [onSectionsChange]);

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
            Roof Section Drawing Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedTool === 'polygon' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDrawingMode((window as any).google?.maps?.drawing?.OverlayType?.POLYGON)}
              disabled={!mapReady}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Polygon
            </Button>
            <Button
              variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDrawingMode((window as any).google?.maps?.drawing?.OverlayType?.RECTANGLE)}
              disabled={!mapReady}
            >
              <Square className="h-4 w-4 mr-1" />
              Rectangle
            </Button>
            <Button
              variant={selectedTool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDrawingMode((window as any).google?.maps?.drawing?.OverlayType?.CIRCLE)}
              disabled={!mapReady}
            >
              <Circle className="h-4 w-4 mr-1" />
              Circle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDrawingMode(null)}
              disabled={!mapReady}
            >
              <Type className="h-4 w-4 mr-1" />
              Select
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllDrawings}
              disabled={!mapReady}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
          
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
          </div>
        </CardContent>
      </Card>

      {roofSections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="h-5 w-5 text-primary" />
              Drawn Roof Sections ({roofSections.length})
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
