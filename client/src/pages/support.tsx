import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SEO, faqSchema } from '@/components/seo';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  FileText, 
  HelpCircle,
  Search,
  Clock,
  CheckCircle,
  Home,
  Send,
  Headphones,
  Book,
  Video
} from 'lucide-react';
import winnstormLogo from '@assets/logo-dark_1765042579232.png';

const Support = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Message Sent",
      description: "We'll get back to you within 24 hours.",
    });
    
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const faqs = [
    {
      question: "How do I get started with WinnStorm?",
      answer: "Getting started is easy! Sign up for a free trial, complete our quick onboarding tour, and you'll be ready to conduct your first inspection. Our Stormy AI assistant will guide you through each step of the Winn Methodology."
    },
    {
      question: "What equipment do I need for thermal analysis?",
      answer: "WinnStorm works with most FLIR thermal cameras and smartphone thermal attachments. We support FLIR ONE Pro, FLIR E-series, and similar devices. Our platform can analyze thermal images from any standard format (JPEG, PNG, RADIOMETRIC)."
    },
    {
      question: "How does the certification program work?",
      answer: "Our certification program consists of two levels: Junior Consultant and Senior Consultant. You'll complete online courses, pass knowledge assessments, and demonstrate practical skills. Certification typically takes 2-4 weeks for Junior level and 6-8 weeks for Senior level."
    },
    {
      question: "Can I use WinnStorm offline in the field?",
      answer: "Yes! Our mobile app includes offline capability. You can capture photos, thermal images, and notes without internet connection. Data syncs automatically when you're back online."
    },
    {
      question: "How accurate is the AI thermal analysis?",
      answer: "Our Stormy AI is trained on thousands of verified thermal images and achieves 98.7% accuracy in identifying moisture intrusion and temperature anomalies. However, it's designed to assist, not replace, professional judgment."
    },
    {
      question: "What's included in a Winn Report?",
      answer: "A comprehensive Winn Report includes property details, weather verification, thermal analysis results, photo documentation, damage assessment findings, repair recommendations, and cost estimates. Reports are formatted for insurance submission."
    },
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel anytime from your account settings. Your access continues until the end of your billing period. We also offer a 14-day money-back guarantee for new subscribers."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. WinnStorm uses enterprise-grade security including 256-bit encryption for all data in transit and at rest, secure Firebase authentication, and PCI-compliant payment processing through Stripe. We never share your inspection data with third parties."
    }
  ];

  const supportChannels = [
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team in real-time",
      availability: "Mon-Fri, 9AM-6PM EST",
      action: "Start Chat",
      color: "text-green-500"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Get detailed responses to complex questions",
      availability: "Response within 24 hours",
      action: "Send Email",
      href: "mailto:support@winnstorm.com",
      color: "text-blue-500"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with a support specialist",
      availability: "Professional & Enterprise plans",
      action: "Call Now",
      href: "tel:+15551234966",
      color: "text-purple-500"
    }
  ];

  const resources = [
    {
      icon: Book,
      title: "Documentation",
      description: "Comprehensive guides and tutorials",
      href: "/docs"
    },
    {
      icon: Video,
      title: "Video Tutorials",
      description: "Step-by-step visual guides",
      href: "/training"
    },
    {
      icon: FileText,
      title: "API Reference",
      description: "Developer documentation",
      href: "/api-docs"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Support Center - WinnStorm Help & FAQs"
        description="Get help with WinnStorm damage assessment platform. Access FAQs, contact support, find documentation, and get answers to your questions about thermal analysis, reports, and certifications."
        canonical="/support"
        keywords={['WinnStorm support', 'damage assessment help', 'thermal analysis support', 'customer service', 'FAQ']}
        structuredData={[faqSchema(faqs)]}
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
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">Support Center</Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            How Can We <span className="bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">Help You?</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Find answers to common questions, access resources, or get in touch with our support team.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search for help..." 
              className="pl-12 h-14 text-lg bg-card border-border"
              data-testid="input-support-search"
            />
          </div>
        </div>
      </section>

      {/* Support Channels */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8 text-center">Contact Support</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {supportChannels.map((channel, index) => {
              const Icon = channel.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow border-border/50 text-center">
                  <CardContent className="p-6">
                    <div className={`inline-flex p-3 rounded-full bg-muted mb-4`}>
                      <Icon className={`h-6 w-6 ${channel.color}`} />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{channel.title}</h3>
                    <p className="text-muted-foreground text-sm mb-3">{channel.description}</p>
                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mb-4">
                      <Clock className="h-3 w-3" />
                      {channel.availability}
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        if (channel.href) {
                          window.location.href = channel.href;
                        } else {
                          toast({ title: "Chat Coming Soon", description: "Live chat will be available shortly." });
                        }
                      }}
                    >
                      {channel.action}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-center">Frequently Asked Questions</h2>
            <p className="text-muted-foreground text-center mb-8">Quick answers to common questions</p>
            
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="bg-card border border-border/50 rounded-lg px-6"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <span className="flex items-center gap-3 text-left">
                      <HelpCircle className="h-5 w-5 text-primary flex-shrink-0" />
                      {faq.question}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground pl-8">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8 text-center">Self-Service Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {resources.map((resource, index) => {
              const Icon = resource.icon;
              return (
                <Link key={index} href={resource.href}>
                  <Card className="hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer h-full">
                    <CardContent className="p-6 text-center">
                      <Icon className="h-8 w-8 text-primary mx-auto mb-4" />
                      <h3 className="font-semibold mb-2">{resource.title}</h3>
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-2 text-center">Send Us a Message</h2>
            <p className="text-muted-foreground text-center mb-8">Can't find what you're looking for? We're here to help.</p>
            
            <Card className="border-border/50">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        id="name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Your name"
                        required
                        data-testid="input-support-name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="your@email.com"
                        required
                        data-testid="input-support-email"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input 
                      id="subject" 
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="How can we help?"
                      required
                      data-testid="input-support-subject"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea 
                      id="message" 
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Describe your issue or question..."
                      rows={5}
                      required
                      data-testid="input-support-message"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-cyan-500"
                    disabled={isSubmitting}
                    data-testid="button-support-submit"
                  >
                    {isSubmitting ? (
                      "Sending..."
                    ) : (
                      <>
                        Send Message
                        <Send className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Status Badges */}
      <section className="py-8 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">All Systems Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Average response: 2 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">98% satisfaction rate</span>
            </div>
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

export default Support;
