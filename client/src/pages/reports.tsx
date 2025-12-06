import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft, 
  FileText, 
  Download, 
  Eye, 
  Filter, 
  Calendar,
  Building,
  Search,
  TrendingUp,
  BarChart3,
  PieChart,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useLocation } from 'wouter';
import winnstormLogo from '@assets/logo-dark_1765042579232.png';
import { Header, Footer } from '@/components/navbar';
import { SEO, breadcrumbSchema } from '@/components/seo';

interface Report {
  id: number;
  title: string;
  propertyName: string;
  propertyAddress: string;
  type: 'winn-report' | 'thermal-analysis' | 'damage-assessment';
  status: 'completed' | 'processing' | 'pending';
  createdDate: string;
  completedDate?: string;
  fileSize: string;
  pageCount: number;
  downloadUrl: string;
  previewUrl: string;
  damageType: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  estimatedCost: number;
}

const ReportsPage: React.FC = () => {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("all-reports");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Realistic report data for MVP demonstration
  const reports: Report[] = [
    {
      id: 1,
      title: "Complete Hail Damage Assessment - Meridian Business Center",
      propertyName: "Meridian Business Center",
      propertyAddress: "2500 Technology Drive, Plano, TX 75074",
      type: "winn-report",
      status: "completed",
      createdDate: "2025-01-15T10:30:00Z",
      completedDate: "2025-01-15T14:45:00Z",
      fileSize: "47.2 MB",
      pageCount: 312,
      downloadUrl: "/reports/meridian-hail-damage-2025-01-15.pdf",
      previewUrl: "/reports/preview/meridian-hail-damage-2025-01-15",
      damageType: "Hail Impact",
      severity: "critical",
      estimatedCost: 485000
    },
    {
      id: 2,
      title: "Wind Damage Analysis - Legacy Village Shopping Center",
      propertyName: "Legacy Village Shopping Center", 
      propertyAddress: "7200 Bishop Road, Plano, TX 75024",
      type: "damage-assessment",
      status: "completed",
      createdDate: "2025-01-08T09:15:00Z",
      completedDate: "2025-01-08T16:30:00Z",
      fileSize: "32.8 MB",
      pageCount: 187,
      downloadUrl: "/reports/legacy-wind-damage-2025-01-08.pdf",
      previewUrl: "/reports/preview/legacy-wind-damage-2025-01-08",
      damageType: "Wind Uplift",
      severity: "moderate",
      estimatedCost: 287500
    },
    {
      id: 3,
      title: "Emergency Tornado Assessment - Industrial Distribution Facility",
      propertyName: "Industrial Distribution Facility",
      propertyAddress: "1850 Central Expressway, Richardson, TX 75080",
      type: "winn-report",
      status: "processing",
      createdDate: "2025-01-20T11:00:00Z",
      fileSize: "Est. 65+ MB",
      pageCount: 450,
      downloadUrl: "",
      previewUrl: "",
      damageType: "Tornado",
      severity: "critical",
      estimatedCost: 1200000
    },
    {
      id: 4,
      title: "Flood Damage Documentation - Oakwood Apartments",
      propertyName: "Oakwood Apartments",
      propertyAddress: "5420 LBJ Freeway, Dallas, TX 75240",
      type: "thermal-analysis",
      status: "completed",
      createdDate: "2025-01-12T14:20:00Z",
      completedDate: "2025-01-12T18:45:00Z",
      fileSize: "28.4 MB",
      pageCount: 156,
      downloadUrl: "/reports/oakwood-flood-damage-2025-01-12.pdf",
      previewUrl: "/reports/preview/oakwood-flood-damage-2025-01-12",
      damageType: "Water Intrusion",
      severity: "high",
      estimatedCost: 342000
    },
    {
      id: 5,
      title: "Quarterly Inspection Report - Dallas Commercial Portfolio",
      propertyName: "Multiple Properties",
      propertyAddress: "Various Dallas Metro Locations",
      type: "damage-assessment",
      status: "pending",
      createdDate: "2025-01-25T08:00:00Z",
      fileSize: "TBD",
      pageCount: 0,
      downloadUrl: "",
      previewUrl: "",
      damageType: "Preventive Maintenance",
      severity: "low",
      estimatedCost: 0
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'pending': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case 'winn-report': return <FileText className="h-5 w-5 text-primary" />;
      case 'thermal-analysis': return <TrendingUp className="h-5 w-5 text-cyan-500" />;
      case 'damage-assessment': return <BarChart3 className="h-5 w-5 text-blue-500" />;
      default: return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getReportTypeName = (type: string) => {
    switch (type) {
      case 'winn-report': return 'Winn Report';
      case 'thermal-analysis': return 'Thermal Analysis';
      case 'damage-assessment': return 'Damage Assessment';
      default: return 'Report';
    }
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || report.type === filterType;
    const matchesStatus = filterStatus === 'all' || report.status === filterStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const completedReports = reports.filter(r => r.status === 'completed');
  const totalEstimatedCost = completedReports.reduce((sum, report) => sum + report.estimatedCost, 0);
  const totalPages = completedReports.reduce((sum, report) => sum + report.pageCount, 0);

  return (
    <div className="min-h-screen flex flex-col relative bg-background text-foreground">
      <SEO
        title="Reports Library"
        description="Access and manage your damage assessment reports. View Winn Reports, thermal analysis documents, and comprehensive property evaluations."
        canonical="/reports"
        noindex={true}
        structuredData={breadcrumbSchema([
          { name: 'Home', url: '/' },
          { name: 'Reports', url: '/reports' }
        ])}
      />
      <Header />
      
      <main className="flex-grow pb-20">
        <div className="max-w-7xl mx-auto p-6">
          {/* WinnStorm™ Branded Header */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/dashboard')}
                className="mr-4 p-2 hover:bg-primary/10"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center">
                <div className="relative mr-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-cyan-500/30 rounded-lg blur-md"></div>
                  <img src={winnstormLogo} alt="WinnStorm" className="h-10 relative z-10" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                    Damage Assessment Reports
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Comprehensive inspection reports using the proven Winn Methodology
                  </p>
                </div>
              </div>
            </div>

            {/* Summary Statistics */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-primary/20 rounded-lg mr-3">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Reports</p>
                      <p className="text-2xl font-bold text-primary">{reports.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-green-500/5 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-500/20 rounded-lg mr-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-bold text-green-600">{completedReports.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-blue-500/5 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-500/20 rounded-lg mr-3">
                      <PieChart className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Pages</p>
                      <p className="text-2xl font-bold text-blue-600">{totalPages.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-card to-orange-500/5 border-orange-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-500/20 rounded-lg mr-3">
                      <TrendingUp className="h-5 w-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Est. Damages</p>
                      <p className="text-2xl font-bold text-orange-600">${(totalEstimatedCost / 1000000).toFixed(1)}M</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-card border-border">
              <TabsTrigger value="all-reports" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <FileText className="w-4 h-4 mr-2" />
                All Reports
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </TabsTrigger>
            </TabsList>

            {/* All Reports Tab */}
            <TabsContent value="all-reports" className="space-y-6">
              {/* Search and Filters */}
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search reports..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Report Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="winn-report">Winn Reports</SelectItem>
                        <SelectItem value="thermal-analysis">Thermal Analysis</SelectItem>
                        <SelectItem value="damage-assessment">Damage Assessment</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
                      <Filter className="w-4 h-4 mr-2" />
                      Advanced Filters
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Reports List */}
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <Card key={report.id} className="bg-card border-border hover:border-primary/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="grid md:grid-cols-12 gap-4 items-center">
                        {/* Report Icon and Basic Info */}
                        <div className="md:col-span-5">
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-secondary/20 rounded-lg">
                              {getReportTypeIcon(report.type)}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground mb-1">{report.title}</h3>
                              <p className="text-sm text-muted-foreground mb-1">
                                <Building className="h-4 w-4 inline mr-1" />
                                {report.propertyName}
                              </p>
                              <p className="text-xs text-muted-foreground">{report.propertyAddress}</p>
                            </div>
                          </div>
                        </div>

                        {/* Report Details */}
                        <div className="md:col-span-4">
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className={getSeverityColor(report.severity)}>
                                {report.severity.charAt(0).toUpperCase() + report.severity.slice(1)}
                              </Badge>
                              <Badge variant="outline">
                                {getReportTypeName(report.type)}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(report.createdDate).toLocaleDateString()}</span>
                              {report.completedDate && (
                                <>
                                  <span>•</span>
                                  <span>{report.pageCount} pages</span>
                                  <span>•</span>
                                  <span>{report.fileSize}</span>
                                </>
                              )}
                            </div>
                            {report.estimatedCost > 0 && (
                              <p className="text-sm font-medium text-orange-600">
                                Est. Damage: ${report.estimatedCost.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Status and Actions */}
                        <div className="md:col-span-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(report.status)}`}></div>
                              <span className="text-sm font-medium capitalize">{report.status}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {report.status === 'completed' && (
                                <>
                                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {report.status === 'processing' && (
                                <div className="flex items-center space-x-2 text-yellow-600">
                                  <Clock className="h-4 w-4" />
                                  <span className="text-sm">Processing...</span>
                                </div>
                              )}
                              {report.status === 'pending' && (
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span className="text-sm">Pending</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-primary" />
                      Report Distribution
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Breakdown by report type and status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['winn-report', 'thermal-analysis', 'damage-assessment'].map((type) => {
                        const count = reports.filter(r => r.type === type).length;
                        const percentage = (count / reports.length) * 100;
                        return (
                          <div key={type} className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="font-medium">{getReportTypeName(type)}</span>
                              <span className="text-muted-foreground">{count} reports</span>
                            </div>
                            <div className="w-full bg-secondary/20 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Damage Severity Analysis
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Distribution of damage severity levels
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {['critical', 'high', 'moderate', 'low'].map((severity) => {
                        const count = reports.filter(r => r.severity === severity).length;
                        const totalDamage = reports
                          .filter(r => r.severity === severity)
                          .reduce((sum, r) => sum + r.estimatedCost, 0);
                        return (
                          <div key={severity} className="flex justify-between items-center p-3 bg-secondary/10 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Badge variant="outline" className={getSeverityColor(severity)}>
                                {severity.charAt(0).toUpperCase() + severity.slice(1)}
                              </Badge>
                              <span className="text-sm font-medium">{count} properties</span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              ${totalDamage.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default ReportsPage;