import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SEO } from '@/components/seo';

const stripePublicKey = import.meta.env.TESTING_VITE_STRIPE_PUBLIC_KEY || import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

type PaymentStatus = 'loading' | 'succeeded' | 'processing' | 'failed' | 'requires_action';

export default function SubscriptionSuccess() {
  const [, navigate] = useLocation();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Clear any test user data and ensure fresh login after subscription
    localStorage.removeItem('testUser');
    localStorage.removeItem('testUserRole');

    // Verify payment status from URL parameters
    const verifyPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentIntentClientSecret = urlParams.get('payment_intent_client_secret');
      const setupIntentClientSecret = urlParams.get('setup_intent_client_secret');
      const redirectStatus = urlParams.get('redirect_status');

      // If redirect_status is directly provided by Stripe
      if (redirectStatus === 'succeeded') {
        setPaymentStatus('succeeded');
        return;
      }

      // If redirect_status indicates failure
      if (redirectStatus === 'failed') {
        setErrorMessage('Your payment was declined. Please try again.');
        setPaymentStatus('failed');
        return;
      }

      // If no client secrets and no redirect status, show processing (cannot verify)
      if (!paymentIntentClientSecret && !setupIntentClientSecret) {
        // Only show success if we have explicit redirect_status
        // Otherwise show processing as we cannot verify
        if (redirectStatus) {
          setPaymentStatus('succeeded');
        } else {
          // Direct navigation without any params - likely a bookmark or test
          setPaymentStatus('processing');
        }
        return;
      }

      if (!stripePromise) {
        setErrorMessage('Payment system unavailable. Please check your email for confirmation.');
        setPaymentStatus('failed');
        return;
      }

      const stripe = await stripePromise;
      if (!stripe) {
        setErrorMessage('Unable to verify payment. Please check your email for confirmation.');
        setPaymentStatus('failed');
        return;
      }

      try {
        if (paymentIntentClientSecret) {
          const { paymentIntent, error } = await stripe.retrievePaymentIntent(paymentIntentClientSecret);
          
          if (error) {
            setErrorMessage(error.message || 'Payment verification failed');
            setPaymentStatus('failed');
            return;
          }

          if (paymentIntent) {
            switch (paymentIntent.status) {
              case 'succeeded':
                setPaymentStatus('succeeded');
                break;
              case 'processing':
                setPaymentStatus('processing');
                break;
              case 'requires_payment_method':
                setErrorMessage('Your payment was not successful. Please try again.');
                setPaymentStatus('failed');
                break;
              case 'requires_action':
              case 'requires_confirmation':
                setPaymentStatus('requires_action');
                break;
              case 'canceled':
                setErrorMessage('Your payment was canceled. Please try again.');
                setPaymentStatus('failed');
                break;
              case 'requires_capture':
                // This means payment is authorized but not captured - treat as processing
                setPaymentStatus('processing');
                break;
              default:
                // Unknown status - treat as failure to avoid false positives
                setErrorMessage('Unable to confirm payment status. Please check your email or contact support.');
                setPaymentStatus('failed');
            }
          } else {
            setErrorMessage('Payment information not found. Please contact support.');
            setPaymentStatus('failed');
          }
        } else if (setupIntentClientSecret) {
          const { setupIntent, error } = await stripe.retrieveSetupIntent(setupIntentClientSecret);
          
          if (error) {
            setErrorMessage(error.message || 'Setup verification failed');
            setPaymentStatus('failed');
            return;
          }

          if (setupIntent) {
            switch (setupIntent.status) {
              case 'succeeded':
                setPaymentStatus('succeeded');
                break;
              case 'processing':
                setPaymentStatus('processing');
                break;
              case 'requires_payment_method':
                setErrorMessage('Your payment method was not set up successfully. Please try again.');
                setPaymentStatus('failed');
                break;
              case 'requires_action':
              case 'requires_confirmation':
                setPaymentStatus('requires_action');
                break;
              case 'canceled':
                setErrorMessage('Setup was canceled. Please try again.');
                setPaymentStatus('failed');
                break;
              default:
                // Unknown status - treat as failure to avoid false positives
                setErrorMessage('Unable to confirm setup status. Please check your email or contact support.');
                setPaymentStatus('failed');
            }
          } else {
            setErrorMessage('Setup information not found. Please contact support.');
            setPaymentStatus('failed');
          }
        }
      } catch (err: any) {
        console.error('Payment verification error:', err);
        // Treat verification errors as needing attention - do not assume success
        setErrorMessage('Unable to verify payment status. Please check your email for confirmation or contact support.');
        setPaymentStatus('failed');
      }
    };

    verifyPayment();
  }, []);

  // Loading state
  if (paymentStatus === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <SEO
          title="Verifying Payment - WinnStorm"
          description="Verifying your payment status."
          canonical="/subscription-success"
          noindex={true}
        />
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
            <p className="text-lg text-foreground">Verifying your payment...</p>
            <p className="text-sm text-muted-foreground mt-2">Please wait while we confirm your subscription.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Failed state
  if (paymentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <SEO
          title="Payment Issue - WinnStorm"
          description="There was an issue with your payment."
          canonical="/subscription-success"
          noindex={true}
        />
        <Card className="max-w-md w-full border-destructive/20">
          <CardHeader className="text-center pb-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Payment Unsuccessful
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              {errorMessage || 'There was an issue processing your payment. Please try again.'}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate('/#pricing')}
                className="w-full h-12"
                data-testid="button-retry-payment"
              >
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Processing state
  if (paymentStatus === 'processing') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <SEO
          title="Payment Processing - WinnStorm"
          description="Your payment is being processed."
          canonical="/subscription-success"
          noindex={true}
        />
        <Card className="max-w-md w-full border-amber-500/20">
          <CardHeader className="text-center pb-4">
            <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Payment Processing
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              Your payment is still being processed. This usually takes just a moment. 
              We'll send you a confirmation email once complete.
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="w-full h-12"
            >
              Continue to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Requires action state (3DS authentication, etc.)
  if (paymentStatus === 'requires_action') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <SEO
          title="Action Required - WinnStorm"
          description="Additional authentication is required for your payment."
          canonical="/subscription-success"
          noindex={true}
        />
        <Card className="max-w-md w-full border-amber-500/20">
          <CardHeader className="text-center pb-4">
            <div className="h-16 w-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-10 w-10 text-amber-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-center text-muted-foreground">
              Your bank requires additional authentication to complete this payment. 
              Please try again to complete the verification process.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => navigate('/#pricing')}
                className="w-full h-12"
                data-testid="button-complete-authentication"
              >
                Complete Payment
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Return Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state (default)
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
              Welcome to WinnStorm!
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
                data-testid="button-start-training"
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
