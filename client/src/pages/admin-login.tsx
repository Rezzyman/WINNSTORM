import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Shield, Lock, AlertTriangle } from 'lucide-react';
import { SEO } from '@/components/seo';
import winnstormLogo from '@assets/logo-dark_1765042579232.png';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasCheckedAccess, setHasCheckedAccess] = useState(false);
  const { user, login, logout } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (hasCheckedAccess) return;
    
    const checkAdminAccess = async () => {
      if (!user) {
        setCheckingAccess(false);
        setHasCheckedAccess(true);
        return;
      }
      
      try {
        const token = await user.getIdToken();
        const response = await fetch('/api/admin/session', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          navigate('/admin');
          return;
        } else {
          setAccessDenied(true);
        }
      } catch (error) {
        console.error('Admin session check failed:', error);
      }
      
      setCheckingAccess(false);
      setHasCheckedAccess(true);
    };
    
    checkAdminAccess();
  }, [user, navigate, hasCheckedAccess]);

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
      
      const response = await fetch('/api/admin/check-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const { hasAccess } = await response.json();
      
      if (!hasAccess) {
        setAccessDenied(true);
        toast({
          title: "Access Denied",
          description: "This email is not authorized for admin access.",
          variant: "destructive",
        });
        return;
      }

      await login(email, password);
      
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
            {accessDenied && user && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-2 text-red-400 text-sm mb-3">
                  <AlertTriangle className="h-4 w-4" />
                  Access denied. Your account ({user.email}) is not authorized for admin access.
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await logout();
                    setAccessDenied(false);
                  }}
                  className="w-full text-white border-white/20 hover:bg-white/10"
                  data-testid="button-logout-admin"
                >
                  Sign out and try a different account
                </Button>
              </div>
            )}
            
            {accessDenied && !user && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Access denied. This email is not authorized for admin access.
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
                <Input
                  type="password"
                  id="admin-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 p-3 border border-white/20 rounded-none focus:outline-none focus:ring-2 focus:ring-primary bg-white/10 text-white placeholder:text-white/40"
                  placeholder="••••••••"
                  disabled={isLoading}
                  data-testid="input-admin-password"
                />
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
