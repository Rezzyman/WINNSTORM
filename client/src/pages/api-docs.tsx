import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEO } from '@/components/seo';
import { 
  Code, 
  Terminal, 
  Key, 
  Zap, 
  Shield,
  FileJson,
  Copy,
  Check,
  Home,
  ExternalLink
} from 'lucide-react';
import { useState } from 'react';
import winnstormLogo from '@assets/logo-dark_1765042579232.png';

const ApiDocs = () => {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const endpoints = [
    {
      category: "Authentication",
      endpoints: [
        {
          method: "POST",
          path: "/api/auth/login",
          description: "Authenticate user and receive access token",
          requestBody: `{
  "email": "user@example.com",
  "password": "securepassword"
}`,
          responseBody: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "123",
    "email": "user@example.com",
    "role": "consultant"
  }
}`
        },
        {
          method: "POST",
          path: "/api/auth/refresh",
          description: "Refresh authentication token",
          requestBody: `{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}`,
          responseBody: `{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}`
        }
      ]
    },
    {
      category: "Inspections",
      endpoints: [
        {
          method: "POST",
          path: "/api/inspections",
          description: "Create a new inspection session",
          requestBody: `{
  "propertyId": "prop_123",
  "type": "hail_damage",
  "scheduledDate": "2025-01-15T10:00:00Z"
}`,
          responseBody: `{
  "id": "insp_456",
  "status": "pending",
  "createdAt": "2025-01-10T08:30:00Z"
}`
        },
        {
          method: "GET",
          path: "/api/inspections/:id",
          description: "Retrieve inspection details",
          responseBody: `{
  "id": "insp_456",
  "propertyId": "prop_123",
  "status": "in_progress",
  "steps": {
    "weatherVerification": "complete",
    "thermalAnalysis": "in_progress"
  }
}`
        },
        {
          method: "PATCH",
          path: "/api/inspections/:id/step",
          description: "Update inspection step status",
          requestBody: `{
  "step": "thermalAnalysis",
  "status": "complete",
  "data": { ... }
}`,
          responseBody: `{
  "success": true,
  "nextStep": "photoDocumentation"
}`
        }
      ]
    },
    {
      category: "AI Analysis",
      endpoints: [
        {
          method: "POST",
          path: "/api/ai/thermal-analysis",
          description: "Analyze thermal image for damage patterns",
          requestBody: `{
  "imageUrl": "https://storage.example.com/thermal-001.jpg",
  "inspectionId": "insp_456"
}`,
          responseBody: `{
  "analysis": {
    "anomalies": [...],
    "temperatureDifferential": 8.5,
    "moistureIndicators": true,
    "recommendations": [...]
  }
}`
        },
        {
          method: "POST",
          path: "/api/ai/assistant",
          description: "Get AI-powered inspection guidance",
          requestBody: `{
  "message": "What should I look for next?",
  "context": {
    "currentStep": "thermalAnalysis",
    "inspectionId": "insp_456"
  }
}`,
          responseBody: `{
  "response": "Based on the thermal scan...",
  "suggestions": [...]
}`
        }
      ]
    },
    {
      category: "Reports",
      endpoints: [
        {
          method: "POST",
          path: "/api/reports",
          description: "Generate a Winn Report",
          requestBody: `{
  "inspectionId": "insp_456",
  "template": "comprehensive",
  "includeEvidence": true
}`,
          responseBody: `{
  "reportId": "rpt_789",
  "status": "generating",
  "estimatedTime": 30
}`
        },
        {
          method: "GET",
          path: "/api/reports/:id/download",
          description: "Download generated report",
          responseBody: `// Returns PDF binary`
        }
      ]
    }
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'POST': return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
      case 'PATCH': return 'bg-orange-400/10 text-orange-400 border-orange-400/30';
      case 'DELETE': return 'bg-gray-600/10 text-gray-600 border-gray-600/30';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="API Reference - WinnStorm Developer Documentation"
        description="Complete API documentation for WinnStorm damage assessment platform. RESTful endpoints for inspections, AI analysis, reports, and integrations with code examples."
        canonical="/api-docs"
        keywords={['WinnStorm API', 'damage assessment API', 'inspection API', 'thermal analysis API', 'developer documentation']}
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
              <Link href="/docs">
                <Button variant="ghost" size="sm">Documentation</Button>
              </Link>
              <Link href="/auth">
                <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-b from-orange-500/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl">
            <Badge className="mb-4 bg-orange-500/10 text-orange-500 border-orange-500/30">API Reference</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              WinnStorm <span className="text-orange-500">API</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Integrate WinnStorm's powerful damage assessment capabilities into your applications. 
              RESTful API with comprehensive endpoints for inspections, AI analysis, and report generation.
            </p>
            <div className="flex flex-wrap gap-4">
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <Shield className="h-5 w-5 text-orange-500" />
                  <div>
                    <div className="font-semibold">OAuth 2.0</div>
                    <div className="text-sm text-muted-foreground">Secure authentication</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <Zap className="h-5 w-5 text-orange-400" />
                  <div>
                    <div className="font-semibold">Rate Limited</div>
                    <div className="text-sm text-muted-foreground">1000 req/min</div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/50 bg-card/50">
                <CardContent className="p-4 flex items-center gap-3">
                  <FileJson className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-semibold">JSON Response</div>
                    <div className="text-sm text-muted-foreground">Standard format</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Base URL */}
      <section className="py-8 border-b border-border">
        <div className="container mx-auto px-6">
          <h2 className="text-lg font-semibold mb-4">Base URL</h2>
          <div className="bg-muted/50 rounded-lg p-4 font-mono text-sm flex items-center justify-between">
            <span>https://api.winnstorm.com/v1</span>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => copyToClipboard('https://api.winnstorm.com/v1', 'base')}
            >
              {copiedEndpoint === 'base' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </section>

      {/* API Endpoints */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8">Endpoints</h2>
          
          {endpoints.map((category, catIndex) => (
            <div key={catIndex} className="mb-12">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Terminal className="h-5 w-5 text-primary" />
                {category.category}
              </h3>
              
              <div className="space-y-6">
                {category.endpoints.map((endpoint, endIndex) => (
                  <Card key={endIndex} className="border-border/50 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50 py-4">
                      <div className="flex items-center gap-4">
                        <Badge className={`${getMethodColor(endpoint.method)} font-mono`}>
                          {endpoint.method}
                        </Badge>
                        <code className="text-sm font-mono">{endpoint.path}</code>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="ml-auto"
                          onClick={() => copyToClipboard(endpoint.path, endpoint.path)}
                        >
                          {copiedEndpoint === endpoint.path ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                      <CardDescription className="mt-2">{endpoint.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Tabs defaultValue="request" className="w-full">
                        <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-transparent h-auto p-0">
                          {endpoint.requestBody && (
                            <TabsTrigger 
                              value="request" 
                              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                            >
                              Request Body
                            </TabsTrigger>
                          )}
                          <TabsTrigger 
                            value="response"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                          >
                            Response
                          </TabsTrigger>
                        </TabsList>
                        {endpoint.requestBody && (
                          <TabsContent value="request" className="m-0">
                            <pre className="p-4 bg-zinc-950 text-zinc-100 text-sm overflow-x-auto">
                              <code>{endpoint.requestBody}</code>
                            </pre>
                          </TabsContent>
                        )}
                        <TabsContent value="response" className="m-0">
                          <pre className="p-4 bg-zinc-950 text-zinc-100 text-sm overflow-x-auto">
                            <code>{endpoint.responseBody}</code>
                          </pre>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Authentication Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
            <Key className="h-6 w-6 text-primary" />
            Authentication
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>API Key Authentication</CardTitle>
                <CardDescription>Include your API key in the request header</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-zinc-950 text-zinc-100 text-sm rounded-lg overflow-x-auto">
{`curl -X GET https://api.winnstorm.com/v1/inspections \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}
                </pre>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle>Getting Your API Key</CardTitle>
                <CardDescription>Generate keys from your dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  1. Sign in to your WinnStorm account<br/>
                  2. Navigate to Settings → API Keys<br/>
                  3. Click "Generate New Key"<br/>
                  4. Copy and securely store your key
                </p>
                <Button asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SDKs Section */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl font-bold mb-8">SDKs & Libraries</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Code className="h-8 w-8 text-orange-400 mb-4" />
                <h3 className="font-semibold mb-2">JavaScript / TypeScript</h3>
                <p className="text-sm text-muted-foreground mb-4">npm install @winnstorm/sdk</p>
                <Badge variant="outline">Coming Soon</Badge>
              </CardContent>
            </Card>
            <Card className="border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Code className="h-8 w-8 text-gray-500 mb-4" />
                <h3 className="font-semibold mb-2">Python</h3>
                <p className="text-sm text-muted-foreground mb-4">pip install winnstorm</p>
                <Badge variant="outline">Coming Soon</Badge>
              </CardContent>
            </Card>
            <Card className="border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <Code className="h-8 w-8 text-orange-500 mb-4" />
                <h3 className="font-semibold mb-2">REST API</h3>
                <p className="text-sm text-muted-foreground mb-4">Direct HTTP requests</p>
                <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/30">Available</Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Integrate?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Start building with the WinnStorm API today. Get your API key and access comprehensive documentation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth">
                Get API Key
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/support">
                Contact Sales
              </Link>
            </Button>
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

export default ApiDocs;
