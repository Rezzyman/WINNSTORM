import { Header, Footer } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/seo';
import { Link } from 'wouter';
import { 
  Shield, CheckCircle, Phone, ArrowRight, Star,
  Thermometer, CloudLightning, Droplets, Wind,
  FileText, Camera, Target, Zap, Award, Clock,
  Building2, Home, Ruler, AlertTriangle
} from 'lucide-react';

interface ServiceConfig {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  metaDescription: string;
  keywords: string[];
  icon: typeof Thermometer;
  heroColor: string;
  benefits: Array<{
    icon: typeof Shield;
    title: string;
    description: string;
  }>;
  process: Array<{
    step: string;
    title: string;
    description: string;
  }>;
  useCases: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

const serviceConfigs: Record<string, ServiceConfig> = {
  'thermal-inspection': {
    id: 'thermal-inspection',
    name: 'Thermal Inspection Services',
    slug: 'thermal-inspection',
    tagline: 'See What the Naked Eye Cannot',
    description: 'Our AI-powered thermal imaging technology detects hidden moisture, insulation deficiencies, and structural damage invisible to standard visual inspections. Using FLIR-certified equipment and the proven Winn Methodology, we provide comprehensive thermal analysis for residential and commercial properties.',
    metaDescription: 'Professional thermal imaging inspection services for property damage assessment. AI-powered thermal cameras detect hidden moisture, heat loss, and structural issues. FLIR-certified equipment with comprehensive reporting.',
    keywords: [
      'thermal inspection services',
      'thermal imaging property inspection',
      'infrared building inspection',
      'moisture detection thermal camera',
      'FLIR thermal inspection',
      'thermal roof inspection',
      'heat loss detection',
      'thermal imaging for insurance claims'
    ],
    icon: Thermometer,
    heroColor: 'from-red-600 to-orange-500',
    benefits: [
      {
        icon: Droplets,
        title: 'Hidden Moisture Detection',
        description: 'Identify water intrusion behind walls, under roofing, and in ceiling cavities before visible damage occurs.'
      },
      {
        icon: Zap,
        title: 'Energy Loss Identification',
        description: 'Pinpoint areas of heat loss, thermal bridging, and insulation gaps costing you money.'
      },
      {
        icon: AlertTriangle,
        title: 'Electrical Hotspot Detection',
        description: 'Locate overheating electrical components and potential fire hazards in your property.'
      },
      {
        icon: FileText,
        title: 'Insurance-Ready Reports',
        description: 'Comprehensive thermal analysis reports formatted for insurance claims with AI-generated insights.'
      }
    ],
    process: [
      { step: '1', title: 'Pre-Inspection Analysis', description: 'Review property details and identify optimal thermal imaging conditions' },
      { step: '2', title: 'Thermal Scanning', description: 'Systematic thermal imaging of all exterior and interior surfaces' },
      { step: '3', title: 'AI Analysis', description: 'Stormy AI processes thermal data to identify anomalies automatically' },
      { step: '4', title: 'Detailed Reporting', description: 'Receive comprehensive thermal analysis with actionable recommendations' }
    ],
    useCases: [
      'Post-storm moisture intrusion assessment',
      'Pre-purchase property inspections',
      'Roof leak detection and tracing',
      'HVAC efficiency evaluation',
      'Flat roof membrane inspection',
      'Electrical system safety audits',
      'Energy audit and weatherization',
      'Insurance claim documentation'
    ],
    faqs: [
      {
        question: 'What can thermal imaging detect that visual inspection cannot?',
        answer: 'Thermal imaging detects temperature variations that reveal hidden issues: moisture behind walls and ceilings, missing or damaged insulation, thermal bridging, air leaks, electrical hotspots, and plumbing leaks - all before they cause visible damage or become major problems.'
      },
      {
        question: 'How accurate is thermal imaging for detecting roof leaks?',
        answer: 'When performed under proper conditions (after sunset, minimal wind, recent solar exposure), thermal imaging is extremely accurate for detecting moisture in roofing systems. Our FLIR-certified equipment can detect temperature differentials as small as 0.1°C, pinpointing moisture locations with precision.'
      },
      {
        question: 'Will thermal inspection work for my insurance claim?',
        answer: 'Yes, our thermal inspection reports are specifically formatted for insurance claims. We follow the Winn Methodology standards and provide AI-analyzed evidence with clear documentation that insurance adjusters recognize and accept.'
      },
      {
        question: 'How long does a thermal inspection take?',
        answer: 'A typical residential thermal inspection takes 2-4 hours depending on property size. Commercial properties may require 4-8 hours. We schedule inspections during optimal thermal imaging conditions (typically early morning or after sunset) for the most accurate results.'
      }
    ]
  },
  'hail-damage-assessment': {
    id: 'hail-damage-assessment',
    name: 'Hail Damage Assessment',
    slug: 'hail-damage-assessment',
    tagline: 'Document Every Impact, Maximize Your Claim',
    description: 'Hail damage can be subtle yet devastating to your roof and property. Our certified consultants use the 8-step Winn Methodology to systematically document hail impacts, measure damage density, and create comprehensive reports that insurance companies trust for fair settlements.',
    metaDescription: 'Professional hail damage assessment services using the proven Winn Methodology. Certified consultants document hail impacts with thermal imaging and test square analysis for maximum insurance claim settlements.',
    keywords: [
      'hail damage assessment',
      'hail damage roof inspection',
      'hail damage consultant',
      'hail damage insurance claim',
      'hail impact documentation',
      'roof hail damage inspection',
      'certified hail damage assessor',
      'hail storm property damage'
    ],
    icon: CloudLightning,
    heroColor: 'from-blue-600 to-cyan-500',
    benefits: [
      {
        icon: Target,
        title: 'Test Square Analysis',
        description: 'Industry-standard 10x10 test squares to accurately quantify damage density across your entire roof.'
      },
      {
        icon: Camera,
        title: 'Comprehensive Photo Documentation',
        description: 'GPS-tagged photography of every impact point, soft metal damage, and affected component.'
      },
      {
        icon: Thermometer,
        title: 'Thermal Moisture Detection',
        description: 'Identify moisture intrusion from hail penetration using advanced thermal imaging technology.'
      },
      {
        icon: Shield,
        title: 'Insurance Advocacy',
        description: 'Reports designed to support your claim with evidence that adjusters cannot dispute.'
      }
    ],
    process: [
      { step: '1', title: 'Weather Verification', description: 'Confirm hail event occurred using NOAA and NWS historical data' },
      { step: '2', title: 'Ground-Level Assessment', description: 'Document soft metal damage to gutters, vents, and AC units' },
      { step: '3', title: 'Roof Test Squares', description: 'Systematic damage density measurement across all roof sections' },
      { step: '4', title: 'Winn Report Generation', description: 'Compile all evidence into a comprehensive, defensible report' }
    ],
    useCases: [
      'Recent hail storm damage documentation',
      'Disputed insurance claims',
      'Pre-listing roof inspections after storms',
      'Commercial property hail assessment',
      'Multi-family dwelling inspections',
      'Agricultural facility damage assessment',
      'Vehicle damage correlation',
      'Historical storm damage claims'
    ],
    faqs: [
      {
        question: 'How soon after a hail storm should I get an assessment?',
        answer: 'We recommend getting an assessment within 30-60 days of a hail event. While damage can be documented years later, earlier assessment ensures fresher evidence and easier correlation to specific storm events. Many insurance policies have time limits for filing claims.'
      },
      {
        question: 'What size hail causes roof damage?',
        answer: 'Hail as small as 1 inch (quarter-sized) can damage asphalt shingles. The Winn Methodology documents damage from hail of all sizes, as cumulative smaller impacts can cause significant deterioration. Our thermal imaging also detects underlying moisture damage from hail penetration.'
      },
      {
        question: 'Will a hail damage assessment help my insurance claim?',
        answer: 'Absolutely. Our Winn Reports provide the detailed, defensible documentation insurance companies require. We include weather verification, test square measurements, photographic evidence, and damage quantification that has helped thousands of property owners receive fair claim settlements.'
      },
      {
        question: 'What if my insurance company already denied my claim?',
        answer: 'A professional Winn Report can provide new evidence to support an appeal or appraisal process. Our comprehensive documentation often reveals damage that initial adjuster inspections missed, especially moisture intrusion detected through thermal imaging.'
      }
    ]
  },
  'storm-damage-consulting': {
    id: 'storm-damage-consulting',
    name: 'Storm Damage Consulting',
    slug: 'storm-damage-consulting',
    tagline: 'Expert Guidance Through the Claims Process',
    description: 'From hurricanes to tornadoes, our certified storm damage consultants provide expert assessment and advocacy for all types of weather-related property damage. We combine decades of experience with cutting-edge AI technology to document damage thoroughly and guide you through the insurance claims process.',
    metaDescription: 'Professional storm damage consulting services for hurricanes, tornadoes, wind, and flood damage. Certified consultants provide expert assessment, documentation, and insurance claim guidance using the Winn Methodology.',
    keywords: [
      'storm damage consultant',
      'hurricane damage assessment',
      'tornado damage inspection',
      'wind damage property assessment',
      'storm damage insurance claim',
      'property damage consultant',
      'weather damage expert',
      'storm restoration consultant'
    ],
    icon: Wind,
    heroColor: 'from-purple-600 to-indigo-500',
    benefits: [
      {
        icon: Award,
        title: 'Winn Methodology Certified',
        description: 'Our consultants are trained in the industry gold standard for storm damage assessment and documentation.'
      },
      {
        icon: Building2,
        title: 'All Property Types',
        description: 'Residential, commercial, industrial, and multi-family property expertise for comprehensive damage assessment.'
      },
      {
        icon: FileText,
        title: 'Claims Support',
        description: 'End-to-end guidance through the insurance claims process with documentation that gets results.'
      },
      {
        icon: Zap,
        title: 'Rapid Response',
        description: '24-48 hour deployment for emergency assessments after major storm events.'
      }
    ],
    process: [
      { step: '1', title: 'Emergency Assessment', description: 'Rapid initial inspection to document immediate damage and safety concerns' },
      { step: '2', title: 'Comprehensive Inspection', description: 'Full 8-step Winn Methodology assessment with thermal imaging' },
      { step: '3', title: 'Damage Quantification', description: 'Detailed cost analysis and repair scope development' },
      { step: '4', title: 'Claims Advocacy', description: 'Support through the insurance process including adjuster meetings' }
    ],
    useCases: [
      'Hurricane and tropical storm damage',
      'Tornado damage assessment',
      'Straight-line wind damage',
      'Flood and water damage documentation',
      'Lightning strike damage',
      'Tree and debris impact damage',
      'Commercial property restoration consulting',
      'Catastrophic loss documentation'
    ],
    faqs: [
      {
        question: 'What types of storm damage do you assess?',
        answer: 'We assess all weather-related damage including: hail, wind (straight-line and tornadic), hurricane, tropical storm, flooding, lightning strikes, ice storms, and any combination of these events. Our consultants are trained to document and differentiate between damage types.'
      },
      {
        question: 'How is storm damage consulting different from a regular inspection?',
        answer: 'Storm damage consulting goes beyond simple inspection. We provide comprehensive damage documentation, repair scope development, cost analysis, and advocacy throughout the insurance claims process. Our goal is ensuring you receive fair compensation for all storm-related damage.'
      },
      {
        question: 'Can you help with both residential and commercial properties?',
        answer: 'Yes, our certified consultants have experience with all property types: single-family homes, multi-family dwellings, commercial buildings, industrial facilities, agricultural structures, and institutional properties. We tailor our approach to each property\'s unique requirements.'
      },
      {
        question: 'What should I do immediately after storm damage occurs?',
        answer: 'First, ensure safety and document any emergency repairs needed. Take photos and videos of visible damage. Contact your insurance company to report the claim, then schedule a professional assessment. Avoid making permanent repairs until damage is properly documented.'
      }
    ]
  }
};

const generateServiceSchema = (service: ServiceConfig) => {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": service.name,
    "description": service.description,
    "provider": {
      "@type": "Organization",
      "name": "WinnStorm™",
      "url": "https://winnstorm.com"
    },
    "serviceType": service.name,
    "areaServed": {
      "@type": "Country",
      "name": "United States"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": `${service.name} Packages`,
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": `Basic ${service.name}`
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": `Comprehensive ${service.name}`
          }
        }
      ]
    }
  };
};

const generateFAQSchema = (faqs: ServiceConfig['faqs']) => {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
};

export function ServiceLandingPage({ serviceSlug }: { serviceSlug: string }) {
  const service = serviceConfigs[serviceSlug];
  
  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Service not found</p>
      </div>
    );
  }

  const ServiceIcon = service.icon;
  const serviceSchema = generateServiceSchema(service);
  const faqSchema = generateFAQSchema(service.faqs);

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid={`service-page-${serviceSlug}`}>
      <SEO
        title={`${service.name} - Professional Property Assessment | WinnStorm`}
        description={service.metaDescription}
        canonical={`/services/${service.slug}`}
        keywords={service.keywords}
      />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className={`py-20 px-6 bg-gradient-to-br ${service.heroColor} text-white relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-[10%] w-72 h-72 bg-white/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-[15%] w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          </div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <ServiceIcon className="h-6 w-6" />
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                Professional Service
              </Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
              {service.name}
            </h1>
            <p className="text-2xl opacity-90 mb-6">{service.tagline}</p>
            
            <p className="text-lg opacity-80 max-w-3xl mb-8">
              {service.description}
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/auth">
                <Button size="lg" variant="secondary" className="text-gray-900" data-testid="button-get-started">
                  Get Free Assessment
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/methodology">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-gray-900">
                  Learn the Methodology
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 px-6 bg-background">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              Why Choose WinnStorm {service.name}
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Industry-leading technology combined with certified expertise for accurate, defensible assessments.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {service.benefits.map((benefit, index) => {
                const BenefitIcon = benefit.icon;
                return (
                  <Card key={index} className="border-border/50 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <BenefitIcon className="h-10 w-10 text-primary mb-2" />
                      <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm">{benefit.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              Our {service.name} Process
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              A systematic approach using the proven Winn Methodology for thorough, professional results.
            </p>
            
            <div className="grid md:grid-cols-4 gap-6">
              {service.process.map((step, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">{step.step}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases Section */}
        <section className="py-16 px-6 bg-background">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              When You Need {service.name}
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Common situations where professional assessment makes all the difference.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {service.useCases.map((useCase, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{useCase}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-center mb-12">
              Get answers to common questions about our {service.name.toLowerCase()}.
            </p>
            
            <div className="space-y-6">
              {service.faqs.map((faq, index) => (
                <Card key={index} className="border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 px-6 bg-background">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-6 w-6 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-2xl font-bold mb-2">4.9 out of 5 stars</p>
            <p className="text-muted-foreground mb-8">Trusted by thousands of property owners nationwide</p>
            
            <div className="flex flex-wrap justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">15,000+</p>
                <p className="text-sm text-muted-foreground">Inspections Completed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">$50M+</p>
                <p className="text-sm text-muted-foreground">Claims Recovered</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">500+</p>
                <p className="text-sm text-muted-foreground">Certified Consultants</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-dark py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready for Your {service.name}?
            </h2>
            <p className="text-lg text-white/70 mb-8">
              Schedule your free consultation with a certified WinnStorm damage assessment consultant today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth">
                <Button className="btn-primary" size="lg" data-testid="button-cta-bottom">
                  Get Started Now
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline" className="btn-secondary" size="lg">
                  View Pricing
                </Button>
              </Link>
            </div>
            
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/60">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>24-48 Hour Response</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Winn Methodology Certified</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>(800) WINNSTORM</span>
              </div>
            </div>
          </div>
        </section>

        {/* Related Services */}
        <section className="py-16 px-6 bg-background">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Related Services</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {Object.values(serviceConfigs)
                .filter(s => s.id !== service.id)
                .map((relatedService) => {
                  const RelatedIcon = relatedService.icon;
                  return (
                    <Link key={relatedService.id} href={`/services/${relatedService.slug}`}>
                      <Card className="border-border/50 hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardContent className="p-6">
                          <RelatedIcon className="h-8 w-8 text-primary mb-4" />
                          <h3 className="font-bold mb-2">{relatedService.name}</h3>
                          <p className="text-sm text-muted-foreground mb-4">{relatedService.tagline}</p>
                          <span className="text-primary text-sm font-medium flex items-center">
                            Learn More <ArrowRight className="h-4 w-4 ml-1" />
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

export function ThermalInspectionPage() {
  return <ServiceLandingPage serviceSlug="thermal-inspection" />;
}

export function HailDamageAssessmentPage() {
  return <ServiceLandingPage serviceSlug="hail-damage-assessment" />;
}

export function StormDamageConsultingPage() {
  return <ServiceLandingPage serviceSlug="storm-damage-consulting" />;
}
