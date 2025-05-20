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
    <header className="bg-background shadow-md border-b border-border">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <img src="/images/white-hot-logo.png" alt="WHITE HOT" className="h-10 mr-3" />
          <h1 className="text-xl font-bold text-primary">WHITE HOT</h1>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-muted-foreground mr-3 hidden sm:inline-block">
            {user?.email ? user.email.split('@')[0] : 'User'}
          </span>
          <button 
            className="w-9 h-9 bg-primary hover:bg-accent transition-colors text-white rounded-full flex items-center justify-center shadow-glow"
            onClick={logout}
          >
            {getUserInitials()}
          </button>
        </div>
      </div>
    </header>
  );
};

export const Footer = () => {
  const [location, navigate] = useLocation();
  
  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border py-2 px-6 z-10">
      <div className="flex flex-col">
        <div className="mb-2 flex justify-center items-center">
          <img src="/images/white-hot-logo.png" alt="WHITE HOT" className="h-6" />
          <span className="text-xs text-muted-foreground ml-2">© 2025 WHITE HOT</span>
        </div>
        <div className="flex justify-around items-center">
          <button 
            className={`flex flex-col items-center ${location === '/dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => navigate('/dashboard')}
          >
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Home</span>
          </button>
          <button 
            className={`flex flex-col items-center ${location === '/upload' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => navigate('/upload')}
          >
            <CloudUpload className="h-6 w-6" />
            <span className="text-xs mt-1">Upload</span>
          </button>
          <button 
            className="flex flex-col items-center text-muted-foreground hover:text-foreground"
          >
            <ChartScatter className="h-6 w-6" />
            <span className="text-xs mt-1">Reports</span>
          </button>
          <button 
            className="flex flex-col items-center text-muted-foreground hover:text-foreground"
          >
            <PersonStanding className="h-6 w-6" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>
    </footer>
  );
};