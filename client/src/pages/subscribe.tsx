// Stripe subscription checkout - referenced from javascript_stripe blueprint
import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { SEO } from '@/components/seo';

// Load Stripe public key - only VITE_ prefixed variables are exposed to frontend
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = stripePublicKey
  ? loadStripe(stripePublicKey)
  : null;

const SubscribeForm = ({ planName, isSetupMode }: { planName: string; isSetupMode: boolean }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || !isElementReady) {
      toast({
        title: "Please wait",
        description: "Payment form is still loading...",
        variant: "default",
      });
      return;
    }

    setIsProcessing(true);

    try {
      let result;
      if (isSetupMode) {
        // For setup intents, use confirmSetup
        result = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/subscription-success`,
          },
        });
      } else {
        // For payment intents, use confirmPayment
        result = await stripe.confirmPayment({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/subscription-success`,
          },
        });
      }

      if (result.error) {
        toast({
          title: "Payment Failed",
          description: result.error.message,
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "An unexpected error occurred",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const isButtonDisabled = !stripe || !isElementReady || isProcessing;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-muted/30 rounded-lg p-4 mb-6">
        <p className="text-sm text-muted-foreground">
          You're subscribing to <span className="font-semibold text-foreground">{planName}</span>
        </p>
      </div>
      
      <div className="min-h-[200px]">
        <PaymentElement 
          onReady={() => setIsElementReady(true)}
          onLoadError={(error) => {
            console.error('PaymentElement load error:', error);
            toast({
              title: "Payment Form Error",
              description: "Failed to load payment form. Please refresh the page.",
              variant: "destructive",
            });
          }}
        />
        {!isElementReady && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading payment form...</span>
          </div>
        )}
      </div>
      
      <Button 
        type="submit" 
        disabled={isButtonDisabled}
        className="w-full h-12 text-lg"
        data-testid="button-confirm-subscription"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : !isElementReady ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading...
          </>
        ) : (
          'Confirm Subscription'
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your subscription will renew automatically. Cancel anytime from your account settings.
      </p>
    </form>
  );
};

export default function Subscribe() {
  const [match, params] = useRoute('/subscribe/:plan');
  const [, navigate] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSetupMode, setIsSetupMode] = useState(false);

  const planName = params?.plan || 'Professional';

  // Check if Stripe is configured
  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Payment System Not Configured
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The payment system is currently being set up. Please check back soon or contact support for assistance.
            </p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    // Create subscription as soon as the page loads
    apiRequest('/api/create-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planName })
    })
      .then((data) => {
        setClientSecret(data.clientSecret);
        setIsSetupMode(data.setupMode || false);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to initialize payment');
        setIsLoading(false);
      });
  }, [planName]);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Payment Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !clientSecret) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Setting up your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12 px-6">
      <SEO
        title={`Subscribe to ${planName} Plan`}
        description={`Subscribe to WinnStorm™ ${planName} plan. Get access to AI-powered thermal analysis, Winn Reports, certification training, and comprehensive damage assessment tools.`}
        canonical={`/subscribe/${planName.toLowerCase()}`}
        noindex={true}
      />
      <div className="container max-w-2xl mx-auto">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/#pricing')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pricing
          </Button>
          <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Subscription</h1>
          <p className="text-muted-foreground">Enter your payment details to get started with WinnStorm</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Secure Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: {
                    colorPrimary: '#f97316',
                    colorBackground: '#1c1c1c',
                    colorText: '#ffffff',
                    colorDanger: '#ef4444',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    borderRadius: '6px',
                  },
                },
              }}
            >
              <SubscribeForm planName={planName} isSetupMode={isSetupMode} />
            </Elements>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>🔒 Secured by Stripe • Your payment information is encrypted and secure</p>
        </div>
      </div>
    </div>
  );
}
