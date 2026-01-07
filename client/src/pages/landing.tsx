import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'wouter';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
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
import { 
  SEO, 
  organizationSchema, 
  softwareApplicationSchema, 
  websiteSchema,
  faqSchema,
  professionalServiceSchema 
} from '@/components/seo';
import winnstormLogo from '@assets/logo-dark_1765042579232.png';
import winnstormLogoLight from '@assets/logo-light_1765042579233.png';
import winnstormVideo from '@assets/WINNSTORM™ (1)_1756326492392.mp4';

const Landing = () => {
  const [, navigate] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const pricingRef = useRef<HTMLElement>(null);
  const testimonialsRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  // Framer Motion scroll tracking
  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);

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
      buttonText: "Get Started",
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

  const landingFaqs = [
    {
      question: "What is the Winn Methodology?",
      answer: "The Winn Methodology is an industry-leading approach to property damage assessment developed by Eric Winn. It provides a systematic 8-step process for comprehensive storm and hail damage evaluation, ensuring accurate and defensible reports for insurance claims."
    },
    {
      question: "How does Stormy AI help with inspections?",
      answer: "Stormy is our AI-powered assistant that provides real-time guidance during property inspections. It analyzes thermal images, identifies damage patterns, suggests next steps based on the Winn Methodology, and helps consultants produce comprehensive assessment reports."
    },
    {
      question: "What certifications can I earn through WinnStorm?",
      answer: "WinnStorm offers a multi-level certification program including Junior Consultant and Senior Consultant certifications. Our training portal includes courses, quizzes, and progress tracking to help you master the Winn Methodology and advance your career."
    },
    {
      question: "Is WinnStorm available on mobile devices?",
      answer: "Yes! WinnStorm is a mobile-first platform available as a progressive web app and native applications for iOS and Android. It's designed for field use with features like offline capability, native camera integration, and one-handed operation."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Professional Damage Assessment Platform"
        description="AI-powered property damage assessment platform using the proven Winn Methodology. Thermal analysis, comprehensive reporting, consultant certification, and mobile-first field inspector tools."
        canonical="/"
        keywords={['hail damage assessment', 'storm damage inspection', 'property damage consultant', 'thermal imaging analysis', 'insurance claim documentation', 'roof inspection software', 'damage assessment certification']}
        structuredData={[
          organizationSchema,
          softwareApplicationSchema,
          websiteSchema,
          professionalServiceSchema,
          faqSchema(landingFaqs)
        ]}
      />
      
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-[#1A1A1A] backdrop-blur-md border-b border-white/10 shadow-xl' : 'bg-transparent'
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
              <a href="#features" className="text-white/80 hover:text-white font-heading uppercase text-sm tracking-wide transition-colors">Features</a>
              <div className="relative group">
                <span className="text-white/80 hover:text-white font-heading uppercase text-sm tracking-wide transition-colors cursor-pointer">Services</span>
                <div className="absolute top-full left-0 mt-2 w-64 bg-[#1A1A1A] border border-white/20 rounded-none shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <Link href="/services/thermal-inspection" className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 text-sm">Thermal Inspection</Link>
                  <Link href="/services/hail-damage-assessment" className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 text-sm">Hail Damage Assessment</Link>
                  <Link href="/services/storm-damage-consulting" className="block px-4 py-3 text-white/80 hover:text-white hover:bg-white/10 text-sm">Storm Damage Consulting</Link>
                </div>
              </div>
              <a href="#pricing" className="text-white/80 hover:text-white font-heading uppercase text-sm tracking-wide transition-colors">Pricing</a>
              <Link href="/blog" className="text-white/80 hover:text-white font-heading uppercase text-sm tracking-wide transition-colors">Blog</Link>
              <a href="#contact" className="text-white/80 hover:text-white font-heading uppercase text-sm tracking-wide transition-colors">Contact</a>
              <Button variant="outline" onClick={() => navigate('/auth')} className="rounded-none border-white/40 text-white hover:bg-white hover:text-[#1A1A1A] font-heading uppercase tracking-wide">Sign In</Button>
              <Button className="btn-primary" onClick={() => navigate('/subscribe/professional')}>
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 pt-4 border-t border-white/20 bg-[#1A1A1A] -mx-6 px-6">
              <div className="flex flex-col space-y-4 pt-4">
                <a href="#features" className="text-white/80 hover:text-white font-heading uppercase text-sm tracking-wide transition-colors">Features</a>
                <Link href="/services/thermal-inspection" className="text-white/80 hover:text-white text-sm pl-4">→ Thermal Inspection</Link>
                <Link href="/services/hail-damage-assessment" className="text-white/80 hover:text-white text-sm pl-4">→ Hail Damage Assessment</Link>
                <Link href="/services/storm-damage-consulting" className="text-white/80 hover:text-white text-sm pl-4">→ Storm Damage Consulting</Link>
                <a href="#pricing" className="text-white/80 hover:text-white font-heading uppercase text-sm tracking-wide transition-colors">Pricing</a>
                <Link href="/blog" className="text-white/80 hover:text-white font-heading uppercase text-sm tracking-wide transition-colors">Blog</Link>
                <a href="#contact" className="text-white/80 hover:text-white font-heading uppercase text-sm tracking-wide transition-colors">Contact</a>
                <div className="flex flex-col space-y-2 pt-4">
                  <Button variant="outline" onClick={() => navigate('/auth')} className="rounded-none border-white/40 text-white hover:bg-white hover:text-[#1A1A1A] font-heading uppercase tracking-wide">Sign In</Button>
                  <Button className="btn-primary" onClick={() => navigate('/subscribe/professional')}>
                    Get Started
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden section-dark">
        {/* Grayscale Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            style={{ filter: 'grayscale(100%) brightness(0.75) contrast(1.2)' }}
          >
            <source src={winnstormVideo} type="video/mp4" />
            <source src="https://assets.mixkit.co/videos/preview/mixkit-lightning-in-the-dark-sky-4164-large.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A1A1A]/50 via-[#1A1A1A]/30 to-[#1A1A1A]/70"></div>
        </div>

        <div 
          className="container mx-auto px-6 text-center relative z-20 pt-20"
          style={{
            transform: `translateY(${scrollY * -0.1}px)`,
          }}
        >
          <div className="max-w-5xl mx-auto">
            {/* Logo */}
            <div className="mb-12 relative">
              <div className="relative z-10" style={{ animation: 'fadeInScale 2s ease-out both' }}>
                <img 
                  src={winnstormLogo} 
                  alt="WinnStorm Logo" 
                  className="h-56 md:h-72 lg:h-96 w-auto mx-auto filter drop-shadow-2xl"
                />
              </div>
            </div>
            
            {/* Orange Accent Bar */}
            <div className="flex justify-center mb-6" style={{ animation: 'fadeInUp 1s ease-out 0.3s both' }}>
              <div className="accent-bar-lg"></div>
            </div>
            
            {/* Headline - Bold Uppercase Montserrat */}
            <h1 className="headline-xl text-white mb-8 leading-tight animate-fade-in" style={{ animation: 'fadeInUp 1s ease-out 0.5s both' }}>
              Master Roof Damage Assessment
            </h1>
            
            <p className="text-lg md:text-xl text-white/70 mb-10 leading-relaxed max-w-3xl mx-auto font-sans animate-fade-in" style={{ animation: 'fadeInUp 1s ease-out 0.8s both' }}>
              AI-powered thermal analysis, comprehensive reporting, and professional certification training—all built on Eric Winn's proven methodology.
            </p>

            {/* CTA Buttons - Sharp Orange */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in" style={{ animation: 'fadeInUp 1s ease-out 1s both' }}>
              <Button 
                size="lg"
                className="btn-primary text-lg"
                onClick={() => navigate('/auth')}
              >
                Begin Your Assessment Journey
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="btn-secondary text-lg"
                onClick={() => window.location.href = 'mailto:hello@winnstorm.com?subject=Video%20Demo%20Request'}
                data-testid="button-see-action"
              >
                <Play className="mr-3 h-5 w-5" />
                See It In Action
              </Button>
            </div>

            {/* Event Details Strip */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 animate-fade-in" style={{ animation: 'fadeInUp 1s ease-out 1.2s both' }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-heading font-bold text-primary mb-1">10,000+</div>
                  <div className="text-xs md:text-sm text-white/60 uppercase tracking-wider font-heading">Properties Assessed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-heading font-bold text-primary mb-1">98.7%</div>
                  <div className="text-xs md:text-sm text-white/60 uppercase tracking-wider font-heading">Precision Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-heading font-bold text-primary mb-1">750+</div>
                  <div className="text-xs md:text-sm text-white/60 uppercase tracking-wider font-heading">Certified Pros</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-heading font-bold text-primary mb-1">24/7</div>
                  <div className="text-xs md:text-sm text-white/60 uppercase tracking-wider font-heading">AI Guidance</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-6 w-6 text-white/50" />
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={featuresRef} 
        id="features" 
        className="py-24 section-light relative overflow-hidden"
      >
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <div className="flex justify-center mb-6">
              <div className="accent-bar"></div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/30 rounded-none font-heading uppercase tracking-wide">Core Capabilities</Badge>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="headline-lg text-[#1A1A1A] mb-8"
            >
              Professional-Grade Assessment Tools
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="text-lg text-[#1A1A1A]/70 max-w-4xl mx-auto leading-relaxed"
            >
              Experience the intersection of decades of field expertise and modern technology. Our platform transforms 
              complex damage assessment into streamlined, accurate, and defensible reports that stand up to scrutiny.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 60, rotateX: -10 }}
                  whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
                  transition={{ 
                    duration: 0.8, 
                    delay: index * 0.1,
                    ease: [0.25, 0.46, 0.45, 0.94]
                  }}
                  viewport={{ once: true }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.02,
                    transition: { duration: 0.3 }
                  }}
                >
                  <Card className="group hover:shadow-xl transition-all duration-500 bg-white border border-[#1A1A1A]/10 hover:border-primary/50 relative overflow-hidden h-full rounded-none">
                    <CardContent className="p-8 relative z-10">
                      <motion.div 
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-primary/10 w-14 h-14 flex items-center justify-center mb-6"
                      >
                        <Icon className="h-7 w-7 text-primary" />
                      </motion.div>
                      <h3 className="text-xl font-heading font-semibold mb-4 text-[#1A1A1A] group-hover:text-primary transition-colors uppercase tracking-wide">{feature.title}</h3>
                      <p className="text-[#1A1A1A]/70 leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Stormy AI Showcase */}
          <Card className="bg-[#1A1A1A] border-primary/30 overflow-hidden rounded-none">
            
            <CardContent className="p-10 relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center mb-6">
                    <div className="relative">
                      <StormyAvatar size={56} className="relative z-10" />
                    </div>
                    <div className="ml-6">
                      <h3 className="text-3xl font-heading font-bold text-primary uppercase tracking-wide">Meet Stormy</h3>
                      <p className="text-white/70 text-lg">Your Expert AI Assessment Partner</p>
                    </div>
                  </div>
                  <p className="text-lg mb-8 text-white/70 leading-relaxed">
                    Powered by decades of field expertise, Stormy provides intelligent guidance throughout your inspection process. 
                    From thermal analysis to methodology recommendations, it's like having Eric Winn's expertise available 24/7 
                    for every assessment.
                  </p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex items-center group">
                      <div className="bg-primary/20 p-2 mr-3">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-white">Contextual Guidance</span>
                    </div>
                    <div className="flex items-center group">
                      <div className="bg-primary/20 p-2 mr-3">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-white">Thermal Insights</span>
                    </div>
                    <div className="flex items-center group">
                      <div className="bg-primary/20 p-2 mr-3">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-white">Methodology Training</span>
                    </div>
                    <div className="flex items-center group">
                      <div className="bg-primary/20 p-2 mr-3">
                        <CheckCircle className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-white">Always Available</span>
                    </div>
                  </div>
                </div>
                <div className="bg-white/5 p-8 border border-white/10 relative overflow-hidden">
                  {/* Chat simulation */}
                  <div className="bg-white/5 p-6 mb-6 relative">
                    <div className="flex items-start space-x-4">
                      <StormyAvatar size={40} className="flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center mb-3">
                          <p className="font-semibold text-white">Stormy</p>
                          <div className="w-2 h-2 bg-primary rounded-full ml-3 animate-pulse"></div>
                          <span className="text-xs text-white/60 ml-2">Active</span>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed">
                          "Thermal signature analysis complete. Northwest section shows 8°F differential indicating moisture intrusion. 
                          Core sample recommended at grid N-3, W-2 following Winn protocols. Shall I generate the preliminary damage assessment?"
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Status indicator */}
                  <div className="flex items-center text-xs text-white/50">
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
        ref={pricingRef}
        id="pricing" 
        className="py-24 section-dark relative overflow-hidden"
      >
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex justify-center mb-6">
              <div className="accent-bar"></div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/30 rounded-none font-heading uppercase tracking-wide">Investment</Badge>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="headline-lg text-white mb-6"
            >
              Choose Your Plan
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="text-lg text-white/70 max-w-3xl mx-auto"
            >
              Transparent pricing that scales with your business. All plans include core features with no hidden fees.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 80, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.15,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10, 
                  scale: 1.03,
                  transition: { duration: 0.3 }
                }}
              >
                <Card className={`relative overflow-hidden h-full rounded-none ${
                  plan.badge === "Most Popular" 
                    ? "border-2 border-primary bg-white" 
                    : "border border-white/20 bg-white/5 hover:border-white/40 transition-all"
                }`}>
                {plan.badge && (
                  <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 text-sm font-heading uppercase tracking-wide">
                    {plan.badge}
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className={`text-xl font-heading font-bold mb-2 uppercase tracking-wide ${plan.badge === "Most Popular" ? "text-[#1A1A1A]" : "text-white"}`}>{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className={`text-4xl font-heading font-bold ${plan.badge === "Most Popular" ? "text-primary" : "text-primary"}`}>{plan.price}</span>
                    <span className={plan.badge === "Most Popular" ? "text-[#1A1A1A]/60" : "text-white/60"}>/{plan.period}</span>
                  </div>
                  <p className={`text-sm ${plan.badge === "Most Popular" ? "text-[#1A1A1A]/70" : "text-white/70"}`}>{plan.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <CheckCircle className={`h-5 w-5 mr-3 mt-0.5 flex-shrink-0 ${plan.badge === "Most Popular" ? "text-primary" : "text-primary"}`} />
                        <span className={`text-sm ${plan.badge === "Most Popular" ? "text-[#1A1A1A]/80" : "text-white/80"}`}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full rounded-none font-heading uppercase tracking-wide ${
                      plan.buttonVariant === "default" 
                        ? "btn-primary" 
                        : plan.badge === "Most Popular" ? "border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white" : "border-white text-white hover:bg-white hover:text-[#1A1A1A]"
                    }`}
                    variant={plan.buttonVariant}
                    size="lg"
                    onClick={() => {
                      if (plan.name === "Enterprise") {
                        window.location.hash = 'contact';
                      } else {
                        navigate(`/subscribe/${plan.name.toLowerCase()}`);
                      }
                    }}
                    data-testid={`button-subscribe-${plan.name.toLowerCase()}`}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-white/60 mb-4 font-heading uppercase tracking-wide text-sm">
              No setup fees - Cancel anytime
            </p>
            <div className="flex justify-center space-x-8 text-sm text-white/50">
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-primary" />
                Enterprise Security
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                24/7 Support
              </div>
              <div className="flex items-center">
                <Award className="h-4 w-4 mr-2 text-primary" />
                99.9% Uptime SLA
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        ref={testimonialsRef}
        id="testimonials" 
        className="py-20 section-light relative overflow-hidden"
      >
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="flex justify-center mb-6">
              <div className="accent-bar"></div>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/30 rounded-none font-heading uppercase tracking-wide">Testimonials</Badge>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              viewport={{ once: true }}
              className="headline-lg text-[#1A1A1A] mb-6"
            >
              Trusted by Industry Leaders
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              viewport={{ once: true }}
              className="text-lg text-[#1A1A1A]/70 max-w-3xl mx-auto"
            >
              See how WinnStorm is transforming damage assessment for consultants, adjusters, and insurance professionals worldwide.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 60, rotateY: -15 }}
                whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: index * 0.2,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -8, 
                  scale: 1.02,
                  transition: { duration: 0.3 }
                }}
              >
                <Card className="bg-white border border-[#1A1A1A]/10 hover:border-primary/30 hover:shadow-lg transition-all h-full rounded-none">
                  <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-primary/40 mb-4" />
                  <p className="text-[#1A1A1A]/70 mb-6 italic">"{testimonial.content}"</p>
                  <div>
                    <div className="font-heading font-semibold text-[#1A1A1A]">{testimonial.name}</div>
                    <div className="text-sm text-[#1A1A1A]/60">{testimonial.role}</div>
                    <div className="text-sm text-primary font-medium">{testimonial.company}</div>
                  </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        ref={ctaRef}
        className="py-20 bg-primary text-white relative overflow-hidden"
      >
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-1.5 bg-white/30 mb-6"></div>
          </div>
          <motion.h2 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="headline-lg text-white mb-6"
          >
            Ready to Transform Your Damage Assessments?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl mb-8 opacity-90 max-w-3xl mx-auto"
          >
            Join hundreds of certified consultants who trust WinnStorm for accurate, comprehensive damage assessment. 
            Get started today and experience the future of professional inspections.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-[#1A1A1A] hover:bg-white/90 text-lg px-8 py-6 rounded-none font-heading uppercase tracking-wide"
                onClick={() => navigate('/auth')}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-[#1A1A1A] text-lg px-8 py-6 rounded-none font-heading uppercase tracking-wide"
                onClick={() => window.location.href = 'mailto:hello@winnstorm.com?subject=Schedule%20a%20Demo'}
              >
                Schedule Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="section-dark border-t border-white/10">
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
              <p className="text-white/60 mb-4">
                The professional damage assessment platform powered by Eric Winn's proven methodology.
              </p>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-white/60">
                  <Phone className="h-4 w-4 mr-2 text-primary" />
                  +1 (555) 123-WINN
                </div>
                <div className="flex items-center text-sm text-white/60">
                  <Mail className="h-4 w-4 mr-2 text-primary" />
                  hello@winnstorm.com
                </div>
                <div className="flex items-center text-sm text-white/60">
                  <Globe className="h-4 w-4 mr-2 text-primary" />
                  www.winnstorm.com
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-heading font-semibold mb-4 text-white uppercase tracking-wide text-sm">Platform</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="/auth" className="hover:text-primary transition-colors">Sign In</a></li>
                <li><a href="/training" className="hover:text-primary transition-colors">Training Portal</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-heading font-semibold mb-4 text-white uppercase tracking-wide text-sm">Resources</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="/docs" className="hover:text-primary transition-colors">Documentation</a></li>
                <li><a href="/api-docs" className="hover:text-primary transition-colors">API Reference</a></li>
                <li><a href="/support" className="hover:text-primary transition-colors">Support Center</a></li>
                <li><a href="/methodology" className="hover:text-primary transition-colors">Winn Methodology Guide</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-heading font-semibold mb-4 text-white uppercase tracking-wide text-sm">Company</h3>
              <ul className="space-y-2 text-sm text-white/60">
                <li><a href="/about" className="hover:text-primary transition-colors">About Us</a></li>
                <li><a href="/careers" className="hover:text-primary transition-colors">Careers</a></li>
                <li><a href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-white/10" />
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-4">
              <p className="text-sm text-white/50">
                © 2025 WinnStorm™. All rights reserved. Built with the proven Winn Methodology.
              </p>
              <a 
                href="/admin/login" 
                className="text-white/30 hover:text-primary transition-colors"
                data-testid="link-admin"
                title="Admin"
              >
                <Shield className="h-4 w-4" />
              </a>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Badge variant="outline" className="text-xs border-white/20 text-white/60 rounded-none">
                <Shield className="h-3 w-3 mr-1 text-primary" />
                256-bit Encryption
              </Badge>
              <Badge variant="outline" className="text-xs border-white/20 text-white/60 rounded-none">
                <Award className="h-3 w-3 mr-1 text-primary" />
                Enterprise Security
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;