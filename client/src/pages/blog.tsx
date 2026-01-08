import { Header, Footer } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SEO, faqSchema, breadcrumbSchema } from '@/components/seo';
import { Breadcrumb } from '@/components/breadcrumb';
import { Link } from 'wouter';
import { 
  Calendar, Clock, ArrowRight, User, Tag,
  Thermometer, CloudLightning, FileText, Shield,
  CheckCircle, AlertTriangle
} from 'lucide-react';

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  tags: string[];
  image?: string;
  featured?: boolean;
}

const blogPosts: BlogPost[] = [
  {
    slug: 'what-is-thermal-imaging-inspection',
    title: 'What Is Thermal Imaging Inspection? A Complete Guide for Property Owners',
    excerpt: 'Learn how thermal imaging technology detects hidden moisture, insulation problems, and structural damage that visual inspections miss. Discover why thermal inspections are essential for insurance claims.',
    content: `
Thermal imaging inspection, also known as infrared thermography, is a non-invasive diagnostic technique that uses specialized cameras to detect temperature variations in building materials. These temperature differences can reveal hidden problems that are invisible to the naked eye.

## How Thermal Imaging Works

Thermal cameras detect infrared radiation (heat) emitted by objects and convert it into a visual image. Different temperatures appear as different colors, typically ranging from cool blues and purples to warm reds and whites. This allows trained inspectors to identify:

- **Moisture intrusion**: Wet areas appear cooler due to evaporative cooling
- **Insulation deficiencies**: Missing or damaged insulation shows as hot or cold spots
- **Air leaks**: Temperature differentials around windows, doors, and penetrations
- **Electrical issues**: Overheating components show as hot spots
- **Roof damage**: Trapped moisture under roofing materials

## Why Thermal Imaging Matters for Insurance Claims

When filing a property damage claim, documentation is everything. Thermal imaging provides objective, scientific evidence of damage that adjusters cannot dispute. Our Winn Reports include thermal analysis that helps property owners receive fair settlements.

## Best Conditions for Thermal Inspection

For optimal results, thermal inspections should be performed when there's at least a 20°F temperature difference between interior and exterior. Early morning or after sunset typically provides the best conditions for detecting moisture and insulation issues.

## The WinnStorm Advantage

Our AI-powered Stormy assistant analyzes thermal images in real-time, automatically identifying anomalies and potential damage areas. This technology, combined with certified consultant expertise, ensures comprehensive documentation for your property assessment.
    `,
    author: 'Eric Winn',
    date: '2025-12-08',
    readTime: '8 min read',
    category: 'Thermal Imaging',
    tags: ['thermal imaging', 'property inspection', 'moisture detection', 'insurance claims'],
    featured: true
  },
  {
    slug: 'hail-damage-roof-signs',
    title: '7 Signs of Hail Damage on Your Roof That Insurance Adjusters Look For',
    excerpt: 'Discover the telltale signs of hail damage that determine whether your insurance claim gets approved. Learn what certified damage assessors look for during professional inspections.',
    content: `
Hail damage can be subtle yet devastating to your roof's integrity. Knowing what to look for - and what insurance adjusters examine - can make the difference between a denied claim and full coverage.

## 1. Granule Loss on Shingles

Hail impacts dislodge the protective granules from asphalt shingles. Check your gutters and downspouts for accumulated granules. Significant granule loss exposes the underlying asphalt to UV damage and accelerates deterioration.

## 2. Soft Spots and Bruising

Press gently on shingle surfaces. Hail-damaged areas feel softer than surrounding material due to compromised underlying structure. This "bruising" weakens the shingle even when no visible damage exists.

## 3. Cracked or Split Shingles

Large hail can crack shingles immediately upon impact. Look for linear cracks running across multiple shingles, often following the hail's trajectory.

## 4. Dented Soft Metals

Gutters, downspouts, vents, and flashing are often the first indicators of hail impact. These soft metals show damage more readily than roofing materials.

## 5. Damaged Ridge Caps

Ridge caps take the brunt of hail impacts. Examine the peak of your roof for signs of damage to these critical protective components.

## 6. Random Pattern Damage

Unlike wear damage that follows patterns, hail damage appears randomly across the roof surface. Adjusters look for this random distribution as evidence of a weather event.

## 7. Collateral Damage

AC units, skylights, outdoor furniture, and vehicles often show hail damage. Documenting this collateral damage strengthens your roof damage claim.

## The Professional Advantage

The Winn Methodology includes systematic test square analysis that quantifies damage density across your entire roof. This statistical approach provides the defensible documentation insurance companies require.
    `,
    author: 'Eric Winn',
    date: '2025-12-07',
    readTime: '6 min read',
    category: 'Hail Damage',
    tags: ['hail damage', 'roof inspection', 'insurance claim', 'storm damage']
  },
  {
    slug: 'storm-damage-insurance-claim-timeline',
    title: 'Storm Damage Insurance Claims: A Step-by-Step Timeline for Property Owners',
    excerpt: 'Navigate the storm damage insurance claim process with confidence. This comprehensive timeline covers everything from initial documentation to final settlement.',
    content: `
Filing a storm damage insurance claim can feel overwhelming. This timeline breaks down the process into manageable steps, helping you maximize your chances of a fair settlement.

## Immediately After the Storm (Day 1-3)

**Document Everything**
- Take photos and videos of all visible damage
- Document the date and time of the storm
- Note any emergency repairs needed for safety

**File Your Claim**
- Contact your insurance company promptly
- Get a claim number and adjuster contact information
- Request a copy of your policy

## First Week

**Prevent Further Damage**
- Make temporary repairs to prevent additional damage
- Keep all receipts for emergency repairs
- Don't dispose of damaged materials

**Schedule Professional Assessment**
- Contact a certified damage assessment consultant
- Get a comprehensive Winn Report prepared
- Document all damage with thermal imaging

## Adjuster Visit (Week 2-4)

**Be Prepared**
- Have your documentation ready
- Point out all damage areas
- Provide your professional assessment report
- Ask questions about the scope of their review

## After Initial Estimate

**Review Carefully**
- Compare adjuster's estimate to your assessment
- Identify any missed damage
- Request re-inspection if damage was overlooked

## Settlement Negotiation

**Advocate for Fair Value**
- Present thermal imaging evidence for hidden damage
- Use test square data to support damage extent
- Consider hiring a public adjuster if needed

## The Importance of Professional Documentation

Claims with comprehensive Winn Reports see significantly higher approval rates. Our methodology provides the detailed, defensible evidence that moves claims through the process efficiently.
    `,
    author: 'WinnStorm Team',
    date: '2025-12-06',
    readTime: '10 min read',
    category: 'Insurance Claims',
    tags: ['insurance claims', 'storm damage', 'claim timeline', 'property damage']
  },
  {
    slug: 'winn-methodology-explained',
    title: 'The Winn Methodology Explained: 8 Steps to Defensible Damage Assessment',
    excerpt: 'Understand the industry-leading Winn Methodology used by certified damage consultants worldwide. Learn how this 8-step process creates comprehensive, defensible property damage reports.',
    content: `
The Winn Methodology represents decades of field experience distilled into a systematic, repeatable approach to property damage assessment. Developed by Eric Winn, this methodology has become the gold standard for professional damage consulting.

## Step 1: Weather Verification

Every assessment begins with establishing the weather event. Using NOAA and NWS historical data, we document hail size, wind speeds, and storm timing to correlate with reported damage.

## Step 2: Thermal Analysis

AI-powered thermal imaging reveals hidden moisture intrusion, insulation damage, and structural issues invisible to standard inspection methods.

## Step 3: Terrestrial Documentation

Comprehensive ground-level photo documentation captures all visible damage indicators, from soft metal impacts to siding damage.

## Step 4: Roof Section Mapping

Using satellite imagery, we create detailed maps of distinct roof sections to organize and track damage systematically.

## Step 5: Test Square Analysis

Industry-standard 10x10 foot test squares quantify damage density, providing statistical basis for extrapolating total roof damage.

## Step 6: Core Sample Collection

When applicable, physical samples verify material condition and age, supporting repair versus replacement determinations.

## Step 7: Damage Quantification

All findings compile into quantified assessments with repair cost estimates, depreciation calculations, and line-item damage schedules.

## Step 8: Winn Report Generation

The final comprehensive report assembles all evidence into a professional, defensible document formatted for insurance submission.

## Why the Methodology Matters

Insurance adjusters respect Winn Reports because they provide systematic, thorough documentation that withstands scrutiny. Our certified consultants follow this methodology on every inspection, ensuring consistent, professional results.
    `,
    author: 'Eric Winn',
    date: '2025-12-05',
    readTime: '7 min read',
    category: 'Methodology',
    tags: ['Winn Methodology', 'damage assessment', 'property inspection', 'certification'],
    featured: true
  }
];

const categories = ['All', 'Thermal Imaging', 'Hail Damage', 'Insurance Claims', 'Methodology'];

function BlogIndex() {
  const featuredPost = blogPosts.find(post => post.featured);
  const regularPosts = blogPosts.filter(post => post !== featuredPost);

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="blog-index">
      <SEO
        title="Storm Damage Assessment Blog - Expert Insights & Guides"
        description="Expert articles on thermal imaging, hail damage assessment, storm damage insurance claims, and the Winn Methodology. Learn from certified damage assessment professionals."
        canonical="/blog"
        keywords={[
          'storm damage blog',
          'thermal imaging guides',
          'hail damage articles',
          'insurance claim tips',
          'Winn Methodology guide',
          'property damage assessment'
        ]}
      />
      
      <Header />
      
      <main className="flex-grow">
        {/* Hero */}
        <section className="py-16 px-6 bg-gradient-to-b from-primary/10 to-background">
          <div className="max-w-6xl mx-auto">
            <Breadcrumb items={[{ name: 'Blog', url: '/blog' }]} className="mb-6" />
            
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              WinnStorm <span className="text-primary">Knowledge Hub</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Expert insights on damage assessment, thermal imaging, insurance claims, and the Winn Methodology from certified professionals.
            </p>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && (
          <section className="py-12 px-6 bg-background">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-sm font-semibold text-primary uppercase tracking-wide mb-6">Featured Article</h2>
              
              <Link href={`/blog/${featuredPost.slug}`}>
                <Card className="border-primary/20 hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-orange-500/20 to-gray-500/20 p-8 flex items-center justify-center">
                      <Thermometer className="h-24 w-24 text-orange-500/60" />
                    </div>
                    <CardContent className="p-6 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary">{featuredPost.category}</Badge>
                        <span className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {featuredPost.readTime}
                        </span>
                      </div>
                      <h3 className="text-2xl font-bold mb-3 hover:text-primary transition-colors">
                        {featuredPost.title}
                      </h3>
                      <p className="text-muted-foreground mb-4">{featuredPost.excerpt}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {featuredPost.author}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(featuredPost.date).toLocaleDateString('en-US', { 
                            month: 'long', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </Link>
            </div>
          </section>
        )}

        {/* Category Filter */}
        <section className="py-6 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={category === 'All' ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-full"
                  data-testid={`filter-${category.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* Blog Posts Grid */}
        <section className="py-12 px-6 bg-background">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Latest Articles</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map(post => (
                <Link key={post.slug} href={`/blog/${post.slug}`}>
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer" data-testid={`blog-card-${post.slug}`}>
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">{post.category}</Badge>
                      </div>
                      <CardTitle className="text-lg leading-tight hover:text-primary transition-colors">
                        {post.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(post.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {post.readTime}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter CTA */}
        <section className="py-16 px-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Stay Updated on Damage Assessment Insights</h2>
            <p className="text-lg opacity-90 mb-8">
              Get the latest articles, industry updates, and expert tips delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900"
                data-testid="input-newsletter-email"
              />
              <Button variant="secondary" className="text-gray-900" data-testid="button-subscribe">
                Subscribe
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

function BlogPost({ slug }: { slug: string }) {
  const post = blogPosts.find(p => p.slug === slug);
  
  if (!post) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
            <Link href="/blog">
              <Button>Back to Blog</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt,
    "author": {
      "@type": "Person",
      "name": post.author
    },
    "publisher": {
      "@type": "Organization",
      "name": "WinnStorm™",
      "logo": {
        "@type": "ImageObject",
        "url": "https://winnstorm.com/logo.png"
      }
    },
    "datePublished": post.date,
    "dateModified": post.date,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://winnstorm.com/blog/${post.slug}`
    },
    "keywords": post.tags.join(', ')
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid={`blog-post-${slug}`}>
      <SEO
        title={post.title}
        description={post.excerpt}
        canonical={`/blog/${post.slug}`}
        type="article"
        keywords={post.tags}
        structuredData={articleSchema}
      />
      
      <Header />
      
      <main className="flex-grow">
        {/* Article Header */}
        <section className="py-12 px-6 bg-gradient-to-b from-primary/10 to-background">
          <div className="max-w-4xl mx-auto">
            <Breadcrumb 
              items={[
                { name: 'Blog', url: '/blog' },
                { name: post.category, url: `/blog?category=${encodeURIComponent(post.category)}` },
                { name: post.title.substring(0, 30) + '...', url: `/blog/${post.slug}` }
              ]} 
              className="mb-6" 
            />
            
            <div className="flex items-center gap-2 mb-4">
              <Badge>{post.category}</Badge>
              <span className="text-sm text-muted-foreground flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {post.readTime}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-6">
              {post.title}
            </h1>
            
            <div className="flex items-center gap-6 text-muted-foreground">
              <span className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                {post.author}
              </span>
              <span className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                {new Date(post.date).toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <article className="py-12 px-6">
          <div className="max-w-4xl mx-auto prose prose-lg dark:prose-invert">
            {post.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('## ')) {
                return <h2 key={index} className="text-2xl font-bold mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
              }
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return <p key={index} className="font-semibold">{paragraph.replace(/\*\*/g, '')}</p>;
              }
              if (paragraph.startsWith('- ')) {
                const items = paragraph.split('\n').filter(line => line.startsWith('- '));
                return (
                  <ul key={index} className="list-disc pl-6 space-y-2">
                    {items.map((item, i) => (
                      <li key={i}>{item.replace('- ', '').replace(/\*\*/g, '')}</li>
                    ))}
                  </ul>
                );
              }
              if (paragraph.trim()) {
                return <p key={index} className="mb-4">{paragraph}</p>;
              }
              return null;
            })}
          </div>
        </article>

        {/* Tags */}
        <section className="py-8 px-6 border-t">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {post.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        {/* Related Articles */}
        <section className="py-12 px-6 bg-muted/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {blogPosts
                .filter(p => p.slug !== post.slug)
                .slice(0, 3)
                .map(relatedPost => (
                  <Link key={relatedPost.slug} href={`/blog/${relatedPost.slug}`}>
                    <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-6">
                        <Badge variant="outline" className="mb-3">{relatedPost.category}</Badge>
                        <h3 className="font-bold mb-2 hover:text-primary transition-colors line-clamp-2">
                          {relatedPost.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {relatedPost.excerpt}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-dark py-12 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Need Professional Damage Assessment?
            </h2>
            <p className="text-white/70 mb-6">
              Our certified consultants use the Winn Methodology to create comprehensive, defensible reports.
            </p>
            <Link href="/auth">
              <Button className="btn-primary" data-testid="button-cta">
                Get Free Assessment
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

export { BlogIndex, BlogPost, blogPosts };
export default BlogIndex;
