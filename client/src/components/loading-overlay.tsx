import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingContextType {
  showLoading: (message?: string, submessage?: string) => void;
  hideLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType>({
  showLoading: () => {},
  hideLoading: () => {},
});

export const useLoading = () => useContext(LoadingContext);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider = ({ children }: LoadingProviderProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('Analyzing thermal data...');
  const [submessage, setSubmessage] = useState('Identifying hotspots and moisture infiltration');

  const showLoading = (newMessage?: string, newSubmessage?: string) => {
    setMessage(newMessage || 'Analyzing thermal data...');
    setSubmessage(newSubmessage || 'Identifying hotspots and moisture infiltration');
    setIsVisible(true);
  };

  const hideLoading = () => {
    setIsVisible(false);
  };

  const value = {
    showLoading,
    hideLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      <LoadingOverlayComponent 
        isVisible={isVisible} 
        message={message}
        submessage={submessage}
      />
      {children}
    </LoadingContext.Provider>
  );
};

interface LoadingOverlayComponentProps {
  isVisible: boolean;
  message: string;
  submessage: string;
}

const LoadingOverlayComponent = ({ isVisible, message, submessage }: LoadingOverlayComponentProps) => {
  return (
    <div className={`fixed inset-0 bg-black/80 z-50 flex items-center justify-center ${isVisible ? '' : 'hidden'}`}>
      <div className="bg-card border border-border p-8 rounded-lg shadow-2xl flex flex-col items-center max-w-md">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-foreground font-semibold text-lg">{message}</p>
        <p className="text-sm text-muted-foreground mt-2 text-center">{submessage}</p>
      </div>
    </div>
  );
};

// Default exported component that doesn't require the Provider pattern
export const LoadingOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('Analyzing thermal data...');
  const [submessage, setSubmessage] = useState('Identifying hotspots and moisture infiltration');

  // This creates a global access to the loading overlay
  useEffect(() => {
    window.showLoading = (msg?: string, subMsg?: string) => {
      setMessage(msg || 'Analyzing thermal data...');
      setSubmessage(subMsg || 'Identifying hotspots and moisture infiltration');
      setIsVisible(true);
    };
    
    window.hideLoading = () => {
      setIsVisible(false);
    };

    return () => {
      window.showLoading = undefined as any;
      window.hideLoading = undefined as any;
    };
  }, []);

  return (
    <div className={`fixed inset-0 bg-black/80 z-50 flex items-center justify-center ${isVisible ? '' : 'hidden'}`}>
      <div className="bg-card border border-border p-8 rounded-lg shadow-2xl flex flex-col items-center max-w-md">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-foreground font-semibold text-lg">{message}</p>
        <p className="text-sm text-muted-foreground mt-2 text-center">{submessage}</p>
      </div>
    </div>
  );
};

// Extend Window interface
declare global {
  interface Window {
    showLoading: (message?: string, submessage?: string) => void;
    hideLoading: () => void;
  }
}
