import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Flame, Home, CloudUpload, ChartScatter, PersonStanding } from "lucide-react";

export const Header = () => {
  const { user, logout } = useAuth();
  
  // Get user initials
  const getUserInitials = () => {
    if (!user?.email) return 'U';
    const parts = user.email.split('@')[0].split('.');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <img src="/images/white-hot-logo.png" alt="WHITE HOT" className="h-8 mr-2" />
          <h1 className="text-xl font-semibold text-primary">WHITE HOT</h1>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-neutral-dark mr-2 hidden sm:inline-block">
            {user?.email ? user.email.split('@')[0] : 'User'}
          </span>
          <button 
            className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center"
            onClick={() => logout()}
          >
            <span className="text-sm font-medium">{getUserInitials()}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export const Footer = () => {
  const [location, navigate] = useLocation();
  
  return (
    <nav className="bg-white border-t border-neutral-medium px-4 pt-2 pb-6 fixed bottom-0 left-0 right-0">
      <div className="flex justify-around">
        <button 
          className={`flex flex-col items-center ${location === '/dashboard' ? 'menu-active' : 'text-neutral-dark'}`}
          onClick={() => navigate('/dashboard')}
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1">Home</span>
        </button>
        <button 
          className={`flex flex-col items-center ${location === '/upload' ? 'menu-active' : 'text-neutral-dark'}`}
          onClick={() => navigate('/upload')}
        >
          <CloudUpload className="h-6 w-6" />
          <span className="text-xs mt-1">Upload</span>
        </button>
        <button 
          className="flex flex-col items-center text-neutral-dark"
        >
          <ChartScatter className="h-6 w-6" />
          <span className="text-xs mt-1">Reports</span>
        </button>
        <button 
          className="flex flex-col items-center text-neutral-dark"
        >
          <PersonStanding className="h-6 w-6" />
          <span className="text-xs mt-1">Profile</span>
        </button>
      </div>
    </nav>
  );
};
