
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: string;
  trendColor?: string; // Use Tailwind color classes directly e.g. "text-green-500" or "text-destructive"
}

export function StatCard({ title, value, icon: Icon, description, trend, trendColor }: StatCardProps) {
  return (
    <Card className="shadow-lg rounded-lg hover:shadow-primary/20 transition-shadow duration-300 border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-headline text-foreground">{value}</div>
        {description && <p className="text-xs text-muted-foreground pt-1">{description}</p>}
        {trend && <p className={cn("text-xs pt-1", trendColor || 'text-muted-foreground')}>{trend}</p>}
      </CardContent>
    </Card>
  );
}
