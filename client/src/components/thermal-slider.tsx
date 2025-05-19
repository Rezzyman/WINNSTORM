import { useState, useRef, useEffect } from 'react';

interface ThermalSliderProps {
  standardImage: string;
  thermalImage: string;
  alt?: string;
}

export const ThermalSlider = ({ standardImage, thermalImage, alt = "Thermal image comparison" }: ThermalSliderProps) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSliderPosition(Number(e.target.value));
  };

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    isDragging.current = true;
    document.body.style.userSelect = 'none';
    updateSliderPosition(e);
  };

  const stopDrag = () => {
    isDragging.current = false;
    document.body.style.userSelect = '';
  };

  const updateSliderPosition = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    
    let clientX: number;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    
    const rect = containerRef.current.getBoundingClientRect();
    const position = ((clientX - rect.left) / rect.width) * 100;
    
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => updateSliderPosition(e);
    const handleUp = () => stopDrag();
    
    if (isDragging.current) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchend', handleUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  return (
    <div className="mb-6">
      <div className="mb-4 relative" ref={containerRef}>
        {/* Standard Image */}
        <img 
          src={standardImage} 
          alt={`Standard view - ${alt}`} 
          className="w-full h-auto rounded-lg"
        />
        
        {/* Thermal Overlay */}
        <div 
          className="absolute top-0 left-0 right-0 bottom-0 rounded-lg overflow-hidden" 
          style={{clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`}}
        >
          <img 
            src={thermalImage} 
            alt={`Thermal view - ${alt}`} 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Slider Control */}
        <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center pointer-events-none">
          <div 
            className="h-full w-0.5 bg-white" 
            style={{position: 'absolute', left: `${sliderPosition}%`}}
          ></div>
          <div 
            className="absolute bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg pointer-events-auto cursor-move"
            style={{
              left: `${sliderPosition}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
            onMouseDown={startDrag}
            onTouchStart={startDrag}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                className="text-primary">
              <path d="M18 21V3M6 21V3M12 21v-9"></path>
            </svg>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between mb-4">
        <span className="text-sm font-medium text-neutral-darker">Standard View</span>
        <span className="text-sm font-medium text-neutral-darker">Thermal View</span>
      </div>
      
      <input 
        type="range" 
        className="slide-track w-full" 
        min="0" 
        max="100" 
        value={sliderPosition} 
        onChange={handleSliderChange}
      />
    </div>
  );
};
