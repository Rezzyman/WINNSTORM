import { useState, useEffect, useRef } from 'react';
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
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 50);
      setScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
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
            <div className="flex items-center">
              <img 
                src={winnstormLogo} 
                alt="WinnStorm Logo" 
                className="h-10 w-auto"
              />
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
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Lightning Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-40"
            style={{ filter: 'brightness(0.6) contrast(1.5) saturate(1.2)' }}
          >
            <source src="https://assets.mixkit.co/videos/preview/mixkit-lightning-in-the-dark-sky-4164-large.mp4" type="video/mp4" />
            <source src="https://cdn.pixabay.com/vimeo/280550265/lightning-18208.mp4?width=1280&hash=7f1c2f7c3e8b3d9a5b4c6e8f9a1b2c3d" type="video/mp4" />
            {/* Fallback gradient background */}
          </video>
          {/* Overlay to ensure readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80"></div>
        </div>
        
        {/* Parallax Background Elements */}
        <div 
          className="absolute inset-0 z-10"
          style={{
            transform: `translateY(${scrollY * 0.3}px)`,
          }}
        >
          <div className="absolute top-32 left-[10%] w-80 h-80 bg-gradient-to-r from-primary/20 to-cyan-500/20 rounded-full blur-3xl opacity-40"></div>
          <div className="absolute bottom-32 right-[15%] w-96 h-96 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-blue-500/15 to-purple-500/15 rounded-full blur-2xl opacity-30"></div>
        </div>
        


        <div 
          className="container mx-auto px-6 text-center relative z-20 pt-20"
          style={{
            transform: `translateY(${scrollY * -0.1}px)`,
          }}
        >
          <div className="max-w-4xl mx-auto">
            {/* Animated Logo with Lightning Effects */}
            <div className="mb-16 relative">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-blue-400/40 via-cyan-400/50 to-blue-600/40 rounded-full blur-3xl animate-pulse"></div>
              </div>
              
              {/* Enhanced Lightning Bolts */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="absolute -top-16 -left-16 w-20 h-20 opacity-70">
                  <svg viewBox="0 0 24 24" className="w-full h-full text-yellow-300 animate-ping" style={{ animationDuration: '1.8s' }}>
                    <path fill="currentColor" d="M7 2v11h3v9l7-12h-4l4-8z"/>
                  </svg>
                </div>
                <div className="absolute -top-12 -right-20 w-16 h-16 opacity-60">
                  <svg viewBox="0 0 24 24" className="w-full h-full text-blue-300 animate-ping" style={{ animationDuration: '2.2s', animationDelay: '0.3s' }}>
                    <path fill="currentColor" d="M7 2v11h3v9l7-12h-4l4-8z"/>
                  </svg>
                </div>
                <div className="absolute -bottom-14 -left-12 w-14 h-14 opacity-50">
                  <svg viewBox="0 0 24 24" className="w-full h-full text-cyan-300 animate-ping" style={{ animationDuration: '2.8s', animationDelay: '0.8s' }}>
                    <path fill="currentColor" d="M7 2v11h3v9l7-12h-4l4-8z"/>
                  </svg>
                </div>
                <div className="absolute -bottom-10 -right-14 w-12 h-12 opacity-45">
                  <svg viewBox="0 0 24 24" className="w-full h-full text-yellow-400 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '1.2s' }}>
                    <path fill="currentColor" d="M7 2v11h3v9l7-12h-4l4-8z"/>
                  </svg>
                </div>
              </div>
              
              {/* Main Logo */}
              <div className="relative z-10 animate-fade-in" style={{ animation: 'fadeInScale 3s ease-out' }}>
                <img 
                  src={winnstormLogo} 
                  alt="WinnStorm Logo" 
                  className="h-56 md:h-72 lg:h-80 xl:h-96 w-auto mx-auto filter drop-shadow-2xl"
                />
              </div>
            </div>
            
            <Badge className="mb-8 bg-gradient-to-r from-primary/15 to-cyan-500/15 text-primary border-primary/25 backdrop-blur-sm animate-fade-in" style={{ animation: 'fadeInUp 1.5s ease-out 0.5s both' }}>
              Revolutionizing Property Damage Assessment
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-primary via-cyan-500 to-blue-500 bg-clip-text text-transparent leading-tight tracking-tight animate-fade-in" style={{ animation: 'fadeInUp 1.5s ease-out 1s both' }}>
              Master Damage Assessment with Proven Expertise
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed max-w-3xl mx-auto font-light animate-fade-in" style={{ animation: 'fadeInUp 1.5s ease-out 1.5s both' }}>
              Harness decades of industry-leading expertise through AI-powered thermal analysis, 
              comprehensive reporting, and professional certification training—all built on Eric Winn's proven methodology.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-fade-in" style={{ animation: 'fadeInUp 1.5s ease-out 2s both' }}>
              <Button 
                size="lg"
                className="bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-lg px-10 py-7 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                onClick={() => navigate('/auth')}
              >
                Begin Your Assessment Journey
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="text-lg px-10 py-7 border-primary/40 hover:bg-primary/5 backdrop-blur-sm hover:border-primary/60 transition-all duration-300"
              >
                <Play className="mr-3 h-5 w-5" />
                See It In Action
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto animate-fade-in" style={{ animation: 'fadeInUp 1.5s ease-out 2.5s both' }}>
              <div className="text-center group">
                <div className="text-4xl font-bold bg-gradient-to-br from-primary to-cyan-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">10,000+</div>
                <div className="text-sm text-muted-foreground font-medium">Properties Assessed</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-bold bg-gradient-to-br from-cyan-500 to-blue-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">98.7%</div>
                <div className="text-sm text-muted-foreground font-medium">Precision Rate</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-bold bg-gradient-to-br from-blue-500 to-purple-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">750+</div>
                <div className="text-sm text-muted-foreground font-medium">Certified Professionals</div>
              </div>
              <div className="text-center group">
                <div className="text-4xl font-bold bg-gradient-to-br from-primary to-blue-500 bg-clip-text text-transparent mb-2 group-hover:scale-110 transition-transform">24/7</div>
                <div className="text-sm text-muted-foreground font-medium">Expert AI Guidance</div>
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
      <section 
        ref={featuresRef} 
        id="features" 
        className="py-24 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden"
      >

        
        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-20">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/30 backdrop-blur-sm">Core Capabilities</Badge>
            <h2 className="text-4xl md:text-6xl font-bold mb-8 bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent leading-tight">
              Professional-Grade Assessment Tools
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-light">
              Experience the intersection of decades of field expertise and modern technology. Our platform transforms 
              complex damage assessment into streamlined, accurate, and defensible reports that stand up to scrutiny.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className="group hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 bg-card/60 backdrop-blur-md border-border/40 hover:border-primary/30 relative overflow-hidden"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <CardContent className="p-8 relative z-10">
                    <div className="bg-gradient-to-br from-primary/15 to-cyan-500/15 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4 group-hover:text-primary transition-colors">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Stormy AI Showcase */}
          <Card className="bg-gradient-to-r from-primary/8 to-cyan-500/8 border-primary/25 overflow-hidden backdrop-blur-sm">
            
            <CardContent className="p-10 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-cyan-500/30 rounded-full blur-lg"></div>
                      <StormyAvatar size={56} className="relative z-10" />
                    </div>
                    <div className="ml-6">
                      <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">Meet Stormy</h3>
                      <p className="text-muted-foreground text-lg">Your Expert AI Assessment Partner</p>
                    </div>
                  </div>
                  <p className="text-lg mb-8 text-muted-foreground leading-relaxed">
                    Powered by decades of field expertise, Stormy provides intelligent guidance throughout your inspection process. 
                    From thermal analysis to methodology recommendations, it's like having Eric Winn's expertise available 24/7 
                    for every assessment.
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center group">
                      <div className="bg-green-500/20 p-2 rounded-full mr-3 group-hover:bg-green-500/30 transition-colors">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                      <span className="font-medium">Contextual Guidance</span>
                    </div>
                    <div className="flex items-center group">
                      <div className="bg-blue-500/20 p-2 rounded-full mr-3 group-hover:bg-blue-500/30 transition-colors">
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      </div>
                      <span className="font-medium">Thermal Insights</span>
                    </div>
                    <div className="flex items-center group">
                      <div className="bg-purple-500/20 p-2 rounded-full mr-3 group-hover:bg-purple-500/30 transition-colors">
                        <CheckCircle className="h-4 w-4 text-purple-500" />
                      </div>
                      <span className="font-medium">Methodology Training</span>
                    </div>
                    <div className="flex items-center group">
                      <div className="bg-primary/20 p-2 rounded-full mr-3 group-hover:bg-primary/30 transition-colors">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">Always Available</span>
                    </div>
                  </div>
                </div>
                <div className="bg-background/70 backdrop-blur-md rounded-xl p-8 border border-border/40 shadow-lg relative overflow-hidden">
                  {/* Chat simulation */}
                  <div className="bg-gradient-to-br from-muted/60 to-muted/40 rounded-xl p-6 mb-6 relative">
                    <div className="flex items-start space-x-4">
                      <StormyAvatar size={40} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-3">
                          <p className="font-semibold text-foreground">Stormy</p>
                          <div className="w-2 h-2 bg-green-500 rounded-full ml-3 animate-pulse"></div>
                          <span className="text-xs text-muted-foreground ml-2">Active</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          "Thermal signature analysis complete. Northwest section shows 8°F differential indicating moisture intrusion. 
                          Core sample recommended at grid N-3, W-2 following Winn protocols. Shall I generate the preliminary damage assessment?"
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>Powered by advanced AI trained on expert methodology</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section 
        id="pricing" 
        className="py-24 bg-gradient-to-b from-muted/20 to-background relative overflow-hidden"
      >

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
              All plans include 14-day free trial - No setup fees - Cancel anytime
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
              <div className="flex items-center mb-4">
                <img 
                  src={winnstormLogo} 
                  alt="WinnStorm Logo" 
                  className="h-12 w-auto"
                />
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