import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, CloudRain, Wind, Thermometer, Droplets, CheckCircle, Plus, RefreshCw } from "lucide-react";
import type { DamageTemplate } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface DamageTemplateSelectorProps {
  onSelect: (template: DamageTemplate) => void;
  selectedTemplateId?: number;
}

const categoryIcons: Record<string, any> = {
  "Storm Damage": CloudRain,
  "Thermal Issues": Thermometer,
  "Water Damage": Droplets,
  "Material Degradation": AlertTriangle,
  "Penetration Issues": Wind,
};

const severityColors: Record<string, string> = {
  critical: "bg-red-500 text-white",
  warning: "bg-amber-500 text-white",
  info: "bg-blue-500 text-white",
};

export function DamageTemplateSelector({ onSelect, selectedTemplateId }: DamageTemplateSelectorProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  
  const { data: templates = [], isLoading, error } = useQuery<DamageTemplate[]>({
    queryKey: ["/api/damage-templates"],
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/damage-templates/seed", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/damage-templates"] });
    },
  });

  const categories = ["all", ...Array.from(new Set(templates.map(t => t.category).filter(Boolean)))];
  
  const filteredTemplates = activeCategory === "all" 
    ? templates 
    : templates.filter(t => t.category === activeCategory);

  if (isLoading) {
    return (
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Damage Templates</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-24 w-full bg-gray-800" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card className="bg-[#1A1A1A] border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Damage Templates</CardTitle>
          <CardDescription className="text-gray-400">
            No templates found. Seed the database with pre-built templates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="bg-[#FF6B00] hover:bg-[#FF6B00]/90"
            data-testid="button-seed-templates"
          >
            {seedMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Seeding...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Seed Default Templates
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#1A1A1A] border-gray-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-[#FF6B00]" />
          Damage Templates
        </CardTitle>
        <CardDescription className="text-gray-400">
          Select a pre-built template to auto-fill damage details
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList className="bg-gray-900 border border-gray-700 mb-4 w-full flex-wrap h-auto">
            {categories.map(cat => (
              <TabsTrigger 
                key={cat} 
                value={cat}
                className="text-xs data-[state=active]:bg-[#FF6B00] data-[state=active]:text-white"
                data-testid={`tab-category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {cat === "all" ? "All" : cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="h-[320px] pr-4">
            <div className="space-y-3">
              {filteredTemplates.map(template => {
                const Icon = categoryIcons[template.category || ""] || AlertTriangle;
                const isSelected = selectedTemplateId === template.id;
                
                return (
                  <Card 
                    key={template.id}
                    className={`cursor-pointer transition-all hover:border-[#FF6B00] ${
                      isSelected 
                        ? "border-[#FF6B00] bg-[#FF6B00]/10" 
                        : "bg-gray-900/50 border-gray-700"
                    }`}
                    onClick={() => onSelect(template)}
                    data-testid={`card-template-${template.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="p-2 rounded-lg bg-gray-800">
                            <Icon className="h-5 w-5 text-[#FF6B00]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-white truncate">
                                {template.name}
                              </h4>
                              {isSelected && (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                              {template.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                              <Badge 
                                className={severityColors[template.defaultSeverity || "info"]}
                              >
                                {template.defaultSeverity}
                              </Badge>
                              {template.affectedComponents && (
                                <span className="text-xs text-gray-500">
                                  {(template.affectedComponents as string[]).slice(0, 2).join(", ")}
                                  {(template.affectedComponents as string[]).length > 2 && "..."}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface TemplateDetailsProps {
  template: DamageTemplate;
}

export function DamageTemplateDetails({ template }: TemplateDetailsProps) {
  const Icon = categoryIcons[template.category || ""] || AlertTriangle;
  
  return (
    <Card className="bg-[#1A1A1A] border-gray-800">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-800">
            <Icon className="h-6 w-6 text-[#FF6B00]" />
          </div>
          <div>
            <CardTitle className="text-white">{template.name}</CardTitle>
            <CardDescription className="text-gray-400">{template.category}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Description</h4>
          <p className="text-sm text-gray-400">{template.description}</p>
        </div>

        {template.affectedComponents && (template.affectedComponents as string[]).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Affected Components</h4>
            <div className="flex flex-wrap gap-2">
              {(template.affectedComponents as string[]).map((comp, i) => (
                <Badge key={i} variant="outline" className="border-gray-600 text-gray-300">
                  {comp}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {template.typicalCauses && (template.typicalCauses as string[]).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Typical Causes</h4>
            <ul className="text-sm text-gray-400 list-disc list-inside">
              {(template.typicalCauses as string[]).map((cause, i) => (
                <li key={i}>{cause}</li>
              ))}
            </ul>
          </div>
        )}

        {template.recommendations && (template.recommendations as any[]).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Recommendations</h4>
            <div className="space-y-2">
              {(template.recommendations as any[]).map((rec, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Badge 
                    variant="outline" 
                    className={`text-xs shrink-0 ${
                      rec.priority === 'immediate' 
                        ? 'border-red-500 text-red-400' 
                        : rec.priority === 'short_term'
                        ? 'border-amber-500 text-amber-400'
                        : 'border-blue-500 text-blue-400'
                    }`}
                  >
                    {rec.priority?.replace('_', ' ')}
                  </Badge>
                  <span className="text-gray-400">{rec.action}</span>
                  {rec.estimatedCost && (
                    <span className="text-green-400 ml-auto shrink-0">{rec.estimatedCost}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {template.inspectionNotes && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
            <h4 className="text-sm font-medium text-amber-400 mb-1">Inspection Notes</h4>
            <p className="text-sm text-gray-300">{template.inspectionNotes}</p>
          </div>
        )}

        {template.requiredEvidence && (template.requiredEvidence as string[]).length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">Required Evidence</h4>
            <div className="flex flex-wrap gap-2">
              {(template.requiredEvidence as string[]).map((evidence, i) => (
                <Badge key={i} className="bg-[#FF6B00]/20 text-[#FF6B00] border-[#FF6B00]">
                  {evidence.replace(/_/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
