import { useState } from 'react';
import { useAuth, UserRole } from '@/hooks/use-auth';
import { 
  Card, 
  CardContent,
} from '@/components/ui/card';
import { Send, Settings } from 'lucide-react';

// Custom Analytics icon component 
const AnalyticsIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="lucide lucide-line-chart"
    {...props}
  >
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const roleOptions: RoleOption[] = [
  {
    id: 'field-rep',
    title: 'Field Rep / Drone Pilot',
    description: 'Capture & process thermal imagery',
    icon: <Send className="text-primary" />
  },
  {
    id: 'sales-rep',
    title: 'Sales Rep / Estimator',
    description: 'Generate reports & estimates',
    icon: <AnalyticsIcon className="text-neutral-dark" />
  },
  {
    id: 'admin',
    title: 'Admin / Manager',
    description: 'Manage team & view analytics',
    icon: <Settings className="text-neutral-dark" />
  }
];

export const RoleSelector = () => {
  const { setUserRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('field-rep');

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setUserRole(role);
  };

  return (
    <div className="fixed inset-0 bg-white z-40 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* WHITE HOT Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2">
            <img src="/images/white-hot-logo.png" alt="WHITE HOT" className="h-20" />
          </div>
          <h1 className="text-2xl font-bold text-primary mt-4">Select Your Role</h1>
          <p className="text-neutral-dark mt-2">Access the features specific to your job</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {roleOptions.map((role) => (
            <Card 
              key={role.id}
              className={`cursor-pointer ${selectedRole === role.id ? 'border-2 border-primary' : 'border-2 border-neutral-medium'}`}
              onClick={() => handleRoleSelect(role.id)}
            >
              <CardContent className="p-4 flex items-center">
                <div className={`${selectedRole === role.id ? 'bg-primary bg-opacity-10' : 'bg-neutral-medium bg-opacity-10'} p-3 rounded-full`}>
                  {role.icon}
                </div>
                <div className="ml-4 text-left">
                  <h3 className="font-medium text-neutral-darker">{role.title}</h3>
                  <p className="text-sm text-neutral-dark">{role.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};