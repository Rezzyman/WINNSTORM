import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/seo';
import { Home, Shield, Mail } from 'lucide-react';
import winnstormLogo from '@assets/Untitled_design__72_-removebg-preview_1753995395882.png';

const Privacy = () => {
  const lastUpdated = "December 1, 2025";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy - WinnStorm Data Protection"
        description="WinnStorm Privacy Policy explains how we collect, use, and protect your personal information. Learn about our commitment to data security and your privacy rights."
        canonical="/privacy"
        keywords={['WinnStorm privacy policy', 'data protection', 'user privacy', 'GDPR compliance']}
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
              <Link href="/terms">
                <Button variant="ghost" size="sm">Terms of Service</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/30">Legal</Badge>
            <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto prose prose-gray dark:prose-invert">
            
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mb-8">
              <div className="flex items-start gap-4">
                <Shield className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2 mt-0">Our Commitment to Privacy</h3>
                  <p className="text-muted-foreground mb-0">
                    WinnStorm is committed to protecting your privacy. This policy explains how we collect, 
                    use, and safeguard your information when you use our damage assessment platform.
                  </p>
                </div>
              </div>
            </div>

            <h2>1. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, phone number, company name, and professional credentials when you create an account.</li>
              <li><strong>Property Data:</strong> Address information, photos, thermal images, and assessment data for properties you inspect.</li>
              <li><strong>Payment Information:</strong> Billing address and payment method details (processed securely through Stripe).</li>
              <li><strong>Communications:</strong> Messages you send to our support team or through our platform.</li>
              <li><strong>Usage Data:</strong> Information about how you interact with our platform, including features used and time spent.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, maintain, and improve our damage assessment platform</li>
              <li>Process transactions and send related information</li>
              <li>Send you technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and customer service requests</li>
              <li>Train and improve our AI systems (Stormy) to provide better guidance</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent or unauthorized activities</li>
            </ul>

            <h2>3. Information Sharing</h2>
            <p>We do not sell your personal information. We may share information:</p>
            <ul>
              <li><strong>With Service Providers:</strong> Third parties that help us operate our platform (hosting, analytics, payment processing)</li>
              <li><strong>For Legal Reasons:</strong> When required by law or to protect rights and safety</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize sharing (e.g., submitting reports to insurance companies)</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>

            <h2>4. Data Security</h2>
            <p>We implement industry-standard security measures to protect your information:</p>
            <ul>
              <li>All data is encrypted in transit (TLS 1.3) and at rest (AES-256)</li>
              <li>SOC 2 Type II certified infrastructure</li>
              <li>ISO 27001 certified security practices</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and authentication requirements</li>
              <li>Secure data centers with physical security measures</li>
            </ul>

            <h2>5. Data Retention</h2>
            <p>
              We retain your information for as long as your account is active or as needed to provide services. 
              Inspection data and reports are retained for 7 years to support potential insurance claims or legal requirements. 
              You may request deletion of your account and associated data at any time.
            </p>

            <h2>6. Your Rights</h2>
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal information</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Opt-out:</strong> Opt out of marketing communications</li>
              <li><strong>Restrict Processing:</strong> Request limitation of how we use your data</li>
            </ul>

            <h2>7. Cookies and Tracking</h2>
            <p>
              We use cookies and similar technologies to improve your experience, understand usage patterns, 
              and deliver relevant content. You can control cookie preferences through your browser settings.
            </p>

            <h2>8. Third-Party Services</h2>
            <p>Our platform may contain links to or integrations with third-party services:</p>
            <ul>
              <li><strong>Google Maps:</strong> For property location and satellite imagery</li>
              <li><strong>Stripe:</strong> For payment processing</li>
              <li><strong>Firebase:</strong> For authentication services</li>
              <li><strong>OpenAI:</strong> For AI-powered analysis features</li>
            </ul>
            <p>These services have their own privacy policies that govern their use of your information.</p>

            <h2>9. Children's Privacy</h2>
            <p>
              WinnStorm is not intended for use by individuals under the age of 18. 
              We do not knowingly collect personal information from children.
            </p>

            <h2>10. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. 
              We ensure appropriate safeguards are in place for international transfers, including 
              Standard Contractual Clauses approved by relevant authorities.
            </p>

            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of significant 
              changes by posting the new policy on this page and updating the "Last updated" date.
            </p>

            <h2>12. Contact Us</h2>
            <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>
            <div className="bg-muted/50 rounded-lg p-4 not-prose">
              <p className="font-semibold mb-2">WinnStorm Privacy Team</p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                privacy@winnstorm.com
              </p>
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

export default Privacy;
