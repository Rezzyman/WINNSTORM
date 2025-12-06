import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth, UserRole } from '@/hooks/use-auth';
import { 
  Card, 
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ClipboardCheck, Settings, Building2 } from 'lucide-react';
import winnstormLogo from '@assets/logo-dark_1765042579232.png';

interface RoleOption {
  id: UserRole;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const roleOptions: RoleOption[] = [
  {
    id: 'junior_consultant',
    title: 'Junior Consultant',
    description: 'New to damage assessment, learning the Winn Methodology',
    icon: <ClipboardCheck className="h-6 w-6 text-primary" />
  },
  {
    id: 'senior_consultant',
    title: 'Senior Consultant',
    description: 'Experienced assessor with advanced certification',
    icon: <Shield className="h-6 w-6 text-primary" />
  },
  {
    id: 'admin',
    title: 'Admin / Manager',
    description: 'Manage team, view analytics, oversee operations',
    icon: <Settings className="h-6 w-6 text-primary" />
  },
  {
    id: 'client',
    title: 'Property Owner / Client',
    description: 'View reports and track project status',
    icon: <Building2 className="h-6 w-6 text-primary" />
  }
];

export const RoleSelector = () => {
  const { setUserRole } = useAuth();
  const [, navigate] = useLocation();
  const [selectedRole, setSelectedRole] = useState<UserRole>('junior_consultant');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole) return;
    
    setIsSubmitting(true);
    try {
      await setUserRole(selectedRole);
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to set role:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 section-dark z-40 flex flex-col items-center justify-center p-6">
      <div className="max-w-lg w-full">
        {/* WinnStorm Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={winnstormLogo} alt="WinnStorm" className="h-24" />
          </div>
          <div className="flex justify-center mb-4">
            <div className="accent-bar"></div>
          </div>
          <h1 className="headline-lg text-white mb-2">Select Your Role</h1>
          <p className="text-white/60">Choose the role that best describes you</p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-8">
          {roleOptions.map((role) => (
            <Card 
              key={role.id}
              className={`cursor-pointer transition-all rounded-none ${
                selectedRole === role.id 
                  ? 'border-2 border-primary bg-primary/10' 
                  : 'border border-white/20 bg-white/5 hover:border-white/40'
              }`}
              onClick={() => handleRoleSelect(role.id)}
              data-testid={`role-card-${role.id}`}
            >
              <CardContent className="p-4 flex items-center">
                <div className={`p-3 rounded-none ${
                  selectedRole === role.id 
                    ? 'bg-primary/20' 
                    : 'bg-white/10'
                }`}>
                  {role.icon}
                </div>
                <div className="ml-4 text-left">
                  <h3 className={`font-heading font-semibold uppercase tracking-wide text-sm ${
                    selectedRole === role.id ? 'text-primary' : 'text-white'
                  }`}>{role.title}</h3>
                  <p className="text-sm text-white/60">{role.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          onClick={handleContinue}
          disabled={!selectedRole || isSubmitting}
          className="w-full btn-primary rounded-none font-heading uppercase tracking-wide py-6 text-lg"
          data-testid="button-continue-role"
        >
          {isSubmitting ? 'Setting up...' : 'Continue to Dashboard'}
        </Button>
      </div>
    </div>
  );
};
