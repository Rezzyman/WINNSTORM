import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { 
  Brain, 
  Mic, 
  Wifi, 
  Plane, 
  Building2, 
  Hammer, 
  MapPin, 
  Sparkles,
  ChevronRight,
  Lock,
  Unlock,
  Zap,
  TrendingUp,
  Eye,
  Settings
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface InnovationModule {
  id: number;
  moduleCode: string;
  moduleName: string;
  description: string;
  category: string;
  version: string;
  status: string;
  requiredSubscription: string;
  isActive: boolean;
}

const MODULE_ICONS: Record<string, any> = {
  predictive_claims: Brain,
  field_copilot: Mic,
  iot_sensors: Wifi,
  drone_integration: Plane,
  carrier_console: Building2,
  contractor_marketplace: Hammer,
  risk_intelligence: MapPin,
};

const CATEGORY_COLORS: Record<string, string> = {
  ai_intelligence: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  field_operations: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  iot_hardware: "bg-green-500/20 text-green-400 border-green-500/30",
  enterprise: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  marketplace: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  data_products: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
};

const STATUS_BADGES: Record<string, { label: string; variant: string }> = {
  active: { label: "Active", variant: "default" },
  preview: { label: "Preview", variant: "secondary" },
  coming_soon: { label: "Coming Soon", variant: "outline" },
  beta: { label: "Beta", variant: "secondary" },
};

export default function InnovationHub() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: modules = [], isLoading } = useQuery<InnovationModule[]>({
    queryKey: ["/api/innovation/modules"],
  });

  const seedModulesMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/innovation/modules/seed", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/innovation/modules"] });
      toast({
        title: "Modules Initialized",
        description: "All innovation modules have been configured.",
      });
    },
  });

  const categories = [
    { id: "all", label: "All Modules", icon: Sparkles },
    { id: "ai_intelligence", label: "AI Intelligence", icon: Brain },
    { id: "field_operations", label: "Field Operations", icon: Mic },
    { id: "iot_hardware", label: "IoT & Hardware", icon: Wifi },
    { id: "enterprise", label: "Enterprise", icon: Building2 },
    { id: "marketplace", label: "Marketplace", icon: Hammer },
    { id: "data_products", label: "Data Products", icon: MapPin },
  ];

  const filteredModules = selectedCategory === "all" 
    ? modules 
    : modules.filter(m => m.category === selectedCategory);

  const moduleStats = {
    total: modules.length,
    active: modules.filter(m => m.status === 'active').length,
    preview: modules.filter(m => m.status === 'preview').length,
    comingSoon: modules.filter(m => m.status === 'coming_soon').length,
  };

  return (
    <>
      <Helmet>
        <title>Innovation Hub | WinnStorm</title>
        <meta name="description" content="Explore cutting-edge features and enterprise capabilities for WinnStorm damage assessment platform." />
      </Helmet>

      <div className="min-h-screen bg-slate-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-orange-500" />
                  Innovation Hub
                </h1>
                <p className="text-slate-400 mt-2">
                  Cutting-edge features and enterprise capabilities for world-class damage assessment
                </p>
              </div>
              {modules.length === 0 && (
                <Button 
                  onClick={() => seedModulesMutation.mutate()}
                  disabled={seedModulesMutation.isPending}
                  className="bg-orange-600 hover:bg-orange-700"
                  data-testid="button-initialize-modules"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Initialize Modules
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Total Modules</p>
                      <p className="text-2xl font-bold text-white" data-testid="text-total-modules">{moduleStats.total}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Active</p>
                      <p className="text-2xl font-bold text-green-400" data-testid="text-active-modules">{moduleStats.active}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <Unlock className="h-5 w-5 text-green-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Preview</p>
                      <p className="text-2xl font-bold text-blue-400" data-testid="text-preview-modules">{moduleStats.preview}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Eye className="h-5 w-5 text-blue-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 text-sm">Coming Soon</p>
                      <p className="text-2xl font-bold text-orange-400" data-testid="text-coming-modules">{moduleStats.comingSoon}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-orange-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  className={selectedCategory === cat.id 
                    ? "bg-orange-600 hover:bg-orange-700" 
                    : "border-slate-600 hover:bg-slate-800"
                  }
                  onClick={() => setSelectedCategory(cat.id)}
                  data-testid={`button-category-${cat.id}`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {cat.label}
                </Button>
              );
            })}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="bg-slate-800 border-slate-700 animate-pulse">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-xl bg-slate-700" />
                    <div className="h-6 w-3/4 bg-slate-700 rounded mt-4" />
                    <div className="h-4 w-full bg-slate-700 rounded mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : filteredModules.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-12 text-center">
                <Sparkles className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Modules Found</h3>
                <p className="text-slate-400 mb-6">
                  {modules.length === 0 
                    ? "Initialize the innovation modules to get started with enterprise features."
                    : "No modules match the selected category."}
                </p>
                {modules.length === 0 && (
                  <Button 
                    onClick={() => seedModulesMutation.mutate()}
                    disabled={seedModulesMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700"
                    data-testid="button-initialize-empty"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Initialize Modules
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredModules.map((module) => {
                const Icon = MODULE_ICONS[module.moduleCode] || Sparkles;
                const statusConfig = STATUS_BADGES[module.status] || STATUS_BADGES.preview;
                const categoryColor = CATEGORY_COLORS[module.category] || CATEGORY_COLORS.ai_intelligence;
                
                return (
                  <Card 
                    key={module.id} 
                    className="bg-slate-800 border-slate-700 hover:border-orange-500/50 transition-all duration-300 group"
                    data-testid={`card-module-${module.moduleCode}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${categoryColor}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                        <Badge variant="outline" className={
                          module.status === 'active' ? 'border-green-500 text-green-400' :
                          module.status === 'preview' ? 'border-blue-500 text-blue-400' :
                          'border-slate-500 text-slate-400'
                        }>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <CardTitle className="text-white mt-4 group-hover:text-orange-400 transition-colors">
                        {module.moduleName}
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        {module.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className={categoryColor}>
                          {module.category.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-slate-500">v{module.version}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                        <div className="flex items-center gap-2">
                          {module.requiredSubscription === 'enterprise' ? (
                            <Lock className="h-4 w-4 text-orange-400" />
                          ) : (
                            <Unlock className="h-4 w-4 text-green-400" />
                          )}
                          <span className="text-xs text-slate-400 capitalize">
                            {module.requiredSubscription}
                          </span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                          disabled={module.status === 'coming_soon'}
                          data-testid={`button-explore-${module.moduleCode}`}
                        >
                          {module.status === 'coming_soon' ? 'Coming Soon' : 'Explore'}
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          <Card className="mt-12 bg-gradient-to-r from-orange-600/20 to-purple-600/20 border-orange-500/30">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Ready for Enterprise Features?
                  </h3>
                  <p className="text-slate-300">
                    Unlock the full power of WinnStorm with our enterprise tier. 
                    Get access to predictive analytics, carrier integrations, and more.
                  </p>
                </div>
                <Button size="lg" className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap" data-testid="button-upgrade-enterprise">
                  Upgrade to Enterprise
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 text-center text-slate-500 text-sm">
            <p>Innovation Hub is part of the WinnStorm Enterprise Platform</p>
            <p className="mt-1">
              <Link href="/dashboard" className="text-orange-400 hover:text-orange-300">
                Return to Dashboard
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
