import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { SEO } from '@/components/seo';
import { 
  Book, 
  FileText, 
  Video, 
  Code, 
  Thermometer, 
  Camera, 
  MapPin, 
  Cloud,
  Search,
  ArrowRight,
  Clock,
  CheckCircle,
  Star,
  Download,
  ExternalLink,
  Home
} from 'lucide-react';
import winnstormLogo from '@assets/Untitled_design__72_-removebg-preview_1753995395882.png';

const Docs = () => {
  const categories = [
    {
      title: "Getting Started",
      icon: Book,
      description: "Learn the basics of WinnStorm and set up your first inspection",
      articles: [
        { title: "Quick Start Guide", time: "5 min read", popular: true },
        { title: "Account Setup & Configuration", time: "3 min read" },
        { title: "Understanding the Dashboard", time: "4 min read" },
        { title: "Your First Damage Assessment", time: "10 min read", popular: true }
      ]
    },
    {
      title: "Thermal Analysis",
      icon: Thermometer,
      description: "Master thermal imaging techniques with AI-powered analysis",
      articles: [
        { title: "Introduction to Thermal Imaging", time: "8 min read", popular: true },
        { title: "Interpreting Temperature Differentials", time: "6 min read" },
        { title: "Moisture Detection Patterns", time: "7 min read" },
        { title: "Working with Stormy AI Analysis", time: "5 min read" }
      ]
    },
    {
      title: "Photo Documentation",
      icon: Camera,
      description: "Best practices for capturing evidence during inspections",
      articles: [
        { title: "Photo Standards for Insurance Claims", time: "6 min read", popular: true },
        { title: "Documenting Hail Damage", time: "8 min read" },
        { title: "Before & After Comparison Shots", time: "4 min read" },
        { title: "Mobile Camera Tips for Field Use", time: "5 min read" }
      ]
    },
    {
      title: "Winn Reports",
      icon: FileText,
      description: "Generate comprehensive damage assessment reports",
      articles: [
        { title: "Anatomy of a Winn Report", time: "10 min read", popular: true },
        { title: "Adding Evidence to Reports", time: "5 min read" },
        { title: "Report Customization Options", time: "6 min read" },
        { title: "Exporting & Sharing Reports", time: "4 min read" }
      ]
    },
    {
      title: "Weather Verification",
      icon: Cloud,
      description: "Access historical weather data for claim support",
      articles: [
        { title: "Understanding Weather Data Sources", time: "5 min read" },
        { title: "Hail Storm Verification", time: "7 min read", popular: true },
        { title: "Wind Damage Correlation", time: "6 min read" },
        { title: "Integrating Weather Reports", time: "4 min read" }
      ]
    },
    {
      title: "Property Mapping",
      icon: MapPin,
      description: "Use satellite imagery and drawing tools effectively",
      articles: [
        { title: "Google Maps Integration Guide", time: "6 min read" },
        { title: "Marking Roof Sections", time: "5 min read", popular: true },
        { title: "Measuring Affected Areas", time: "4 min read" },
        { title: "Saving & Exporting Maps", time: "3 min read" }
      ]
    }
  ];

  const videoTutorials = [
    { title: "Complete Platform Walkthrough", duration: "15:32", views: "12.5K" },
    { title: "Thermal Analysis Deep Dive", duration: "22:18", views: "8.3K" },
    { title: "Creating Your First Winn Report", duration: "18:45", views: "10.1K" },
    { title: "Field Inspection Best Practices", duration: "25:00", views: "7.8K" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Documentation - WinnStorm Platform Guides"
        description="Comprehensive documentation for WinnStorm damage assessment platform. Learn thermal analysis, report generation, weather verification, and the Winn Methodology with step-by-step guides."
        canonical="/docs"
        keywords={['WinnStorm documentation', 'damage assessment guide', 'thermal imaging tutorial', 'property inspection training', 'Winn Report guide']}
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
                <Button size="sm" className="bg-gradient-to-r from-primary to-cyan-500">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-6 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">Documentation</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            WinnStorm <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">Documentation</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Everything you need to master damage assessment with WinnStorm. From getting started to advanced techniques, we've got you covered.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search documentation..." 
              className="pl-12 h-14 text-lg bg-card border-border"
              data-testid="input-docs-search"
            />
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/methodology">
                <Book className="h-4 w-4 mr-2" />
                Winn Methodology
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/api-docs">
                <Code className="h-4 w-4 mr-2" />
                API Reference
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/support">
                <FileText className="h-4 w-4 mr-2" />
                Support Center
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/training">
                <Video className="h-4 w-4 mr-2" />
                Training Portal
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Documentation Categories */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8">Browse by Topic</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow border-border/50 h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{category.title}</CardTitle>
                    </div>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {category.articles.map((article, artIndex) => (
                        <li key={artIndex}>
                          <a 
                            href="#" 
                            className="flex items-center justify-between text-sm hover:text-primary transition-colors group"
                          >
                            <span className="flex items-center gap-2">
                              {article.title}
                              {article.popular && (
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              )}
                            </span>
                            <span className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {article.time}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                    <Button variant="ghost" size="sm" className="mt-4 w-full">
                      View All Articles
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Tutorials */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Video Tutorials</h2>
              <p className="text-muted-foreground">Learn visually with our expert-led tutorials</p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/training">
                View All
                <ExternalLink className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {videoTutorials.map((video, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-4">
                  <div className="aspect-video bg-gradient-to-br from-primary/20 to-cyan-500/20 rounded-lg mb-4 flex items-center justify-center group-hover:from-primary/30 group-hover:to-cyan-500/30 transition-colors">
                    <Video className="h-12 w-12 text-primary/60" />
                  </div>
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">{video.title}</h3>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{video.duration}</span>
                    <span>{video.views} views</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Downloads Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8">Downloadable Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/50">
              <CardContent className="p-6">
                <Download className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Inspection Checklist</h3>
                <p className="text-sm text-muted-foreground mb-4">Complete checklist for comprehensive property inspections</p>
                <Button variant="outline" size="sm" className="w-full">
                  Download PDF
                </Button>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <Download className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Report Templates</h3>
                <p className="text-sm text-muted-foreground mb-4">Pre-formatted templates for various damage types</p>
                <Button variant="outline" size="sm" className="w-full">
                  Download Pack
                </Button>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-6">
                <Download className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold mb-2">Quick Reference Card</h3>
                <p className="text-sm text-muted-foreground mb-4">Pocket-sized guide for field use</p>
                <Button variant="outline" size="sm" className="w-full">
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-cyan-500 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Need More Help?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Can't find what you're looking for? Our support team is ready to assist you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/support">
                Contact Support
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/training">
                Start Training
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

export default Docs;
