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
    <div className={`fixed inset-0 bg-neutral-darker bg-opacity-80 z-50 flex items-center justify-center ${isVisible ? '' : 'hidden'}`}>
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-neutral-darker font-medium">{message}</p>
        <p className="text-sm text-neutral-dark mt-2">{submessage}</p>
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
      delete window.showLoading;
      delete window.hideLoading;
    };
  }, []);

  return (
    <div className={`fixed inset-0 bg-neutral-darker bg-opacity-80 z-50 flex items-center justify-center ${isVisible ? '' : 'hidden'}`}>
      <div className="bg-white p-6 rounded-lg shadow-lg flex flex-col items-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-neutral-darker font-medium">{message}</p>
        <p className="text-sm text-neutral-dark mt-2">{submessage}</p>
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
