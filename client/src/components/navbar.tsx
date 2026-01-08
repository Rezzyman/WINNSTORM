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
    <header className="bg-white dark:bg-[#1A1A1A] border-b border-slate-200 dark:border-white/10">
      <div className="flex items-center justify-between p-4">
        <button 
          className="flex items-center cursor-pointer touch-target"
          onClick={() => navigate('/dashboard')}
          data-testid="link-home"
        >
          <img src={winnstormLogo} alt="WinnStorm Restoration Pro" className="h-10 mr-3" />
          <div className="flex flex-col">
            <h1 className="text-lg font-heading font-bold text-slate-900 dark:text-white leading-tight">WinnStorm™</h1>
            <span className="text-xs text-slate-500 dark:text-white/60 -mt-1">Restoration Pro</span>
          </div>
        </button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="flex items-center gap-1">
            <div 
              className="w-11 h-11 bg-primary text-white rounded-none flex items-center justify-center font-heading font-bold text-sm touch-target"
              data-testid="text-user-avatar"
              title={`Signed in as ${user?.email || 'User'}`}
            >
              {getUserInitials()}
            </div>
            <button 
              className="w-11 h-11 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors text-slate-700 dark:text-white rounded-none flex items-center justify-center touch-target"
              onClick={logout}
              data-testid="button-logout"
              title="Sign out"
            >
              <LogOut className="h-5 w-5" />
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
    <footer className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1A1A1A] border-t border-slate-200 dark:border-white/10 py-2 px-4 z-10 safe-area-bottom">
      <div className="flex justify-around items-center max-w-md mx-auto">
        <button 
          className={`flex flex-col items-center min-w-[56px] min-h-[48px] py-2 px-2 touch-target ${location === '/dashboard' ? 'text-primary' : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white active:text-primary'}`}
          onClick={() => navigate('/dashboard')}
          data-testid="nav-dashboard"
        >
          <Home className="h-6 w-6" />
          <span className="text-xs mt-1 font-heading uppercase tracking-wide">Home</span>
        </button>
        <button 
          className={`flex flex-col items-center min-w-[56px] min-h-[48px] py-2 px-2 touch-target ${location === '/upload' ? 'text-primary' : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white active:text-primary'}`}
          onClick={() => navigate('/upload')}
          data-testid="nav-upload"
        >
          <CloudUpload className="h-6 w-6" />
          <span className="text-xs mt-1 font-heading uppercase tracking-wide">Upload</span>
        </button>
        <button 
          className={`flex flex-col items-center min-w-[56px] min-h-[48px] py-2 px-2 touch-target ${location === '/crm-integrations' ? 'text-primary' : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white active:text-primary'}`}
          onClick={() => navigate('/crm-integrations')}
          data-testid="nav-crm"
        >
          <Database className="h-6 w-6" />
          <span className="text-xs mt-1 font-heading uppercase tracking-wide">CRM</span>
        </button>
        <button 
          className={`flex flex-col items-center min-w-[56px] min-h-[48px] py-2 px-2 touch-target ${location === '/reports' ? 'text-primary' : 'text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white active:text-primary'}`}
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