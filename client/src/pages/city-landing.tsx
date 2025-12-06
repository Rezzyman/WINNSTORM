import { Header, Footer } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/seo';
import { Link } from 'wouter';
import { 
  Shield, MapPin, Phone, Clock, Star, CheckCircle, 
  CloudLightning, Thermometer, FileText, Users
} from 'lucide-react';

interface CityConfig {
  name: string;
  state: string;
  stateAbbrev: string;
  slug: string;
  phone: string;
  address: string;
  zipCode: string;
  serviceArea: string[];
  commonStorms: string[];
  lat: number;
  lng: number;
  heroImage?: string;
}

interface LocalBusinessSchema {
  "@context": string;
  "@type": string;
  name: string;
  description: string;
  url: string;
  telephone: string;
  address: {
    "@type": string;
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  geo: {
    "@type": string;
    latitude: number;
    longitude: number;
  };
  openingHoursSpecification: {
    "@type": string;
    dayOfWeek: string[];
    opens: string;
    closes: string;
  };
  sameAs: string[];
  areaServed: {
    "@type": string;
    name: string;
  }[];
  priceRange: string;
  aggregateRating?: {
    "@type": string;
    ratingValue: string;
    reviewCount: string;
  };
}

const cityConfigs: Record<string, CityConfig> = {
  dallas: {
    name: 'Dallas',
    state: 'Texas',
    stateAbbrev: 'TX',
    slug: 'dallas',
    phone: '(214) 555-WINN',
    address: '2001 Ross Ave, Suite 700',
    zipCode: '75201',
    lat: 32.7767,
    lng: -96.7970,
    serviceArea: ['Dallas', 'Fort Worth', 'Plano', 'Irving', 'Arlington', 'Frisco', 'McKinney', 'Garland'],
    commonStorms: ['Hail Storms', 'Severe Thunderstorms', 'Tornadoes', 'Wind Damage']
  },
  houston: {
    name: 'Houston',
    state: 'Texas',
    stateAbbrev: 'TX',
    slug: 'houston',
    phone: '(713) 555-WINN',
    address: '1000 Louisiana St, Suite 4800',
    zipCode: '77002',
    lat: 29.7604,
    lng: -95.3698,
    serviceArea: ['Houston', 'Katy', 'Sugar Land', 'The Woodlands', 'Pearland', 'League City', 'Pasadena', 'Baytown'],
    commonStorms: ['Hurricanes', 'Tropical Storms', 'Flash Flooding', 'Hail Storms']
  },
  'kansas-city': {
    name: 'Kansas City',
    state: 'Missouri',
    stateAbbrev: 'MO',
    slug: 'kansas-city',
    phone: '(816) 555-WINN',
    address: '1100 Main St, Suite 2000',
    zipCode: '64105',
    lat: 39.0997,
    lng: -94.5786,
    serviceArea: ['Kansas City MO', 'Kansas City KS', 'Overland Park', 'Olathe', 'Independence', 'Lee\'s Summit', 'Shawnee', 'Blue Springs'],
    commonStorms: ['Tornadoes', 'Hail Storms', 'Severe Thunderstorms', 'Ice Storms']
  }
};

const generateLocalBusinessSchema = (city: CityConfig): LocalBusinessSchema => {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `WinnStorm Damage Assessment - ${city.name}`,
    description: `Professional roof and property damage assessment services in ${city.name}, ${city.state}. Certified damage consultants using AI-powered thermal imaging and the proven Winn Methodology.`,
    url: `https://winnstorm.com/${city.slug}`,
    telephone: city.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: city.address,
      addressLocality: city.name,
      addressRegion: city.stateAbbrev,
      postalCode: city.zipCode,
      addressCountry: "US"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: city.lat,
      longitude: city.lng
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "18:00"
    },
    sameAs: [
      "https://www.facebook.com/WinnStorm",
      "https://www.linkedin.com/company/winnstorm"
    ],
    areaServed: city.serviceArea.map(area => ({
      "@type": "City",
      name: area
    })),
    priceRange: "$$",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "127"
    }
  };
};

export function CityLandingPage({ citySlug }: { citySlug: string }) {
  const city = cityConfigs[citySlug];
  
  if (!city) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>City not found</p>
      </div>
    );
  }

  const localBusinessSchema = generateLocalBusinessSchema(city);

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid={`city-page-${citySlug}`}>
      <SEO
        title={`Storm Damage Assessment in ${city.name}, ${city.state} - WinnStorm`}
        description={`Professional roof and property damage assessment in ${city.name}. Certified consultants using AI-powered thermal imaging. Free inspections after ${city.commonStorms[0].toLowerCase()}.`}
        canonical={`/${city.slug}`}
        keywords={[
          `${city.name} roof damage assessment`,
          `${city.name} hail damage inspection`,
          `storm damage consultant ${city.name}`,
          `thermal imaging ${city.name}`,
          `roof inspection ${city.name} ${city.state}`
        ]}
      />
      
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      
      <Header />
      
      <main className="flex-grow">
        <section className="section-dark py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-5 w-5 text-primary" />
              <span className="text-white/60 font-heading uppercase text-sm tracking-wide">
                {city.name}, {city.state}
              </span>
            </div>
            
            <h1 className="headline-xl text-white mb-6">
              Storm Damage Assessment<br />
              <span className="text-primary">in {city.name}</span>
            </h1>
            
            <p className="body-lg text-white/70 max-w-2xl mb-8">
              Certified damage assessment consultants serving the greater {city.name} area. 
              Using AI-powered thermal imaging and the proven Winn Methodology to document 
              storm damage accurately and professionally.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <Link href="/auth">
                <Button className="btn-primary" data-testid="button-get-started">
                  Get Free Assessment
                </Button>
              </Link>
              <a href={`tel:${city.phone.replace(/[^0-9]/g, '')}`}>
                <Button variant="outline" className="btn-secondary">
                  <Phone className="h-4 w-4 mr-2" />
                  {city.phone}
                </Button>
              </a>
            </div>

            <div className="flex flex-wrap gap-3">
              {city.commonStorms.map((storm) => (
                <Badge 
                  key={storm} 
                  variant="outline" 
                  className="border-primary/50 text-primary px-4 py-2"
                >
                  <CloudLightning className="h-3 w-3 mr-2" />
                  {storm}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-background">
          <div className="max-w-6xl mx-auto">
            <h2 className="headline-lg text-center mb-12">
              Why {city.name} Property Owners Choose WinnStorm
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="card-sharp">
                <CardHeader>
                  <Thermometer className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>AI-Powered Thermal Imaging</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Our advanced thermal cameras detect moisture intrusion and hidden damage 
                    invisible to the naked eye, ensuring complete documentation of storm impacts.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-sharp">
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Certified Consultants</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    All our {city.name} consultants are trained and certified in the 
                    Winn Methodology, the industry gold standard for damage assessment.
                  </p>
                </CardContent>
              </Card>

              <Card className="card-sharp">
                <CardHeader>
                  <FileText className="h-10 w-10 text-primary mb-4" />
                  <CardTitle>Comprehensive Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Receive detailed 300+ page Winn Reports with AI-analyzed evidence 
                    that insurance adjusters trust for fair claim settlements.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="headline-lg text-center mb-4">
              Serving the Greater {city.name} Area
            </h2>
            <p className="body-lg text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Our certified consultants provide professional damage assessments throughout 
              the {city.name} metropolitan area.
            </p>
            
            <div className="flex flex-wrap justify-center gap-3">
              {city.serviceArea.map((area) => (
                <Badge 
                  key={area} 
                  variant="secondary" 
                  className="px-4 py-2 text-sm"
                  data-testid={`badge-service-area-${area.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <MapPin className="h-3 w-3 mr-2" />
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-background">
          <div className="max-w-6xl mx-auto">
            <h2 className="headline-lg text-center mb-12">
              Our Assessment Process
            </h2>
            
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Schedule', desc: 'Book your free initial consultation' },
                { step: '2', title: 'Inspect', desc: '8-step Winn Methodology inspection' },
                { step: '3', title: 'Analyze', desc: 'AI processes thermal and visual data' },
                { step: '4', title: 'Report', desc: 'Receive your comprehensive Winn Report' }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-primary">{item.step}</span>
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="h-6 w-6 fill-primary text-primary" />
              ))}
            </div>
            <p className="text-2xl font-heading font-bold mb-2">4.9 out of 5 stars</p>
            <p className="text-muted-foreground mb-8">Based on 127 verified reviews</p>
            
            <Card className="card-sharp max-w-2xl mx-auto">
              <CardContent className="py-6">
                <p className="italic text-lg mb-4">
                  "After the hail storm hit {city.name}, WinnStorm's thorough assessment 
                  helped us get our full claim approved. Their thermal imaging found damage 
                  we never would have seen otherwise."
                </p>
                <p className="font-semibold">— Verified {city.name} Customer</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="section-dark py-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="headline-lg text-white mb-6">
              Ready to Assess Your Storm Damage?
            </h2>
            <p className="body-lg text-white/70 mb-8">
              Schedule your free consultation with a certified WinnStorm damage 
              assessment consultant in {city.name} today.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/auth">
                <Button className="btn-primary" size="lg" data-testid="button-cta-bottom">
                  Get Started Now
                </Button>
              </Link>
              <a href={`tel:${city.phone.replace(/[^0-9]/g, '')}`}>
                <Button variant="outline" className="btn-secondary" size="lg">
                  <Phone className="h-4 w-4 mr-2" />
                  Call {city.phone}
                </Button>
              </a>
            </div>
            
            <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/60">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Mon-Fri 8am-6pm</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{city.address}, {city.name}, {city.stateAbbrev} {city.zipCode}</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

export function DallasPage() {
  return <CityLandingPage citySlug="dallas" />;
}

export function HoustonPage() {
  return <CityLandingPage citySlug="houston" />;
}

export function KansasCityPage() {
  return <CityLandingPage citySlug="kansas-city" />;
}
