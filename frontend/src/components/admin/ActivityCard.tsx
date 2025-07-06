import type { LiveActivity } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, UserCircle, ShoppingCart, LogIn, Eye } from 'lucide-react'; // Added Eye for generic view

interface ActivityCardProps {
  activity: LiveActivity;
}

const iconMap: Record<string, React.ElementType> = {
  "Login Attempt": LogIn,
  "Product Viewed": Eye,
  "Added to Cart": ShoppingCart,
  "Checkout Started": ShoppingCart,
  "Password Changed": UserCircle,
  "Checkout Failed": AlertTriangle,
  "Default": Activity, // Lucide's Activity icon as default
};

export function ActivityCard({ activity }: ActivityCardProps) {
  const IconComponent = iconMap[activity.action] || iconMap["Default"];

  return (
    <Card className={`shadow-md hover:shadow-lg transition-shadow duration-200 ${activity.isSuspicious ? 'border-l-4 border-destructive' : 'border-l-4 border-primary'}`}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconComponent className={`h-5 w-5 ${activity.isSuspicious ? 'text-destructive' : 'text-primary'}`} />
            <CardTitle className="text-base font-semibold">{activity.action}</CardTitle>
          </div>
          {activity.riskScore !== undefined && (
             <Badge variant={activity.isSuspicious ? 'destructive' : 'secondary'} className="text-xs">
              Risk: {activity.riskScore}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 text-sm">
        <p className="text-muted-foreground">
          User: <span className="font-medium text-foreground">{activity.userEmail || activity.userId}</span>
        </p>
        <p className="text-xs text-muted-foreground/80">
          Time: {new Date(activity.timestamp).toLocaleString()}
        </p>
        {activity.details && Object.keys(activity.details).length > 0 && (
          <div className="mt-2 text-xs bg-muted/50 p-2 rounded-md">
            {Object.entries(activity.details).map(([key, value]) => (
              <p key={key}><span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span> {String(value)}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Fallback for Activity if not imported
import { Activity } from 'lucide-react'; 
