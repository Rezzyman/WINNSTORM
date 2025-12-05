import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEO } from '@/components/seo';
import { Home, FileText, Mail } from 'lucide-react';
import winnstormLogo from '@assets/Untitled_design__72_-removebg-preview_1753995395882.png';

const Terms = () => {
  const lastUpdated = "December 1, 2025";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Terms of Service - WinnStorm User Agreement"
        description="WinnStorm Terms of Service outlines the rules and guidelines for using our damage assessment platform. Read our terms, conditions, and user responsibilities."
        canonical="/terms"
        keywords={['WinnStorm terms of service', 'user agreement', 'platform terms', 'service conditions']}
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
              <Link href="/privacy">
                <Button variant="ghost" size="sm">Privacy Policy</Button>
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
            <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
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
                <FileText className="h-8 w-8 text-primary flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold mb-2 mt-0">Agreement to Terms</h3>
                  <p className="text-muted-foreground mb-0">
                    By accessing or using WinnStorm's damage assessment platform, you agree to be bound by these 
                    Terms of Service. If you do not agree to these terms, please do not use our services.
                  </p>
                </div>
              </div>
            </div>

            <h2>1. Description of Service</h2>
            <p>
              WinnStorm provides a cloud-based platform for property damage assessment, including thermal analysis tools, 
              report generation, AI-powered guidance (Stormy), training and certification programs, and related services 
              (collectively, the "Service"). The Service is designed to assist damage assessment consultants in conducting 
              inspections and generating reports.
            </p>

            <h2>2. Account Registration</h2>
            <p>To use the Service, you must:</p>
            <ul>
              <li>Be at least 18 years of age</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h2>3. Subscription and Payment</h2>
            <h3>3.1 Subscription Plans</h3>
            <p>
              WinnStorm offers various subscription plans with different features and pricing. Plan details and pricing 
              are available on our website and may be updated from time to time.
            </p>
            
            <h3>3.2 Billing</h3>
            <ul>
              <li>Subscription fees are billed in advance on a monthly or annual basis</li>
              <li>All fees are non-refundable except as required by law or as specified in our refund policy</li>
              <li>You authorize us to charge your payment method for recurring subscription fees</li>
              <li>Failure to pay may result in suspension or termination of your account</li>
            </ul>

            <h3>3.3 Free Trial</h3>
            <p>
              We may offer a free trial period. At the end of the trial, you will be charged unless you cancel before 
              the trial expires. Trial terms may vary and are subject to change.
            </p>

            <h2>4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the Service for any unlawful purpose</li>
              <li>Submit false or misleading information in damage assessments</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Use the Service to transmit malware or harmful code</li>
              <li>Reverse engineer, decompile, or disassemble the Service</li>
              <li>Resell or redistribute the Service without authorization</li>
              <li>Use automated systems to access the Service (except approved APIs)</li>
            </ul>

            <h2>5. Intellectual Property</h2>
            <h3>5.1 Our Intellectual Property</h3>
            <p>
              The Service, including its content, features, and functionality, is owned by WinnStorm and protected by 
              copyright, trademark, and other intellectual property laws. The Winn Methodology is a trademark of Eric Winn.
            </p>
            
            <h3>5.2 Your Content</h3>
            <p>
              You retain ownership of content you upload to the Service (photos, reports, data). By uploading content, 
              you grant WinnStorm a non-exclusive license to use, store, and process that content to provide the Service 
              and improve our AI systems.
            </p>

            <h2>6. AI Services and Limitations</h2>
            <p>
              Our AI assistant (Stormy) provides guidance based on the Winn Methodology and analyzed data. However:
            </p>
            <ul>
              <li>AI recommendations are advisory and do not replace professional judgment</li>
              <li>Users are responsible for verifying AI-generated analysis</li>
              <li>We do not guarantee the accuracy of AI predictions or recommendations</li>
              <li>AI capabilities may vary and are subject to ongoing improvement</li>
            </ul>

            <h2>7. Professional Responsibility</h2>
            <p>
              Users of WinnStorm are responsible for:
            </p>
            <ul>
              <li>Maintaining appropriate professional licenses and certifications</li>
              <li>Ensuring accuracy of assessments and reports they generate</li>
              <li>Complying with applicable laws, regulations, and industry standards</li>
              <li>Exercising independent professional judgment in all assessments</li>
            </ul>

            <h2>8. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul>
              <li>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND</li>
              <li>WINNSTORM SHALL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL DAMAGES</li>
              <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE 12 MONTHS PRECEDING THE CLAIM</li>
              <li>WE DO NOT WARRANT THAT THE SERVICE WILL BE ERROR-FREE OR UNINTERRUPTED</li>
            </ul>

            <h2>9. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless WinnStorm, its officers, directors, employees, and agents from 
              any claims, damages, losses, or expenses arising from your use of the Service, your violation of these 
              Terms, or your violation of any rights of another.
            </p>

            <h2>10. Termination</h2>
            <p>
              Either party may terminate this agreement at any time. We may suspend or terminate your access if you 
              violate these Terms. Upon termination:
            </p>
            <ul>
              <li>Your right to use the Service immediately ceases</li>
              <li>You may request export of your data within 30 days</li>
              <li>We may delete your data after the retention period</li>
              <li>Sections that by their nature should survive will remain in effect</li>
            </ul>

            <h2>11. Dispute Resolution</h2>
            <p>
              Any disputes arising from these Terms or the Service shall be resolved through binding arbitration in 
              accordance with the American Arbitration Association rules. The arbitration shall take place in Dallas, 
              Texas. You waive any right to participate in a class action lawsuit or class-wide arbitration.
            </p>

            <h2>12. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. We will notify you of material changes by email or through the 
              Service. Your continued use of the Service after changes constitutes acceptance of the modified Terms.
            </p>

            <h2>13. General Provisions</h2>
            <ul>
              <li><strong>Governing Law:</strong> These Terms are governed by the laws of Texas</li>
              <li><strong>Entire Agreement:</strong> These Terms constitute the entire agreement between us</li>
              <li><strong>Severability:</strong> If any provision is found unenforceable, the rest remains in effect</li>
              <li><strong>No Waiver:</strong> Failure to enforce any right does not waive that right</li>
              <li><strong>Assignment:</strong> You may not assign these Terms without our consent</li>
            </ul>

            <h2>14. Contact Information</h2>
            <p>For questions about these Terms, please contact us:</p>
            <div className="bg-muted/50 rounded-lg p-4 not-prose">
              <p className="font-semibold mb-2">WinnStorm Legal Team</p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                legal@winnstorm.com
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

export default Terms;
