import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { User } from 'firebase/auth';
import { RoleSelector } from '@/components/role-selector';
import { 
  Card, 
  CardContent 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Flame } from 'lucide-react';
import { SEO } from '@/components/seo';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { user, login, loginWithGoogle } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: "All fields are required",
        description: "Please fill in all fields to continue.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await login(email, password);
      // Role selection will be shown after successful login
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

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await loginWithGoogle();
      // Role selection will be shown after successful login
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Google login failed",
        description: error.message || "There was an error with Google login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If user is logged in but no role is selected yet
  if (user && !localStorage.getItem(`role_${user.uid}`)) {
    return <RoleSelector />;
  }
  
  // If user is logged in with a role, redirect to dashboard
  if (user && localStorage.getItem(`role_${user.uid}`)) {
    navigate('/dashboard');
    return null;
  }

  return (
    <div className="min-h-screen section-dark flex flex-col items-center justify-center p-6">
      <SEO
        title="Sign In - Access Your Account"
        description="Sign in to WinnStorm™ to access your damage assessment dashboard, training portal, and Winn Reports. Secure login with Google or email."
        canonical="/auth"
        keywords={['WinnStorm login', 'damage assessment platform login', 'consultant portal access']}
      />
      <div className="max-w-md w-full">
        {/* WinnStorm Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/winnstorm-logo.png" alt="WinnStorm Restoration Pro" className="h-28" />
          </div>
          <div className="flex justify-center mb-4">
            <div className="accent-bar"></div>
          </div>
          <h1 className="headline-lg text-white mb-2">Sign In</h1>
          <p className="text-white/60">Access your damage assessment dashboard</p>
        </div>

        {/* Login Form */}
        <Card className="border border-white/20 shadow-lg bg-white/5 backdrop-blur-sm rounded-none">
          <CardContent className="pt-6">
            <form onSubmit={handleLogin}>
              <div className="mb-6">
                <Label htmlFor="email" className="block text-white text-sm font-heading uppercase tracking-wide mb-2">
                  Email
                </Label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-white/20 rounded-none focus:outline-none focus:ring-2 focus:ring-primary bg-white/10 text-white placeholder:text-white/40"
                  placeholder="your@email.com"
                  disabled={isLoading}
                  data-testid="input-email"
                />
              </div>
              <div className="mb-6">
                <Label htmlFor="password" className="block text-white text-sm font-heading uppercase tracking-wide mb-2">
                  Password
                </Label>
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-white/20 rounded-none focus:outline-none focus:ring-2 focus:ring-primary bg-white/10 text-white placeholder:text-white/40"
                  placeholder="••••••••"
                  disabled={isLoading}
                  data-testid="input-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full btn-primary rounded-none font-heading uppercase tracking-wide py-6"
                disabled={isLoading}
                data-testid="button-signin"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-white/30 rounded-none"
                  />
                  <Label htmlFor="remember" className="ml-2 block text-sm text-white/60">
                    Remember me
                  </Label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-primary hover:text-primary/80">
                    Forgot password?
                  </a>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Social Login */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#1A1A1A] text-white/60">Or continue with</span>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-1 gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full inline-flex justify-center py-6 px-4 border-2 border-white/20 rounded-none bg-white/5 text-sm font-heading uppercase tracking-wide text-white hover:bg-white hover:text-[#1A1A1A] transition-colors"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              data-testid="button-google-signin"
            >
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px">
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
              Sign in with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
