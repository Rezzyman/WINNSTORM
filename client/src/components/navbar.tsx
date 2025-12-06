import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Cloud, Home, CloudUpload, ChartScatter, PersonStanding, Database, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import winnstormLogo from '@assets/logo-dark_1765042579232.png';

export const Header = () => {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();
  
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
    <header className="section-dark border-b border-white/10">
      <div className="flex items-center justify-between p-4">
        <button 
          className="flex items-center cursor-pointer"
          onClick={() => navigate('/dashboard')}
          data-testid="link-home"
        >
          <img src={winnstormLogo} alt="WinnStorm Restoration Pro" className="h-10 mr-3" />
          <div className="flex flex-col">
            <h1 className="text-lg font-heading font-bold text-white leading-tight">WinnStorm™</h1>
            <span className="text-xs text-white/60 -mt-1">Restoration Pro</span>
          </div>
        </button>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="flex items-center gap-2">
            <button 
              className="w-9 h-9 bg-primary hover:bg-primary/80 transition-colors text-white rounded-none flex items-center justify-center font-heading font-bold text-sm"
              onClick={logout}
              data-testid="button-user-avatar"
              title={`Signed in as ${user?.email || 'User'}`}
            >
              {getUserInitials()}
            </button>
            <button 
              className="w-9 h-9 bg-white/10 hover:bg-white/20 transition-colors text-white rounded-none flex items-center justify-center"
              onClick={logout}
              data-testid="button-logout"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export const Footer = () => {
  const [location, navigate] = useLocation();
  
  return (
    <footer className="fixed bottom-0 left-0 right-0 section-dark border-t border-white/10 py-3 px-6 z-10">
      <div className="flex justify-around items-center">
        <button 
          className={`flex flex-col items-center min-w-[60px] py-1 ${location === '/dashboard' ? 'text-primary' : 'text-white/60 hover:text-white'}`}
          onClick={() => navigate('/dashboard')}
          data-testid="nav-dashboard"
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1 font-heading uppercase tracking-wide">Home</span>
        </button>
        <button 
          className={`flex flex-col items-center min-w-[60px] py-1 ${location === '/upload' ? 'text-primary' : 'text-white/60 hover:text-white'}`}
          onClick={() => navigate('/upload')}
          data-testid="nav-upload"
        >
          <CloudUpload className="h-6 w-6" />
          <span className="text-xs mt-1 font-heading uppercase tracking-wide">Upload</span>
        </button>
        <button 
          className={`flex flex-col items-center min-w-[60px] py-1 ${location === '/crm-integrations' ? 'text-primary' : 'text-white/60 hover:text-white'}`}
          onClick={() => navigate('/crm-integrations')}
          data-testid="nav-crm"
        >
          <Database className="h-6 w-6" />
          <span className="text-xs mt-1 font-heading uppercase tracking-wide">CRM</span>
        </button>
        <button 
          className={`flex flex-col items-center min-w-[60px] py-1 ${location === '/reports' ? 'text-primary' : 'text-white/60 hover:text-white'}`}
          onClick={() => navigate('/reports')}
          data-testid="nav-reports"
        >
          <ChartScatter className="h-6 w-6" />
          <span className="text-xs mt-1 font-heading uppercase tracking-wide">Reports</span>
        </button>
      </div>
    </footer>
  );
};