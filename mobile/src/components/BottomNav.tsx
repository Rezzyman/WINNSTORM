import { useLocation, Link } from 'wouter';
import { Home, Camera, MessageCircle, ClipboardList } from 'lucide-react';
import { cn, hapticFeedback } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/camera', icon: Camera, label: 'Capture' },
  { path: '/stormy', icon: MessageCircle, label: 'Stormy' },
  { path: '/inspections', icon: ClipboardList, label: 'Jobs' },
];

export default function BottomNav() {
  const [location] = useLocation();

  const handleTap = () => {
    hapticFeedback('light');
  };

  return (
    <nav className="bg-slate-800/95 backdrop-blur-lg border-t border-slate-700 pb-1">
      <div className="flex items-center justify-around h-11">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location === path || (path !== '/' && location.startsWith(path));
          return (
            <Link key={path} href={path} onClick={handleTap}>
              <div className={cn(
                'flex flex-col items-center justify-center w-16 h-full transition-all touch-active',
                isActive ? 'text-primary-500' : 'text-slate-400'
              )}>
                <Icon className={cn('w-5 h-5 mb-0.5', isActive && 'scale-110')} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn('text-[10px] font-medium', isActive && 'font-semibold')}>{label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
