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
import WinnReport from "@/pages/winn-report";
import CrmIntegrations from "@/pages/crm-integrations";
import { AuthProvider } from "@/hooks/use-auth";
import { LoadingOverlay } from "@/components/loading-overlay";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Auth} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/upload" component={Upload} />
      <Route path="/analysis/:id" component={Analysis} />
      <Route path="/property/:id" component={PropertyDetail} />
      <Route path="/report/:id" component={Report} />
      <Route path="/winn-report/:propertyId" component={WinnReport} />
      <Route path="/crm-integrations" component={CrmIntegrations} />
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
