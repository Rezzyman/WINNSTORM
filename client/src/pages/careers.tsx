import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/seo';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Users, 
  Zap, 
  Heart,
  Coffee,
  Laptop,
  TrendingUp,
  ArrowRight,
  Home,
  Building,
  Globe,
  DollarSign
} from 'lucide-react';
import winnstormLogo from '@assets/logo-dark_1765042579232.png';

const Careers = () => {
  const openPositions = [
    {
      title: "Senior Full-Stack Engineer",
      department: "Engineering",
      location: "Remote (US)",
      type: "Full-time",
      salary: "$150K - $200K",
      description: "Build and scale our damage assessment platform using React, Node.js, and PostgreSQL.",
      requirements: ["5+ years experience", "React/TypeScript", "Node.js", "PostgreSQL"]
    },
    {
      title: "AI/ML Engineer",
      department: "Engineering",
      location: "Remote (US)",
      type: "Full-time",
      salary: "$160K - $220K",
      description: "Enhance Stormy AI's thermal analysis and damage detection capabilities using GPT and computer vision.",
      requirements: ["3+ years ML experience", "Python", "Computer Vision", "LLMs"]
    },
    {
      title: "Senior Damage Assessment Consultant",
      department: "Operations",
      location: "Dallas, TX",
      type: "Full-time",
      salary: "$80K - $120K + Commission",
      description: "Lead field inspections and train junior consultants in the Winn Methodology.",
      requirements: ["5+ years roofing/claims", "Winn Certification", "Travel 50%"]
    },
    {
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Remote (US)",
      type: "Full-time",
      salary: "$70K - $90K",
      description: "Ensure our customers achieve their goals with WinnStorm platform adoption and training.",
      requirements: ["3+ years B2B SaaS", "Insurance/Construction industry", "CRM experience"]
    },
    {
      title: "Product Marketing Manager",
      department: "Marketing",
      location: "Remote (US)",
      type: "Full-time",
      salary: "$100K - $140K",
      description: "Drive go-to-market strategy and positioning for our damage assessment platform.",
      requirements: ["5+ years product marketing", "B2B SaaS", "Content creation"]
    },
    {
      title: "Training Content Developer",
      department: "Training",
      location: "Remote (US)",
      type: "Contract",
      salary: "$50 - $75/hour",
      description: "Create video courses and educational content for the Winn Methodology certification program.",
      requirements: ["Video production", "Instructional design", "Insurance/Construction knowledge"]
    }
  ];

  const benefits = [
    { icon: Laptop, title: "Remote-First", description: "Work from anywhere in the US" },
    { icon: Heart, title: "Health & Wellness", description: "Medical, dental, vision + wellness stipend" },
    { icon: TrendingUp, title: "401(k) Match", description: "4% employer match, immediate vesting" },
    { icon: Coffee, title: "Unlimited PTO", description: "Take the time you need" },
    { icon: Zap, title: "Learning Budget", description: "$2,000/year for professional development" },
    { icon: DollarSign, title: "Equity", description: "Stock options for all full-time employees" }
  ];

  const values = [
    {
      title: "Customer Obsession",
      description: "We exist to solve real problems for consultants and property owners."
    },
    {
      title: "Continuous Improvement",
      description: "We're always learning, iterating, and raising the bar."
    },
    {
      title: "Transparency",
      description: "Open communication and honest feedback drive our success."
    },
    {
      title: "Impact Over Activity",
      description: "We focus on outcomes, not just staying busy."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Careers at WinnStorm - Join Our Team"
        description="Join WinnStorm and help transform the property damage assessment industry. View open positions in engineering, operations, marketing, and more. Remote-friendly roles available."
        canonical="/careers"
        keywords={['WinnStorm careers', 'damage assessment jobs', 'property tech jobs', 'remote engineering jobs', 'insurance technology careers']}
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
              <Link href="/about">
                <Button variant="ghost" size="sm">About Us</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/10 to-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-[10%] w-72 h-72 bg-gradient-to-r from-primary/40 to-cyan-500/40 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-[15%] w-96 h-96 bg-gradient-to-r from-cyan-500/30 to-blue-500/30 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/30">We're Hiring</Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Build the Future of <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">Property Assessment</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Join a team that's revolutionizing how damage assessments are conducted. 
              We're looking for passionate people who want to make a real impact.
            </p>
            <Button size="lg" className="bg-gradient-to-r from-primary to-cyan-500" asChild>
              <a href="#positions">
                View Open Positions
                <ArrowRight className="h-5 w-5 ml-2" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b border-border">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">35+</div>
              <div className="text-sm text-muted-foreground">Team Members</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">15</div>
              <div className="text-sm text-muted-foreground">States Represented</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Remote-Friendly</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">4.8</div>
              <div className="text-sm text-muted-foreground">Glassdoor Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Join WinnStorm?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We offer competitive compensation and benefits designed to support your whole life.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="border-border/50 text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-4">
                    <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
                    <h3 className="font-semibold text-sm mb-1">{benefit.title}</h3>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Values</h2>
              <p className="text-muted-foreground">The principles that guide how we work together</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <Card key={index} className="border-border/50">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="py-20">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Open Positions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find your next opportunity and help us transform property damage assessment.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            {openPositions.map((position, index) => (
              <Card key={index} className="border-border/50 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl mb-2">{position.title}</CardTitle>
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {position.department}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {position.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {position.type}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          {position.salary}
                        </span>
                      </div>
                    </div>
                    <Button 
                      className="bg-gradient-to-r from-primary to-cyan-500 shrink-0"
                      onClick={() => window.location.href = `mailto:careers@winnstorm.com?subject=Application: ${position.title}`}
                    >
                      Apply Now
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{position.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {position.requirements.map((req, reqIndex) => (
                      <Badge key={reqIndex} variant="outline" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-cyan-500 text-white">
        <div className="container mx-auto px-6 text-center">
          <Users className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Don't See Your Role?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
            We're always looking for talented people. Send us your resume and tell us how you can contribute.
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => window.location.href = 'mailto:careers@winnstorm.com?subject=General Application'}
          >
            Send Your Resume
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2025 WinnStorm™. All rights reserved. Equal Opportunity Employer.</p>
        </div>
      </footer>
    </div>
  );
};

export default Careers;
