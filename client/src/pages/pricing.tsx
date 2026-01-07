import { useLocation } from 'wouter';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Check, Shield, Star, Zap } from 'lucide-react';

export default function PricingPage() {
  const [, navigate] = useLocation();

  const pricingPlans = [
    {
      name: "Starter",
      price: "$299",
      period: "per month",
      description: "Perfect for independent consultants starting their damage assessment practice",
      features: [
        "5 Inspections per month",
        "Basic Stormy AI assistance",
        "Standard report templates",
        "Email support",
        "Mobile app access",
        "Basic thermal analysis"
      ],
      highlight: false,
      icon: Shield
    },
    {
      name: "Professional",
      price: "$599",
      period: "per month",
      description: "Complete solution for established consulting firms and senior practitioners",
      features: [
        "Unlimited inspections",
        "Advanced Stormy AI with vision",
        "Custom report branding",
        "Priority phone support",
        "Team collaboration tools",
        "Advanced thermal analysis",
        "Weather data integration",
        "CRM integrations"
      ],
      highlight: true,
      icon: Star
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact for pricing",
      description: "Tailored solutions for large organizations with custom requirements",
      features: [
        "Everything in Professional",
        "Unlimited team members",
        "Custom AI training",
        "Dedicated account manager",
        "SLA guarantees",
        "On-premise deployment option",
        "Custom integrations",
        "Advanced analytics & reporting"
      ],
      highlight: false,
      icon: Zap
    }
  ];

  return (
    <>
      <Helmet>
        <title>Pricing - WinnStorm Damage Assessment Platform</title>
        <meta name="description" content="Choose the right WinnStorm plan for your damage assessment business. Starter, Professional, and Enterprise plans available with AI-powered inspection tools." />
      </Helmet>

      <div className="min-h-screen bg-[#1A1A1A]">
        <header className="bg-[#1A1A1A]/95 backdrop-blur-sm border-b border-white/10 py-4">
          <div className="container mx-auto px-4 flex justify-between items-center">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-2 touch-target"
              data-testid="button-home"
            >
              <Shield className="h-8 w-8 text-[hsl(16,100%,50%)]" />
              <span className="font-heading font-bold text-xl text-white uppercase tracking-wide">WinnStorm</span>
            </button>
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth')} 
                className="rounded-none border-white/40 text-white hover:bg-white hover:text-[#1A1A1A] font-heading uppercase tracking-wide touch-target"
                data-testid="button-sign-in"
              >
                Sign In
              </Button>
            </div>
          </div>
        </header>

        <main className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h1 className="font-heading font-bold text-4xl md:text-5xl text-white uppercase tracking-wide mb-4">
                Simple, Transparent Pricing
              </h1>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">
                Choose the plan that fits your damage assessment business. All plans include our proven Winn Methodology and Stormy AI assistant.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {pricingPlans.map((plan) => {
                const IconComponent = plan.icon;
                return (
                  <Card 
                    key={plan.name}
                    className={`bg-[#2A2A2A] border-0 rounded-none relative overflow-hidden ${
                      plan.highlight ? 'ring-2 ring-[hsl(16,100%,50%)] scale-105' : ''
                    }`}
                    data-testid={`card-pricing-${plan.name.toLowerCase()}`}
                  >
                    {plan.highlight && (
                      <div className="absolute top-0 left-0 right-0 bg-[hsl(16,100%,50%)] text-white text-center py-1 text-sm font-heading uppercase tracking-wide">
                        Most Popular
                      </div>
                    )}
                    <CardHeader className={plan.highlight ? 'pt-10' : ''}>
                      <div className="flex items-center gap-3 mb-2">
                        <IconComponent className="h-6 w-6 text-[hsl(16,100%,50%)]" />
                        <CardTitle className="font-heading text-2xl text-white uppercase tracking-wide">
                          {plan.name}
                        </CardTitle>
                      </div>
                      <div className="flex items-baseline gap-1">
                        <span className="font-heading font-bold text-4xl text-white">{plan.price}</span>
                        <span className="text-white/60 text-sm">/{plan.period}</span>
                      </div>
                      <CardDescription className="text-white/60 mt-2">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-[hsl(16,100%,50%)] flex-shrink-0" />
                          <span className="text-white/80 text-sm">{feature}</span>
                        </div>
                      ))}
                    </CardContent>
                    <CardFooter>
                      <Button
                        className={`w-full rounded-none font-heading uppercase tracking-wide touch-target ${
                          plan.highlight 
                            ? 'bg-[hsl(16,100%,50%)] hover:bg-[hsl(16,100%,40%)] text-white' 
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                        onClick={() => {
                          if (plan.name === "Enterprise") {
                            navigate('/#contact');
                          } else {
                            navigate(`/subscribe/${plan.name.toLowerCase()}`);
                          }
                        }}
                        data-testid={`button-subscribe-${plan.name.toLowerCase()}`}
                      >
                        {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            <div className="mt-16 text-center">
              <h2 className="font-heading font-bold text-2xl text-white uppercase tracking-wide mb-4">
                All Plans Include
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {[
                  "No Setup Fees",
                  "Cancel Anytime",
                  "Data Export"
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-center gap-2">
                    <Check className="h-5 w-5 text-[hsl(16,100%,50%)]" />
                    <span className="text-white/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        <footer className="bg-[#1A1A1A] border-t border-white/10 py-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-white/40 text-sm">
              &copy; {new Date().getFullYear()} WinnStorm. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
