import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/seo';
import { 
  CheckCircle, 
  ArrowRight, 
  Cloud, 
  Thermometer, 
  Camera, 
  MapPin,
  FileText,
  ClipboardCheck,
  Ruler,
  Shield,
  Home,
  Award,
  Target,
  BookOpen,
  Zap
} from 'lucide-react';
import winnstormLogo from '@assets/logo-dark_1765042579232.png';

const Methodology = () => {
  const steps = [
    {
      number: 1,
      title: "Weather Verification",
      icon: Cloud,
      description: "Establish the foundation of your assessment by verifying historical weather events in the area.",
      details: [
        "Access NOAA and NWS historical storm data",
        "Document hail size, wind speeds, and precipitation",
        "Correlate weather events with reported damage dates",
        "Generate weather verification certificates"
      ],
      color: "from-blue-500 to-cyan-500"
    },
    {
      number: 2,
      title: "Thermal Analysis",
      icon: Thermometer,
      description: "Use thermal imaging to identify hidden moisture intrusion and insulation deficiencies.",
      details: [
        "Capture thermal images during optimal conditions",
        "Identify temperature differentials indicating damage",
        "Detect moisture patterns invisible to naked eye",
        "AI-assisted anomaly detection with Stormy"
      ],
      color: "from-red-500 to-orange-500"
    },
    {
      number: 3,
      title: "Terrestrial Documentation",
      icon: Camera,
      description: "Comprehensive ground-level photo documentation of visible damage indicators.",
      details: [
        "Systematic photo capture of all affected areas",
        "Document soft metal damage (gutters, vents, AC units)",
        "Before and after comparison photography",
        "GPS-tagged evidence collection"
      ],
      color: "from-green-500 to-emerald-500"
    },
    {
      number: 4,
      title: "Roof Section Mapping",
      icon: MapPin,
      description: "Create detailed maps of roof sections to organize and track damage assessment.",
      details: [
        "Satellite imagery integration via Google Maps",
        "Define and label distinct roof sections",
        "Mark areas of concern for detailed inspection",
        "Calculate affected square footage"
      ],
      color: "from-purple-500 to-pink-500"
    },
    {
      number: 5,
      title: "Test Square Analysis",
      icon: Ruler,
      description: "Perform standardized test square measurements to quantify damage density.",
      details: [
        "10x10 foot test square methodology",
        "Count and measure hail impacts per square",
        "Statistical extrapolation to full roof area",
        "Industry-standard damage density calculations"
      ],
      color: "from-yellow-500 to-amber-500"
    },
    {
      number: 6,
      title: "Core Sample Collection",
      icon: ClipboardCheck,
      description: "When applicable, collect physical samples to verify material condition and age.",
      details: [
        "Strategic sample location selection",
        "Proper extraction and preservation techniques",
        "Chain of custody documentation",
        "Laboratory analysis coordination"
      ],
      color: "from-teal-500 to-cyan-500"
    },
    {
      number: 7,
      title: "Damage Quantification",
      icon: Target,
      description: "Compile all findings into quantified damage assessments with repair estimates.",
      details: [
        "Aggregate data from all assessment steps",
        "Calculate repair and replacement costs",
        "Apply depreciation where applicable",
        "Generate line-item damage schedules"
      ],
      color: "from-indigo-500 to-blue-500"
    },
    {
      number: 8,
      title: "Winn Report Generation",
      icon: FileText,
      description: "Produce comprehensive, defensible reports formatted for insurance submission.",
      details: [
        "Automated report assembly from collected data",
        "Professional formatting and branding",
        "Evidence appendix compilation",
        "Executive summary generation"
      ],
      color: "from-primary to-cyan-500"
    }
  ];

  const benefits = [
    {
      icon: Shield,
      title: "Defensible Reports",
      description: "Reports that stand up to scrutiny from insurance adjusters, engineers, and legal review."
    },
    {
      icon: Target,
      title: "Consistent Results",
      description: "Standardized methodology ensures reliable, repeatable outcomes across all inspections."
    },
    {
      icon: Zap,
      title: "Faster Settlements",
      description: "Comprehensive documentation accelerates the claims process and approval rates."
    },
    {
      icon: Award,
      title: "Professional Credibility",
      description: "Certification in the Winn Methodology establishes you as an industry expert."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Winn Methodology Guide - 8-Step Damage Assessment Process"
        description="Learn the industry-leading Winn Methodology for property damage assessment. Our comprehensive 8-step process covers weather verification, thermal analysis, documentation, and professional reporting."
        canonical="/methodology"
        keywords={['Winn Methodology', 'damage assessment process', 'property inspection methodology', 'hail damage assessment steps', 'thermal analysis methodology']}
      />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <img src={winnstormLogo} alt="WinnStorm" className="h-10 w-auto cursor-pointer" />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
              <Link href="/training">
                <Button variant="ghost" size="sm">Training</Button>
              </Link>
              <Link href="/auth">
                <Button size="sm" className="bg-gradient-to-r from-primary to-cyan-500">Get Certified</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/10 to-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-[10%] w-72 h-72 bg-gradient-to-r from-primary/30 to-cyan-500/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-[15%] w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/30">Industry Standard</Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              The <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">Winn Methodology</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              A comprehensive 8-step process for property damage assessment developed by Eric Winn. 
              The gold standard for creating accurate, defensible, and professional damage reports.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-primary to-cyan-500" asChild>
                <Link href="/training">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Start Learning
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/auth">
                  Get Certified
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 border-b border-border">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6">Why the Winn Methodology?</h2>
                <p className="text-muted-foreground mb-4">
                  Developed over decades of field experience by Eric Winn, this methodology has become the 
                  industry benchmark for professional damage assessment. It provides a systematic, repeatable 
                  approach that ensures no detail is overlooked.
                </p>
                <p className="text-muted-foreground">
                  Whether you're assessing hail damage, wind damage, or water intrusion, the Winn Methodology 
                  gives you the framework to produce comprehensive reports that insurance companies trust and respect.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => {
                  const Icon = benefit.icon;
                  return (
                    <Card key={index} className="border-border/50">
                      <CardContent className="p-4">
                        <Icon className="h-8 w-8 text-primary mb-3" />
                        <h3 className="font-semibold mb-1">{benefit.title}</h3>
                        <p className="text-xs text-muted-foreground">{benefit.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8 Steps */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">The 8-Step Process</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Each step builds upon the previous, creating a comprehensive body of evidence for your assessment.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <Card 
                  key={index} 
                  className="border-border/50 overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="grid grid-cols-1 lg:grid-cols-3">
                    <div className={`p-6 bg-gradient-to-br ${step.color} text-white flex flex-col justify-center`}>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="bg-white/20 rounded-full p-3">
                          <Icon className="h-8 w-8" />
                        </div>
                        <div className="text-5xl font-bold opacity-50">0{step.number}</div>
                      </div>
                      <h3 className="text-2xl font-bold">{step.title}</h3>
                    </div>
                    <div className="lg:col-span-2 p-6">
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-1 flex-shrink-0" />
                            <span className="text-sm">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Certification CTA */}
      <section className="py-20 bg-gradient-to-r from-primary to-cyan-500 text-white">
        <div className="container mx-auto px-6 text-center">
          <Award className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Certified in the Winn Methodology</h2>
          <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
            Join hundreds of certified professionals who have mastered the Winn Methodology. 
            Our comprehensive training program takes you from fundamentals to expert-level assessments.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/training">
                View Training Courses
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/auth">
                Start Free Trial
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Additional Resources */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8 text-center">Continue Learning</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="hover:shadow-lg transition-shadow border-border/50">
              <CardContent className="p-6 text-center">
                <BookOpen className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Documentation</h3>
                <p className="text-sm text-muted-foreground mb-4">Detailed guides for each methodology step</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/docs">Read Docs</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow border-border/50">
              <CardContent className="p-6 text-center">
                <Award className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Training Portal</h3>
                <p className="text-sm text-muted-foreground mb-4">Video courses and certification exams</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/training">Start Training</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow border-border/50">
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Sample Reports</h3>
                <p className="text-sm text-muted-foreground mb-4">See real Winn Reports in action</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/reports">View Reports</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2025 WinnStorm™. All rights reserved. The Winn Methodology is a trademark of Eric Winn.</p>
        </div>
      </footer>
    </div>
  );
};

export default Methodology;
