import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEO } from '@/components/seo';

export default function SubscriptionSuccess() {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Clear any test user data and ensure fresh login after subscription
    localStorage.removeItem('testUser');
    localStorage.removeItem('testUserRole');
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <SEO
        title="Welcome to WinnStorm - Subscription Activated"
        description="Your WinnStorm subscription is now active. Access AI-powered thermal analysis, Winn Reports, and certification training."
        canonical="/subscription-success"
        noindex={true}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-6"
            >
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <CheckCircle className="h-12 w-12 text-primary" />
              </div>
            </motion.div>
            <CardTitle className="text-3xl font-bold text-foreground">
              Welcome to WinnStorm! 🎉
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="text-lg text-muted-foreground">
                Your subscription has been activated successfully!
              </p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                You now have full access to AI-powered thermal analysis, comprehensive Winn Reports, 
                certification training, and all premium features.
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-6 space-y-3">
              <h3 className="font-semibold text-foreground">What's Next?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Complete your profile and upload your first thermal scan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Explore the training portal to start your certification journey</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Meet Stormy, your AI-powered inspection assistant</span>
                </li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => navigate('/dashboard')}
                className="flex-1 h-12 text-lg bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90"
                data-testid="button-go-to-dashboard"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/training')}
                className="flex-1 h-12"
              >
                Start Training
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-6">
              A confirmation email has been sent to your registered email address.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
