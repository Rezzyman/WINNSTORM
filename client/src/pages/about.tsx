import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEO, organizationSchema } from '@/components/seo';
import { 
  Target, 
  Users, 
  Award, 
  Shield, 
  Heart,
  Zap,
  Globe,
  ArrowRight,
  Home,
  CheckCircle,
  Building,
  TrendingUp
} from 'lucide-react';
import winnstormLogo from '@assets/Untitled_design__72_-removebg-preview_1753995395882.png';

const About = () => {
  const values = [
    {
      icon: Target,
      title: "Precision",
      description: "Every assessment is conducted with meticulous attention to detail, ensuring accurate and reliable results."
    },
    {
      icon: Shield,
      title: "Integrity",
      description: "We uphold the highest ethical standards in all our work, providing honest and unbiased assessments."
    },
    {
      icon: Heart,
      title: "Service",
      description: "We're committed to helping property owners and consultants navigate the claims process with confidence."
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We continuously improve our technology and methodology to stay at the forefront of the industry."
    }
  ];

  const stats = [
    { value: "10,000+", label: "Properties Assessed" },
    { value: "750+", label: "Certified Consultants" },
    { value: "98.7%", label: "Accuracy Rate" },
    { value: "50", label: "States Covered" }
  ];

  const milestones = [
    { year: "2010", event: "Eric Winn develops the foundational damage assessment methodology" },
    { year: "2015", event: "First formal certification program launched" },
    { year: "2018", event: "Thermal analysis integration and AI development begins" },
    { year: "2022", event: "WinnStorm platform launched with Stormy AI assistant" },
    { year: "2024", event: "Mobile-first redesign and nationwide expansion" },
    { year: "2025", event: "GPT-5.1 integration for advanced AI guidance" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="About WinnStorm - Our Mission & Story"
        description="Learn about WinnStorm and our mission to revolutionize property damage assessment. Founded on Eric Winn's proven methodology, we combine decades of expertise with cutting-edge AI technology."
        canonical="/about"
        keywords={['WinnStorm company', 'about WinnStorm', 'Eric Winn methodology', 'damage assessment company', 'property inspection platform']}
        structuredData={[organizationSchema]}
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
              <Link href="/auth">
                <Button size="sm" className="bg-gradient-to-r from-primary to-cyan-500">Get Started</Button>
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
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/30">About Us</Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Transforming Damage Assessment Through <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">Expertise & Technology</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              WinnStorm combines decades of field expertise with cutting-edge AI to help consultants 
              deliver accurate, comprehensive damage assessments that stand up to scrutiny.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b border-border">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <Badge className="mb-4 bg-green-500/10 text-green-500 border-green-500/30">Our Mission</Badge>
                <h2 className="text-3xl font-bold mb-6">Empowering Consultants to Deliver Excellence</h2>
                <p className="text-muted-foreground mb-4">
                  Our mission is to democratize access to professional-grade damage assessment tools and training. 
                  We believe that every property owner deserves an accurate, fair assessment of storm damage, 
                  and every consultant deserves the tools to deliver that.
                </p>
                <p className="text-muted-foreground mb-6">
                  By combining Eric Winn's proven methodology with advanced AI technology, we're making 
                  expert-level assessments accessible to consultants at every stage of their career.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Standardized methodology for consistent results</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>AI-powered guidance for every inspection</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Comprehensive training and certification</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gradient-to-br from-primary/10 to-cyan-500/10 rounded-2xl p-8 border border-primary/20">
                <div className="grid grid-cols-2 gap-6">
                  {values.map((value, index) => {
                    const Icon = value.icon;
                    return (
                      <div key={index} className="text-center">
                        <div className="bg-background rounded-full p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center shadow-lg">
                          <Icon className="h-7 w-7 text-primary" />
                        </div>
                        <h3 className="font-semibold mb-1">{value.title}</h3>
                        <p className="text-xs text-muted-foreground">{value.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">Our Story</Badge>
              <h2 className="text-3xl font-bold mb-4">From Field Experience to Industry Standard</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                WinnStorm was born from Eric Winn's decades of experience in property damage assessment 
                and his vision to share that expertise with the next generation of consultants.
              </p>
            </div>

            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-cyan-500"></div>
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <div key={index} className="relative pl-20">
                    <div className="absolute left-5 top-1 w-6 h-6 bg-gradient-to-r from-primary to-cyan-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <div className="bg-card border border-border/50 rounded-lg p-4">
                      <div className="text-sm text-primary font-semibold mb-1">{milestone.year}</div>
                      <div className="text-muted-foreground">{milestone.event}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Vision */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Building className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3">Industry Leadership</h3>
                  <p className="text-muted-foreground">
                    Setting the standard for property damage assessment methodology and certification.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3">Continuous Innovation</h3>
                  <p className="text-muted-foreground">
                    Investing in AI and technology to keep our platform at the cutting edge.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/50 hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-3">Nationwide Reach</h3>
                  <p className="text-muted-foreground">
                    Supporting consultants and property owners across all 50 states.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-cyan-500 text-white">
        <div className="container mx-auto px-6 text-center">
          <Users className="h-16 w-16 mx-auto mb-6 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Join the WinnStorm Community</h2>
          <p className="text-xl opacity-90 mb-8 max-w-3xl mx-auto">
            Whether you're starting your career or a seasoned professional, WinnStorm has the tools 
            and training to help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth">
                Start Free Trial
                <ArrowRight className="h-5 w-5 ml-2" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/careers">
                View Careers
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; 2025 WinnStorm™. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default About;
