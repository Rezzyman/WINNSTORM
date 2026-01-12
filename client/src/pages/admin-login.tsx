import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { SEO } from '@/components/seo';
import winnstormLogo from '@assets/logo-dark_1765042579232.png';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [checkingAccess, setCheckingAccess] = useState(true);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        const response = await fetch('/api/admin/session', {
          credentials: 'include',
        });
        
        if (response.ok) {
          navigate('/admin');
          return;
        }
      } catch (error) {
        console.error('Admin session check failed:', error);
      }
      
      setCheckingAccess(false);
    };
    
    checkAdminSession();
  }, [navigate]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "All fields are required",
        description: "Please enter your admin credentials.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      setAccessDenied(false);
      setErrorMessage('');
      
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setAccessDenied(true);
        setErrorMessage(data.message || 'Login failed');
        toast({
          title: "Login Failed",
          description: data.message || "Please check your credentials and try again.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Admin Login Successful",
        description: "Welcome to the WinnStorm Admin Panel.",
      });
      
      navigate('/admin');
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white/60">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-6">
      <SEO
        title="Admin Login - WinnStorm"
        description="Secure admin access portal for WinnStorm platform management."
        canonical="/admin/login"
        noindex={true}
      />
      
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={winnstormLogo} alt="WinnStorm" className="h-16" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          </div>
          <p className="text-white/60 text-sm">Authorized personnel only</p>
        </div>

        <Card className="border border-primary/30 shadow-lg bg-white/5 backdrop-blur-sm rounded-none">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white">
              <Lock className="h-5 w-5 text-primary" />
              Secure Access
            </CardTitle>
          </CardHeader>
          <CardContent>
            {accessDenied && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4" />
                {errorMessage || 'Access denied. Please check your credentials.'}
              </div>
            )}
            
            <form onSubmit={handleAdminLogin}>
              <div className="mb-4">
                <Label htmlFor="admin-email" className="block text-white text-sm font-medium mb-2">
                  Admin Email
                </Label>
                <Input
                  type="email"
                  id="admin-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 p-3 border border-white/20 rounded-none focus:outline-none focus:ring-2 focus:ring-primary bg-white/10 text-white placeholder:text-white/40"
                  placeholder="admin@winnstorm.com"
                  disabled={isLoading}
                  data-testid="input-admin-email"
                />
              </div>
              
              <div className="mb-6">
                <Label htmlFor="admin-password" className="block text-white text-sm font-medium mb-2">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="admin-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 p-3 pr-12 border border-white/20 rounded-none focus:outline-none focus:ring-2 focus:ring-primary bg-white/10 text-white placeholder:text-white/40"
                    placeholder="••••••••"
                    disabled={isLoading}
                    data-testid="input-admin-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    tabIndex={-1}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-none"
                disabled={isLoading}
                data-testid="button-admin-login"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Authenticating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Access Admin Panel
                  </span>
                )}
              </Button>
            </form>
            
            <div className="mt-6 pt-4 border-t border-white/10 text-center">
              <p className="text-white/40 text-xs">
                This portal is restricted to authorized WinnStorm administrators.
                <br />
                Unauthorized access attempts are logged.
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mt-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white/40 hover:text-white text-sm"
            data-testid="link-back-home"
          >
            ← Back to WinnStorm
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
