"use client";
import type { Alert } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, Archive, Trash2 } from 'lucide-react'; // Import Trash2 icon
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"; // Import AlertDialog components

interface AlertItemProps {
  alert: Alert;
  onMarkAsRead: (alertId: string) => void;
  onDeleteAlert: (alertId: string) => void; // NEW: Add onDeleteAlert prop
}

export function AlertItem({ alert, onMarkAsRead, onDeleteAlert }: AlertItemProps) { // Destructure onDeleteAlert
  const { toast } = useToast();

  const handleMarkRead = () => {
    onMarkAsRead(alert.id);
  };

  const handleDelete = () => {
    onDeleteAlert(alert.id);
  };

  // NEW: Robust date parsing and logging
  let formattedTimestamp = 'Invalid Date';
  try {
    if (alert.timestamp) {
      const date = new Date(alert.timestamp);
      if (!isNaN(date.getTime())) { // Check if date is valid
        formattedTimestamp = date.toLocaleString();
      } else {
        console.warn(`AlertItem: Invalid date object created for timestamp: ${alert.timestamp}`);
      }
    } else {
      console.warn(`AlertItem: Timestamp is null or undefined for alert ID: ${alert.id}`);
    }
  } catch (e) {
    console.error(`AlertItem: Error parsing timestamp ${alert.timestamp}:`, e);
  }

  const severityStyles = {
    High: {
      card: "border-destructive bg-destructive/10 text-destructive-foreground",
      icon: "text-destructive",
      badge: "destructive" as const
    },
    Medium: {
      card: "border-[hsl(var(--chart-3))] bg-[hsla(var(--chart-3),0.1)] dark:bg-[hsla(var(--chart-3),0.15)] text-[hsl(var(--chart-3))]",
      icon: "text-[hsl(var(--chart-3))]",
      badge: "secondary" as const
    },
    Low: {
      card: "border-[hsl(var(--chart-1))] bg-[hsla(var(--chart-1),0.1)] dark:bg-[hsla(var(--chart-1),0.15)] text-[hsl(var(--chart-1))]",
      icon: "text-[hsl(var(--chart-1))]",
      badge: "default" as const
    },
    Info: { // Added Info severity style
      card: "border-blue-400 bg-blue-400/10 text-blue-400",
      icon: "text-blue-400",
      badge: "outline" as const // Or 'default', 'secondary'
    },
  };

  const currentSeverityStyle = severityStyles[alert.severity || 'Low']; // Default to 'Low' if severity is undefined/null

  return (
    <Card className={cn(
        "shadow-lg rounded-lg transition-all duration-300",
        alert.isRead ? "opacity-70 hover:opacity-100 bg-card/80" : "bg-card hover:shadow-primary/20",
        currentSeverityStyle.card
      )}>
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className={cn("h-6 w-6", currentSeverityStyle.icon)} />
            <div>
              <CardTitle className="text-base font-semibold">{alert.message}</CardTitle>
              <CardDescription className="text-xs opacity-80">
                User: {alert.userEmail || alert.userId} - {formattedTimestamp} {/* Use the formatted timestamp */}
              </CardDescription>
            </div>
          </div>
          <Badge variant={currentSeverityStyle.badge} className="capitalize text-xs">{alert.severity}</Badge>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <p className="text-sm mb-4 opacity-90">{alert.reason}</p>
        <div className="flex justify-end space-x-2">
          {!alert.isRead && (
            <Button variant="outline" size="sm" onClick={handleMarkRead} className="border-current hover:bg-background/20">
              <Check className="mr-2 h-4 w-4" /> Mark as Read
            </Button>
          )}
          {/* NEW: Delete Button with Confirmation Dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete this alert.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}