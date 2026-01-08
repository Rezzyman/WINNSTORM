import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet-async";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Users, 
  UserPlus, 
  Calendar, 
  MapPin, 
  BarChart3, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Settings
} from "lucide-react";
import type { TeamAssignment } from "@shared/schema";

interface WorkloadData {
  inspectorId: number;
  inspectorName: string;
  teamName: string;
  region: string;
  maxDaily: number;
  maxWeekly: number;
  currentWeekly: number;
  isAvailable: boolean;
  unavailableUntil: string | null;
  specializations: string[];
  utilizationPercent: number;
}

export default function TeamManagement() {
  const { toast } = useToast();
  const [isAddingAssignment, setIsAddingAssignment] = useState(false);

  const { data: workload = [], isLoading: workloadLoading } = useQuery<WorkloadData[]>({
    queryKey: ["/api/team/workload"],
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<TeamAssignment[]>({
    queryKey: ["/api/team/assignments"],
  });

  const createAssignment = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/team/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team/workload"] });
      toast({ title: "Team assignment created" });
      setIsAddingAssignment(false);
    },
    onError: () => {
      toast({ title: "Failed to create assignment", variant: "destructive" });
    },
  });

  const updateAssignment = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      return await apiRequest(`/api/team/assignments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/team/workload"] });
      toast({ title: "Assignment updated" });
    },
  });

  const getUtilizationColor = (percent: number) => {
    if (percent >= 90) return "text-red-500";
    if (percent >= 70) return "text-amber-500";
    return "text-orange-500";
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 90) return "bg-red-500";
    if (percent >= 70) return "bg-amber-500";
    return "bg-orange-500";
  };

  const totalInspectors = workload.length;
  const availableInspectors = workload.filter(w => w.isAvailable).length;
  const avgUtilization = workload.length 
    ? Math.round(workload.reduce((acc, w) => acc + w.utilizationPercent, 0) / workload.length)
    : 0;
  const overloadedCount = workload.filter(w => w.utilizationPercent >= 90).length;

  if (workloadLoading || assignmentsLoading) {
    return (
      <div className="min-h-screen bg-[#121212] p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64 bg-gray-800" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-24 bg-gray-800" />
            ))}
          </div>
          <Skeleton className="h-96 bg-gray-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] p-6">
      <Helmet>
        <title>Team Management | WinnStorm</title>
        <meta name="description" content="Manage inspector team assignments and monitor workload distribution" />
      </Helmet>
      
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="h-8 w-8 text-[#FF6B00]" />
              Team Management
            </h1>
            <p className="text-gray-400 mt-1">
              Monitor inspector workloads and manage team assignments
            </p>
          </div>
          
          <Dialog open={isAddingAssignment} onOpenChange={setIsAddingAssignment}>
            <DialogTrigger asChild>
              <Button className="bg-[#FF6B00] hover:bg-[#FF6B00]/90" data-testid="button-add-assignment">
                <UserPlus className="mr-2 h-4 w-4" />
                Add Inspector
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1A1A1A] border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Add Team Assignment</DialogTitle>
              </DialogHeader>
              <AddAssignmentForm 
                onSubmit={(data) => createAssignment.mutate(data)}
                isPending={createAssignment.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-gray-500/20">
                  <Users className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Inspectors</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-total-inspectors">
                    {totalInspectors}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-orange-500/20">
                  <CheckCircle className="h-6 w-6 text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Available</p>
                  <p className="text-2xl font-bold text-white" data-testid="text-available-inspectors">
                    {availableInspectors}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-[#FF6B00]/20">
                  <BarChart3 className="h-6 w-6 text-[#FF6B00]" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Avg Utilization</p>
                  <p className={`text-2xl font-bold ${getUtilizationColor(avgUtilization)}`} data-testid="text-avg-utilization">
                    {avgUtilization}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-gray-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-red-500/20">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">Overloaded</p>
                  <p className="text-2xl font-bold text-red-400" data-testid="text-overloaded-count">
                    {overloadedCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-[#1A1A1A] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#FF6B00]" />
              Weekly Workload
            </CardTitle>
            <CardDescription className="text-gray-400">
              Current week inspection assignments by inspector
            </CardDescription>
          </CardHeader>
          <CardContent>
            {workload.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No team assignments yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Add inspectors to start tracking workloads
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {workload.map((inspector) => (
                  <div 
                    key={inspector.inspectorId}
                    className="flex items-center gap-4 p-4 rounded-lg bg-gray-900/50 border border-gray-800"
                    data-testid={`card-inspector-${inspector.inspectorId}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-white">{inspector.inspectorName}</h4>
                        {!inspector.isAvailable && (
                          <Badge variant="outline" className="border-amber-500 text-amber-400">
                            <Clock className="h-3 w-3 mr-1" />
                            Unavailable
                          </Badge>
                        )}
                        {inspector.utilizationPercent >= 90 && (
                          <Badge variant="outline" className="border-red-500 text-red-400">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Overloaded
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        {inspector.teamName && (
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {inspector.teamName}
                          </span>
                        )}
                        {inspector.region && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {inspector.region}
                          </span>
                        )}
                      </div>
                      {inspector.specializations && inspector.specializations.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {inspector.specializations.map((spec, i) => (
                            <Badge key={i} variant="secondary" className="text-xs bg-gray-800">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="w-48">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-400">
                          {inspector.currentWeekly} / {inspector.maxWeekly}
                        </span>
                        <span className={getUtilizationColor(inspector.utilizationPercent)}>
                          {inspector.utilizationPercent}%
                        </span>
                      </div>
                      <Progress 
                        value={inspector.utilizationPercent} 
                        className="h-2 bg-gray-800"
                      />
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                      data-testid={`button-settings-${inspector.inspectorId}`}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AddAssignmentForm({ onSubmit, isPending }: { onSubmit: (data: any) => void; isPending: boolean }) {
  const [inspectorId, setInspectorId] = useState("");
  const [teamName, setTeamName] = useState("");
  const [region, setRegion] = useState("");
  const [maxDaily, setMaxDaily] = useState("4");
  const [maxWeekly, setMaxWeekly] = useState("20");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      inspectorId: parseInt(inspectorId),
      teamName,
      region,
      maxDailyInspections: parseInt(maxDaily),
      maxWeeklyInspections: parseInt(maxWeekly),
      isAvailable: true,
      specializations: [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-gray-300">Inspector ID</Label>
        <Input
          type="number"
          value={inspectorId}
          onChange={(e) => setInspectorId(e.target.value)}
          placeholder="Enter inspector user ID"
          className="bg-gray-900 border-gray-700 text-white"
          required
          data-testid="input-inspector-id"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Team Name</Label>
          <Input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="e.g., North Team"
            className="bg-gray-900 border-gray-700 text-white"
            data-testid="input-team-name"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Region</Label>
          <Input
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g., North Texas"
            className="bg-gray-900 border-gray-700 text-white"
            data-testid="input-region"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Max Daily Inspections</Label>
          <Input
            type="number"
            value={maxDaily}
            onChange={(e) => setMaxDaily(e.target.value)}
            className="bg-gray-900 border-gray-700 text-white"
            data-testid="input-max-daily"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-gray-300">Max Weekly Inspections</Label>
          <Input
            type="number"
            value={maxWeekly}
            onChange={(e) => setMaxWeekly(e.target.value)}
            className="bg-gray-900 border-gray-700 text-white"
            data-testid="input-max-weekly"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-[#FF6B00] hover:bg-[#FF6B00]/90"
        disabled={isPending || !inspectorId}
        data-testid="button-submit-assignment"
      >
        {isPending ? "Creating..." : "Create Assignment"}
      </Button>
    </form>
  );
}
