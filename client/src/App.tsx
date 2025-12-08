import { Switch, Route } from "wouter";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Upload from "@/pages/upload";
import Analysis from "@/pages/analysis";
import PropertyDetail from "@/pages/property-detail";
import Report from "@/pages/report";
import Reports from "@/pages/reports";
import WinnReport from "@/pages/winn-report";
import CrmIntegrations from "@/pages/crm-integrations";
import Training from "@/pages/training";
import Projects from "@/pages/projects";
import Landing from "@/pages/landing";
import Subscribe from "@/pages/subscribe";
import SubscriptionSuccess from "@/pages/subscription-success";
import InspectionWizard from "@/pages/inspection-wizard";
import Transcripts from "@/pages/transcripts";
import Docs from "@/pages/docs";
import ApiDocs from "@/pages/api-docs";
import Support from "@/pages/support";
import Methodology from "@/pages/methodology";
import About from "@/pages/about";
import Careers from "@/pages/careers";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import Pricing from "@/pages/pricing";
import { DallasPage, HoustonPage, KansasCityPage } from "@/pages/city-landing";
import { ThermalInspectionPage, HailDamageAssessmentPage, StormDamageConsultingPage } from "@/pages/service-landing";
import { BlogIndex, BlogPost } from "@/pages/blog";
import Schedule from "@/pages/schedule";
import TeamManagement from "@/pages/team-management";
import { AuthProvider } from "@/hooks/use-auth";
import { LoadingOverlay } from "@/components/loading-overlay";
import { useEffect } from "react";

// Clean up old test user data from localStorage
function useCleanupTestData() {
  useEffect(() => {
    const testUser = localStorage.getItem('test_user');
    const userRole = localStorage.getItem('userRole');
    
    if (testUser || userRole) {
      localStorage.removeItem('test_user');
      localStorage.removeItem('userRole');
    }
  }, []);
}

function Router() {
  useCleanupTestData();
  
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/" component={Landing} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/subscribe/:plan" component={Subscribe} />
      <Route path="/subscription-success" component={SubscriptionSuccess} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/upload" component={Upload} />
      <Route path="/analysis/:id" component={Analysis} />
      <Route path="/property/:id" component={PropertyDetail} />
      <Route path="/report/:id" component={Report} />
      <Route path="/reports" component={Reports} />
      <Route path="/winn-report/:propertyId" component={WinnReport} />
      <Route path="/crm-integrations" component={CrmIntegrations} />
      <Route path="/training" component={Training} />
      <Route path="/projects" component={Projects} />
      <Route path="/schedule" component={Schedule} />
      <Route path="/team" component={TeamManagement} />
      <Route path="/inspection/:propertyId" component={InspectionWizard} />
      <Route path="/transcripts" component={Transcripts} />
      <Route path="/docs" component={Docs} />
      <Route path="/api-docs" component={ApiDocs} />
      <Route path="/support" component={Support} />
      <Route path="/methodology" component={Methodology} />
      <Route path="/about" component={About} />
      <Route path="/careers" component={Careers} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/dallas" component={DallasPage} />
      <Route path="/houston" component={HoustonPage} />
      <Route path="/kansas-city" component={KansasCityPage} />
      <Route path="/services/thermal-inspection" component={ThermalInspectionPage} />
      <Route path="/services/hail-damage-assessment" component={HailDamageAssessmentPage} />
      <Route path="/services/storm-damage-consulting" component={StormDamageConsultingPage} />
      <Route path="/blog" component={BlogIndex} />
      <Route path="/blog/:slug">{(params) => <BlogPost slug={params.slug} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <div className="min-h-screen flex flex-col relative">
            <LoadingOverlay />
            <Router />
          </div>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
