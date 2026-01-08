/// <reference types="@types/google.maps" />
import { useRef, useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, placeDetails?: google.maps.places.PlaceResult | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
  'data-testid'?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter address",
  className,
  disabled = false,
  required = false,
  id,
  'data-testid': testId
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not found. Address autocomplete disabled.');
      return;
    }

    const initAutocomplete = () => {
      if (!inputRef.current || !window.google?.maps?.places) return;

      try {
        autocompleteRef.current = new window.google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['address'],
            fields: ['formatted_address', 'geometry', 'address_components', 'place_id']
          }
        );

        autocompleteRef.current.addListener('place_changed', () => {
          const place = autocompleteRef.current?.getPlace();
          if (place?.formatted_address) {
            onChange(place.formatted_address, place);
          }
        });

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize autocomplete:', error);
      }
    };

    if (window.google?.maps?.places) {
      initAutocomplete();
    } else {
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      
      if (!existingScript) {
        setIsLoading(true);
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
          setIsLoading(false);
          initAutocomplete();
        };
        script.onerror = () => {
          setIsLoading(false);
          console.error('Failed to load Google Maps script');
        };
        document.head.appendChild(script);
      } else {
        const checkGoogle = setInterval(() => {
          if (window.google?.maps?.places) {
            clearInterval(checkGoogle);
            initAutocomplete();
          }
        }, 100);
        
        setTimeout(() => clearInterval(checkGoogle), 10000);
      }
    }

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [onChange]);

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10">
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MapPin className="h-4 w-4" />
        )}
      </div>
      <Input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        required={required}
        data-testid={testId}
        className={cn(
          "pl-10",
          className
        )}
      />
      {isInitialized && (
        <style>{`
          .pac-container {
            background-color: hsl(var(--popover));
            border: 1px solid hsl(var(--border));
            border-radius: 0.5rem;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            font-family: inherit;
            z-index: 9999 !important;
            margin-top: 4px;
          }
          .pac-item {
            padding: 10px 12px;
            color: hsl(var(--foreground));
            cursor: pointer;
            border-top: 1px solid hsl(var(--border));
            font-size: 14px;
          }
          .pac-item:first-child {
            border-top: none;
          }
          .pac-item:hover,
          .pac-item-selected {
            background-color: hsl(var(--accent));
          }
          .pac-icon {
            display: none;
          }
          .pac-item-query {
            color: hsl(var(--foreground));
            font-weight: 500;
          }
          .pac-matched {
            color: hsl(var(--primary));
            font-weight: 600;
          }
          .pac-logo::after {
            display: none;
          }
        `}</style>
      )}
    </div>
  );
}