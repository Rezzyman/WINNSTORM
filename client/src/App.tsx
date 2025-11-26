import { Switch, Route } from "wouter";
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
      <Route path="/inspection/:propertyId" component={InspectionWizard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <div className="min-h-screen flex flex-col relative">
          <LoadingOverlay />
          <Router />
        </div>
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
