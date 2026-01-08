import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  ArrowLeft,
  MoreHorizontal,
  Filter,
  Download,
  Upload
} from 'lucide-react';
import { useLocation } from 'wouter';
import { Header, Footer } from '@/components/navbar';
import winnstormLogo from '@assets/logo-dark_1765042579232.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddressAutocomplete } from '@/components/address-autocomplete';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  company?: string;
  address: string;
  city: string;
  state: string;
  status: 'active' | 'prospect' | 'inactive';
  totalProperties: number;
  totalInspections: number;
  lastContact?: string;
}

const mockClients: Client[] = [
  {
    id: 1,
    name: "John Smith",
    email: "john.smith@example.com",
    phone: "(555) 123-4567",
    company: "Smith Roofing Co.",
    address: "123 Main St",
    city: "Dallas",
    state: "TX",
    status: 'active',
    totalProperties: 5,
    totalInspections: 12,
    lastContact: "2025-01-25"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.j@insurancepro.com",
    phone: "(555) 234-5678",
    company: "Insurance Pro Inc.",
    address: "456 Oak Ave",
    city: "Houston",
    state: "TX",
    status: 'active',
    totalProperties: 8,
    totalInspections: 24,
    lastContact: "2025-01-27"
  },
  {
    id: 3,
    name: "Mike Williams",
    email: "mike.w@propertygroup.com",
    phone: "(555) 345-6789",
    company: "Property Management Group",
    address: "789 Elm Blvd",
    city: "Kansas City",
    state: "MO",
    status: 'prospect',
    totalProperties: 0,
    totalInspections: 0,
    lastContact: "2025-01-20"
  },
  {
    id: 4,
    name: "Emily Davis",
    email: "emily.davis@publicadjuster.com",
    phone: "(555) 456-7890",
    company: "Davis Public Adjusting",
    address: "321 Pine St",
    city: "Fort Worth",
    state: "TX",
    status: 'active',
    totalProperties: 15,
    totalInspections: 42,
    lastContact: "2025-01-26"
  },
  {
    id: 5,
    name: "Robert Chen",
    email: "rchen@homeowners.net",
    phone: "(555) 567-8901",
    address: "555 Cedar Lane",
    city: "Plano",
    state: "TX",
    status: 'inactive',
    totalProperties: 1,
    totalInspections: 2,
    lastContact: "2024-12-15"
  }
];

export default function ClientsPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientCity, setNewClientCity] = useState('');
  const [newClientState, setNewClientState] = useState('');

  const filteredClients = mockClients.filter(client => {
    const matchesSearch = 
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">Active</Badge>;
      case 'prospect':
        return <Badge className="bg-gray-500/10 text-gray-500 border-gray-500/20">Prospect</Badge>;
      case 'inactive':
        return <Badge className="bg-gray-500/10 text-gray-400 border-gray-500/20">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalClients = mockClients.length;
  const activeClients = mockClients.filter(c => c.status === 'active').length;
  const totalProperties = mockClients.reduce((sum, c) => sum + c.totalProperties, 0);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-white mb-4"
            data-testid="button-back-dashboard"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Users className="h-8 w-8 text-orange-500" />
                Client Management
              </h1>
              <p className="text-slate-400 mt-1">
                Manage your clients, contacts, and relationships
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" className="border-slate-700" data-testid="button-import-clients">
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button variant="outline" className="border-slate-700" data-testid="button-export-clients">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-add-client">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Client
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900 border-slate-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Add New Client</DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Enter the client's information below
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                        <Input id="name" placeholder="John Smith" className="bg-slate-800 border-slate-700" data-testid="input-client-name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="company" className="text-slate-300">Company</Label>
                        <Input id="company" placeholder="Company Name" className="bg-slate-800 border-slate-700" data-testid="input-client-company" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300">Email</Label>
                        <Input id="email" type="email" placeholder="john@example.com" className="bg-slate-800 border-slate-700" data-testid="input-client-email" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-slate-300">Phone</Label>
                        <Input id="phone" placeholder="(555) 123-4567" className="bg-slate-800 border-slate-700" data-testid="input-client-phone" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-slate-300">Address</Label>
                      <AddressAutocomplete
                        id="address"
                        value={newClientAddress}
                        onChange={(address, placeDetails) => {
                          setNewClientAddress(address);
                          if (placeDetails?.address_components) {
                            const cityComponent = placeDetails.address_components.find(
                              c => c.types.includes('locality')
                            );
                            const stateComponent = placeDetails.address_components.find(
                              c => c.types.includes('administrative_area_level_1')
                            );
                            if (cityComponent) setNewClientCity(cityComponent.long_name);
                            if (stateComponent) setNewClientState(stateComponent.short_name);
                          }
                        }}
                        placeholder="123 Main St"
                        className="bg-slate-800 border-slate-700"
                        data-testid="input-client-address"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-slate-300">City</Label>
                        <Input 
                          id="city" 
                          placeholder="Dallas" 
                          className="bg-slate-800 border-slate-700" 
                          data-testid="input-client-city"
                          value={newClientCity}
                          onChange={(e) => setNewClientCity(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state" className="text-slate-300">State</Label>
                        <Input 
                          id="state" 
                          placeholder="TX" 
                          className="bg-slate-800 border-slate-700" 
                          data-testid="input-client-state"
                          value={newClientState}
                          onChange={(e) => setNewClientState(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-slate-300">Status</Label>
                        <Select>
                          <SelectTrigger className="bg-slate-800 border-slate-700" data-testid="select-client-status">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="prospect">Prospect</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-slate-700">
                      Cancel
                    </Button>
                    <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-save-client">
                      Save Client
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Clients</p>
                  <p className="text-3xl font-bold text-white">{totalClients}</p>
                </div>
                <Users className="h-10 w-10 text-orange-500/50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Active Clients</p>
                  <p className="text-3xl font-bold text-orange-400">{activeClients}</p>
                </div>
                <Badge className="bg-orange-500/10 text-orange-500 text-lg px-3 py-1">
                  {Math.round((activeClients / totalClients) * 100)}%
                </Badge>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Properties</p>
                  <p className="text-3xl font-bold text-gray-400">{totalProperties}</p>
                </div>
                <Building2 className="h-10 w-10 text-gray-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search clients by name, email, or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-900 border-slate-700 text-white"
              data-testid="input-search-clients"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700" data-testid="select-status-filter">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-700">
              <SelectItem value="all">All Clients</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="prospect">Prospects</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clients List */}
        <div className="space-y-4">
          {filteredClients.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No clients found matching your search</p>
              </CardContent>
            </Card>
          ) : (
            filteredClients.map((client) => (
              <Card 
                key={client.id} 
                className="bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors cursor-pointer"
                data-testid={`card-client-${client.id}`}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <span className="text-orange-500 font-semibold text-lg">
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-semibold">{client.name}</h3>
                          {getStatusBadge(client.status)}
                        </div>
                        {client.company && (
                          <p className="text-slate-400 text-sm flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {client.company}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-slate-400 text-xs uppercase">Contact</p>
                        <p className="text-slate-300 text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {client.email}
                        </p>
                        <p className="text-slate-300 text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {client.phone}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-400 text-xs uppercase">Location</p>
                        <p className="text-slate-300 text-sm flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {client.city}, {client.state}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs uppercase">Properties</p>
                        <p className="text-2xl font-bold text-blue-400">{client.totalProperties}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-slate-400 text-xs uppercase">Inspections</p>
                        <p className="text-2xl font-bold text-orange-400">{client.totalInspections}</p>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400" data-testid={`button-client-menu-${client.id}`}>
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem className="text-slate-300 focus:bg-slate-700" data-testid={`menu-item-view-${client.id}`}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300 focus:bg-slate-700" data-testid={`menu-item-edit-${client.id}`}>
                          Edit Client
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300 focus:bg-slate-700" data-testid={`menu-item-properties-${client.id}`}>
                          View Properties
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-slate-300 focus:bg-slate-700" data-testid={`menu-item-schedule-${client.id}`}>
                          Schedule Inspection
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400 focus:bg-slate-700" data-testid={`menu-item-delete-${client.id}`}>
                          Delete Client
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
