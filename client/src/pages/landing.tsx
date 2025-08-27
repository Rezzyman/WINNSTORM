import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Zap, 
  Eye, 
  Target, 
  Users, 
  Award, 
  CheckCircle, 
  ArrowRight,
  Star,
  Quote,
  TrendingUp,
  Clock,
  MapPin,
  FileText,
  Camera,
  Thermometer,
  Cloud,
  Building,
  Phone,
  Mail,
  Globe,
  Play,
  ChevronDown,
  Menu,
  X
} from 'lucide-react';
import { StormyAvatar } from '@/components/stormy-avatar';
import winnstormLogo from '@assets/Untitled_design__72_-removebg-preview_1753995395882.png';

const Landing = () => {
  const [, navigate] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: Thermometer,
      title: "AI-Powered Thermal Analysis",
      description: "Advanced thermal imaging analysis with Stormy AI assistant providing real-time guidance based on Eric Winn's proven methodology."
    },
    {
      icon: FileText,
      title: "Comprehensive Winn Reports",
      description: "Generate detailed damage assessment reports following the industry-leading Winn Methodology with automated evidence compilation."
    },
    {
      icon: Award,
      title: "Certification Training Portal",
      description: "Complete training system with courses, progress tracking, and multi-level certification from Junior to Senior Consultant."
    },
    {
      icon: MapPin,
      title: "Google Maps Integration",
      description: "Satellite view property analysis with drawing tools for precise roof section marking and geospatial damage assessment."
    },
    {
      icon: Users,
      title: "Client & Project Management",
      description: "Full CRM functionality for managing projects, clients, and tracking assessment progress with automated workflows."
    },
    {
      icon: Cloud,
      title: "Weather Verification",
      description: "Integration with meteorological data sources for hail and storm verification to support insurance claims."
    }
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$299",
      period: "per month",
      description: "Perfect for independent consultants starting their damage assessment practice",
      features: [
        "Up to 25 assessments per month",
        "Basic Winn Report generation",
        "Thermal analysis with Stormy AI",
        "Junior certification training",
        "Email support",
        "Basic project management"
      ],
      badge: null,
      buttonText: "Start Free Trial",
      buttonVariant: "outline" as const
    },
    {
      name: "Professional",
      price: "$599",
      period: "per month",
      description: "Complete solution for established consulting firms and senior practitioners",
      features: [
        "Unlimited assessments",
        "Advanced Winn Reports with customization",
        "Full Stormy AI assistant capabilities",
        "Complete certification program (Junior + Senior)",
        "Google Maps integration with drawing tools",
        "Advanced CRM and client management",
        "Weather verification API access",
        "Priority phone & email support",
        "Team collaboration features"
      ],
      badge: "Most Popular",
      buttonText: "Get Started",
      buttonVariant: "default" as const
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      description: "Tailored solutions for large organizations and insurance companies",
      features: [
        "Everything in Professional",
        "Custom integrations",
        "White-label options",
        "Dedicated account manager",
        "Custom training programs",
        "Advanced analytics & reporting",
        "API access for third-party tools",
        "24/7 phone support",
        "On-site training available"
      ],
      badge: "Enterprise",
      buttonText: "Contact Sales",
      buttonVariant: "outline" as const
    }
  ];

  const testimonials = [
    {
      name: "Michael Rodriguez",
      role: "Senior Insurance Adjuster",
      company: "State Farm Insurance",
      content: "WinnStorm has revolutionized our damage assessment process. The Winn Methodology implementation is spot-on, and the thermal analysis is incredibly accurate.",
      rating: 5
    },
    {
      name: "Sarah Chen",
      role: "Roofing Consultant",
      company: "Elite Roofing Solutions",
      content: "The training portal helped me achieve senior certification in record time. Stormy's AI guidance during inspections is like having Eric Winn himself on every job.",
      rating: 5
    },
    {
      name: "David Thompson",
      role: "Claims Manager",
      company: "Liberty Mutual",
      content: "The comprehensive reports generated by WinnStorm provide the detailed evidence we need for complex claims. It's become an essential tool for our team.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-lg' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={winnstormLogo} 
                alt="WinnStorm Logo" 
                className="h-10 w-auto"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                WinnStorm™
              </span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
              <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
              <Button variant="outline" onClick={() => navigate('/auth')}>Sign In</Button>
              <Button className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90">
                Start Free Trial
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-border">
              <div className="flex flex-col space-y-4 pt-4">
                <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
                <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
                <a href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
                <div className="flex flex-col space-y-2 pt-4">
                  <Button variant="outline" onClick={() => navigate('/auth')}>Sign In</Button>
                  <Button className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90">
                    Start Free Trial
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-cyan-500/10"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-primary/20 to-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-6 text-center relative z-10 pt-20">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-gradient-to-r from-primary/20 to-cyan-500/20 text-primary border-primary/30">
              The Future of Damage Assessment
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary via-cyan-500 to-blue-500 bg-clip-text text-transparent leading-tight">
              Transform Damage Assessment with the Winn Methodology
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed">
              The only platform that crystallizes Eric Winn's expertise into AI-powered thermal analysis, 
              comprehensive reporting, and certification training for damage assessment consultants.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-lg px-8 py-6"
                onClick={() => navigate('/auth')}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-8 py-6 border-primary/30 hover:bg-primary/10"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </div>

            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
                <div className="text-sm text-muted-foreground">Assessments Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-500 mb-2">98%</div>
                <div className="text-sm text-muted-foreground">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-500 mb-2">500+</div>
                <div className="text-sm text-muted-foreground">Certified Consultants</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">AI Support</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-muted-foreground" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-b from-background to-muted/30">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">Platform Features</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
              Everything You Need for Professional Damage Assessment
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Built by experts, for experts. WinnStorm combines cutting-edge AI technology with proven methodologies 
              to deliver the most comprehensive damage assessment platform available.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-card/50 backdrop-blur-sm border-border/50">
                  <CardContent className="p-6">
                    <div className="bg-gradient-to-br from-primary/20 to-cyan-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Stormy AI Showcase */}
          <Card className="bg-gradient-to-r from-primary/5 to-cyan-500/5 border-primary/20 overflow-hidden">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center mb-4">
                    <StormyAvatar size={48} className="mr-4" />
                    <div>
                      <h3 className="text-2xl font-bold">Meet Stormy</h3>
                      <p className="text-muted-foreground">Your AI Damage Assessment Expert</p>
                    </div>
                  </div>
                  <p className="text-lg mb-6 text-muted-foreground">
                    Stormy is trained on Eric Winn's decades of expertise and provides real-time guidance during inspections, 
                    thermal analysis insights, and methodology recommendations—like having the industry's leading expert with you on every job.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm">Real-time guidance</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm">Thermal analysis</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm">Methodology training</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-sm">24/7 availability</span>
                    </div>
                  </div>
                </div>
                <div className="bg-background/50 backdrop-blur-sm rounded-lg p-6 border border-border/50">
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <StormyAvatar size={32} />
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-2">Stormy AI Assistant</p>
                        <p className="text-sm text-muted-foreground">
                          "Based on the thermal imaging data, I've identified moisture intrusion in the northwest section. 
                          The temperature differential suggests compromised insulation. I recommend core sampling at coordinates 
                          N-3, W-2 to confirm water damage extent per Winn Methodology protocols."
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-center">
                    ⚡ Powered by OpenAI GPT-4o with Eric Winn's methodology training
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Simple Pricing</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Choose Your Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Transparent pricing that scales with your business. All plans include core features with no hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative overflow-hidden ${
                plan.badge === "Most Popular" 
                  ? "border-primary shadow-xl scale-105 bg-gradient-to-b from-primary/5 to-cyan-500/5" 
                  : "border-border hover:shadow-lg transition-shadow"
              }`}>
                {plan.badge && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-primary to-cyan-500 text-white px-3 py-1 text-sm font-medium">
                    {plan.badge}
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${
                      plan.buttonVariant === "default" 
                        ? "bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90" 
                        : ""
                    }`}
                    variant={plan.buttonVariant}
                    size="lg"
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              All plans include 14-day free trial • No setup fees • Cancel anytime
            </p>
            <div className="flex justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Enterprise Security
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                24/7 Support
              </div>
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-2" />
                99.9% Uptime SLA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gradient-to-b from-muted/30 to-background">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Testimonials</Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See how WinnStorm is transforming damage assessment for consultants, adjusters, and insurance professionals worldwide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur-sm border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    <div className="text-sm text-primary">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-cyan-500 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your Damage Assessments?
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
            Join hundreds of certified consultants who trust WinnStorm for accurate, comprehensive damage assessment. 
            Start your free trial today and experience the future of professional inspections.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-primary hover:bg-white/90 text-lg px-8 py-6"
              onClick={() => navigate('/auth')}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-6"
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-background border-t border-border">
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src={winnstormLogo} 
                  alt="WinnStorm Logo" 
                  className="h-10 w-auto"
                />
                <span className="text-2xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                  WinnStorm™
                </span>
              </div>
              <p className="text-muted-foreground mb-4">
                The professional damage assessment platform powered by Eric Winn's proven methodology.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  +1 (555) 123-WINN
                </div>
                <div className="flex items-center text-sm">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  hello@winnstorm.com
                </div>
                <div className="flex items-center text-sm">
                  <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                  www.winnstorm.com
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="/auth" className="hover:text-foreground transition-colors">Sign In</a></li>
                <li><a href="/training" className="hover:text-foreground transition-colors">Training Portal</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Winn Methodology Guide</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <Separator className="my-8" />
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground">
              © 2025 WinnStorm™. All rights reserved. Built with the proven Winn Methodology.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Badge variant="outline" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                SOC 2 Compliant
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Award className="h-3 w-3 mr-1" />
                ISO 27001 Certified
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;