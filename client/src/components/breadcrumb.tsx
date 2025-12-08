import { Link } from 'wouter';
import { ChevronRight, Home } from 'lucide-react';
import { breadcrumbSchema } from './seo';

export interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  const allItems = [{ name: 'Home', url: '/' }, ...items];
  const schema = breadcrumbSchema(allItems);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <nav 
        aria-label="Breadcrumb" 
        className={`flex items-center text-sm text-muted-foreground ${className}`}
        data-testid="breadcrumb-nav"
      >
        <ol className="flex items-center flex-wrap gap-1">
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            
            return (
              <li key={item.url} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
                )}
                
                {index === 0 ? (
                  <Link href={item.url}>
                    <span className="flex items-center hover:text-foreground transition-colors cursor-pointer">
                      <Home className="h-4 w-4" />
                      <span className="sr-only">{item.name}</span>
                    </span>
                  </Link>
                ) : isLast ? (
                  <span 
                    className="font-medium text-foreground" 
                    aria-current="page"
                    data-testid={`breadcrumb-current-${item.url.replace(/\//g, '-')}`}
                  >
                    {item.name}
                  </span>
                ) : (
                  <Link href={item.url}>
                    <span 
                      className="hover:text-foreground transition-colors cursor-pointer"
                      data-testid={`breadcrumb-link-${item.url.replace(/\//g, '-')}`}
                    >
                      {item.name}
                    </span>
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}

export default Breadcrumb;
