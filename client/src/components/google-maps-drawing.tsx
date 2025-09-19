import React, { useEffect, useRef, useState } from 'react';
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
  Save,
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

export const GoogleMapsDrawing: React.FC<GoogleMapsDrawingProps> = ({
  address,
  onAddressChange,
  roofSections,
  onSectionsChange
}) => {
  console.log('🚀 GoogleMapsDrawing component mounting...', { address, roofSections });
  
  const mapRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const initializingRef = useRef(false);
  const [map, setMap] = useState<any>(null);
  const [drawingManager, setDrawingManager] = useState<any>(null);
  const [geocoder, setGeocoder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [sectionCounter, setSectionCounter] = useState(1);
  const [drawnOverlays, setDrawnOverlays] = useState<any[]>([]);
  
  console.log('🧪 Component state:', { isLoading, map: !!map, initializingRef: initializingRef.current });
  console.log('🔑 API Key available:', !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY);

  useEffect(() => {
    const initMap = async () => {
      // Guard against double initialization
      if (map || initializingRef.current) {
        console.log('🚫 Skipping initialization - already initialized or initializing');
        return;
      }
      
      initializingRef.current = true;
      console.log('🗺️ Starting Google Maps initialization...');
      
      const loader = new Loader({
        apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['drawing', 'places', 'geometry']
      });

      try {
        console.log('🔄 Loading Google Maps API...');
        await loader.load();
        
        console.log('✅ Google Maps API loaded successfully');
        
        // Use a more robust container check with multiple strategies
        const getContainer = () => {
          // Strategy 1: React ref
          if (mapRef.current) {
            console.log('✅ Found container via React ref');
            return mapRef.current;
          }
          
          // Strategy 2: Scoped DOM query as fallback
          if (rootRef.current) {
            const container = rootRef.current.querySelector('[data-map-container="true"]');
            if (container) {
              console.log('🔍 Found container via scoped DOM query');
              return container as HTMLDivElement;
            }
          }
          
          // Strategy 3: Global fallback (only if no root ref)
          const globalContainer = document.querySelector('[data-map-container="true"]');
          if (globalContainer) {
            console.log('🌐 Found container via global DOM query');
            return globalContainer as HTMLDivElement;
          }
          
          return null;
        };
        
        // Wait for container with improved retry logic
        let container = null;
        let retries = 0;
        const maxRetries = 30; // 3 seconds total
        
        while (!container && retries < maxRetries) {
          container = getContainer();
          if (container) break;
          
          console.log(`⏳ Waiting for map container... (attempt ${retries + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 100));
          retries++;
        }
        
        if (!container) {
          console.error('❌ Map container not found after retries');
          console.log('🔍 Debug info:');
          console.log('- mapRef.current:', mapRef.current);
          console.log('- rootRef.current:', rootRef.current);
          console.log('- data-map-container elements:', document.querySelectorAll('[data-map-container="true"]'));
          setIsLoading(false);
          initializingRef.current = false;
          return;
        }
        
        console.log('🎯 Map container found:', container);

        console.log('🏗️ Creating map instance...');
        const mapInstance = new (window as any).google.maps.Map(container, {
          center: { lat: 39.8283, lng: -98.5795 }, // Center of US
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

        console.log('Map instance created:', mapInstance);

        console.log('Creating drawing manager...');
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
          
          // Create section data
          const newSection: RoofSection = {
            id: `section-${Date.now()}`,
            number: sectionCounter,
            type: type as 'polygon' | 'rectangle' | 'circle',
            coordinates: [],
            label: `Section ${sectionCounter}`,
            notes: ''
          };

          // Extract coordinates based on shape type
          if (type === 'polygon') {
            const path = overlay.getPath();
            const coords: any[] = [];
            for (let i = 0; i < path.getLength(); i++) {
              coords.push(path.getAt(i));
            }
            newSection.coordinates = coords;
            // Calculate area using Google Maps geometry library
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
            // Calculate rectangle area
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

          // Add section number label
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

          // Store overlay and label references
          setDrawnOverlays(prev => [...prev, overlay, sectionLabel]);
          
          // Update sections
          const updatedSections = [...roofSections, newSection];
          onSectionsChange(updatedSections);
          
          setSectionCounter(prev => prev + 1);
          
          // Reset drawing mode
          drawingManagerInstance.setDrawingMode(null);
          setSelectedTool('');
        });

        console.log('Creating geocoder...');
        const geocoderInstance = new (window as any).google.maps.Geocoder();
        
        console.log('Setting state...');
        setMap(mapInstance);
        setDrawingManager(drawingManagerInstance);
        setGeocoder(geocoderInstance);
        setIsLoading(false);
        console.log('🎉 Google Maps initialization complete!');
      } catch (error) {
        console.error('❌ Error loading Google Maps:', error);
        setIsLoading(false);
        initializingRef.current = false;
      }
    };

    initMap();
    
    // Cleanup function
    return () => {
      if (drawingManager) {
        drawingManager.setMap(null);
      }
      if (drawnOverlays.length > 0) {
        drawnOverlays.forEach(overlay => {
          if (overlay && typeof overlay.setMap === 'function') {
            overlay.setMap(null);
          }
        });
      }
      if (map) {
        map.unbindAll?.();
      }
      initializingRef.current = false;
    };
  }, []);

  const handleAddressSearch = () => {
    if (!geocoder || !map || !address) return;

    geocoder.geocode({ address }, (results: any, status: any) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        map.setCenter(location);
        map.setZoom(20); // Close zoom for roof details
        
        // Add marker for property
        new (window as any).google.maps.Marker({
          position: location,
          map: map,
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
  };

  const setDrawingMode = (mode: any) => {
    if (!drawingManager) return;
    drawingManager.setDrawingMode(mode);
    setSelectedTool(mode || '');
  };

  const clearAllDrawings = () => {
    drawnOverlays.forEach(overlay => {
      if ('setMap' in overlay) {
        (overlay as any).setMap(null);
      }
    });
    setDrawnOverlays([]);
    onSectionsChange([]);
    setSectionCounter(1);
  };

  const deleteSection = (sectionId: string) => {
    const updatedSections = roofSections.filter(section => section.id !== sectionId);
    onSectionsChange(updatedSections);
    // Note: In a full implementation, you'd also remove the corresponding overlay from the map
  };

  const formatArea = (area: number): string => {
    if (area < 1000) {
      return `${area.toFixed(1)} sq ft`;
    } else {
      return `${(area / 10.764).toFixed(1)} sq m`;
    }
  };

  // Always render the DOM structure - show loading state within the map container

  return (
    <div ref={rootRef} className="space-y-6">
      {/* Address Search */}
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

      {/* Drawing Tools */}
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
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Polygon
            </Button>
            <Button
              variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDrawingMode((window as any).google?.maps?.drawing?.OverlayType?.RECTANGLE)}
            >
              <Square className="h-4 w-4 mr-1" />
              Rectangle
            </Button>
            <Button
              variant={selectedTool === 'circle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDrawingMode((window as any).google?.maps?.drawing?.OverlayType?.CIRCLE)}
            >
              <Circle className="h-4 w-4 mr-1" />
              Circle
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDrawingMode(null)}
            >
              <Type className="h-4 w-4 mr-1" />
              Select
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllDrawings}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>
          
          {/* Map Container */}
          <div 
            ref={mapRef}
            data-map-container="true"
            className="w-full h-96 rounded-lg border border-border relative"
            style={{ minHeight: '400px' }}
          >
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading Google Maps...</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section List */}
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
};