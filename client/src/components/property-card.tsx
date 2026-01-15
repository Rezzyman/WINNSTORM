import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { Property } from "@shared/schema";

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard = ({ property }: PropertyCardProps) => {
  const [, navigate] = useLocation();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-success bg-opacity-10 text-success";
    if (score >= 60) return "bg-warning bg-opacity-10 text-warning";
    return "bg-destructive bg-opacity-10 text-destructive";
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.round((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  return (
    <Card className="overflow-hidden cursor-pointer border border-border hover:border-primary transition-colors shadow-md" onClick={() => navigate(`/property/${property.id}`)}>
      <div className="h-48 w-full overflow-hidden">
        <img
          src={property.imageUrl || '/placeholder-property.jpg'}
          alt={property.name}
          className="w-full h-full object-cover"
        />
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-foreground">{property.name}</h3>
          <Badge variant="outline" className={getScoreColor(75)}>
            {property.overallCondition || 'Unknown'}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm mb-3">{property.address}</p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Last scan: {property.lastInspectionDate ? formatDate(new Date(property.lastInspectionDate)) : 'Not yet inspected'}
          </span>
          <span className="text-primary font-medium">View Details →</span>
        </div>
      </CardContent>
    </Card>
  );
};
