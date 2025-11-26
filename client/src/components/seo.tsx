import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  structuredData?: object | object[];
  noindex?: boolean;
  keywords?: string[];
}

const BASE_URL = 'https://winnstorm.com';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'WinnStorm™';
const DEFAULT_DESCRIPTION = 'Professional damage assessment consulting platform implementing the proven Winn Methodology. AI-powered thermal analysis, comprehensive reporting, and consultant certification.';

export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  structuredData,
  noindex = false,
  keywords = [],
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} - Professional Damage Assessment Platform`;
  const url = canonical ? `${BASE_URL}${canonical}` : BASE_URL;
  const imageUrl = image.startsWith('http') ? image : `${BASE_URL}${image}`;

  const defaultKeywords = [
    'damage assessment',
    'thermal inspection',
    'hail damage',
    'storm damage',
    'Winn Methodology',
    'property inspection',
    'insurance claims',
    'roofing inspection',
    'AI damage analysis',
    'consultant certification',
  ];

  const allKeywords = [...defaultKeywords, ...keywords].join(', ');

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={allKeywords} />
      <link rel="canonical" href={url} />
      
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content="en_US" />
      
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@winnstorm" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      
      {structuredData && (
        Array.isArray(structuredData) ? (
          structuredData.map((data, index) => (
            <script key={index} type="application/ld+json">
              {JSON.stringify(data)}
            </script>
          ))
        ) : (
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        )
      )}
    </Helmet>
  );
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "WinnStorm™",
  "alternateName": "WinnStorm Restoration Pro",
  "url": BASE_URL,
  "logo": `${BASE_URL}/logo.png`,
  "description": "Professional damage assessment consulting platform implementing the proven Winn Methodology for weather verification, thermal inspection, and comprehensive property damage reporting.",
  "foundingDate": "2025",
  "sameAs": [
    "https://twitter.com/winnstorm",
    "https://linkedin.com/company/winnstorm"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "sales",
    "email": "sales@winnstorm.com"
  },
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "US"
  }
};

export const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "WinnStorm™ Damage Assessment Platform",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, iOS, Android",
  "description": "AI-powered damage assessment platform for property inspectors and damage consultants. Features thermal image analysis, comprehensive reporting using the Winn Methodology, and consultant certification training.",
  "offers": {
    "@type": "AggregateOffer",
    "lowPrice": "299",
    "highPrice": "899",
    "priceCurrency": "USD",
    "offerCount": "3"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "127",
    "bestRating": "5",
    "worstRating": "1"
  },
  "featureList": [
    "AI-Powered Thermal Analysis",
    "Winn Methodology Reports",
    "Consultant Certification Training",
    "Google Maps Integration",
    "Client & Project Management",
    "Weather Verification",
    "Mobile Field Inspector App"
  ]
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": SITE_NAME,
  "url": BASE_URL,
  "description": DEFAULT_DESCRIPTION,
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${BASE_URL}/search?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
};

export const breadcrumbSchema = (items: Array<{ name: string; url: string }>) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": items.map((item, index) => ({
    "@type": "ListItem",
    "position": index + 1,
    "name": item.name,
    "item": `${BASE_URL}${item.url}`
  }))
});

export const faqSchema = (faqs: Array<{ question: string; answer: string }>) => ({
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
});

export const courseSchema = (course: {
  name: string;
  description: string;
  provider?: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Course",
  "name": course.name,
  "description": course.description,
  "provider": {
    "@type": "Organization",
    "name": course.provider || SITE_NAME,
    "sameAs": BASE_URL
  }
});

export const professionalServiceSchema = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  "name": "WinnStorm™ Damage Assessment Consulting",
  "description": "Professional damage assessment services using the industry-leading Winn Methodology. Comprehensive property inspections, thermal analysis, and detailed reporting for insurance claims.",
  "url": BASE_URL,
  "priceRange": "$$$",
  "areaServed": {
    "@type": "Country",
    "name": "United States"
  },
  "serviceType": [
    "Property Damage Assessment",
    "Hail Damage Inspection",
    "Storm Damage Evaluation",
    "Thermal Imaging Analysis",
    "Insurance Claim Documentation"
  ],
  "hasOfferCatalog": {
    "@type": "OfferCatalog",
    "name": "Damage Assessment Services",
    "itemListElement": [
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Comprehensive Damage Assessment",
          "description": "Full property inspection using the Winn Methodology"
        }
      },
      {
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": "Thermal Analysis",
          "description": "AI-powered thermal imaging for moisture and damage detection"
        }
      }
    ]
  }
};

export default SEO;
