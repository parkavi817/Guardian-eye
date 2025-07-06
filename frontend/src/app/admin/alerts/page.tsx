"use client";
import { AlertItem } from '@/components/admin/AlertItem';
import type { Alert } from '@/types';
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CheckCheck, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { mockAlerts } from '@/lib/mockData'; // Keep this import for now, but it's not used in fetchAlerts
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
} from "@/components/ui/alert-dialog"; // Assuming you have this component


const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function AlertsPage() {
  const { currentUser } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSeverity, setFilterSeverity] = useState<Alert['severity'] | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleDeleteAlert = async (alertId: string) => {
    const alertToDelete = alerts.find(a => a.id === alertId);
    if (!alertToDelete) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    let endpoint = '';
    let idToSend = alertToDelete.id;

    // Determine the correct endpoint based on alert type
    // If it's an anomaly, the ID might have a prefix, remove it for the backend call
    if (alertToDelete.type === 'anomaly') {
      idToSend = alertToDelete.id.replace('anomaly-', '');
      endpoint = `${API_URL}/anomaly/${idToSend}`; // Assuming /anomaly/:id DELETE endpoint
    } else {
      endpoint = `${API_URL}/alerts/${idToSend}`; // Your new /alerts/:id DELETE endpoint
    }

    try {
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete alert.');
      }

      // Remove the deleted alert from the state
      setAlerts(prev => prev.filter(a => a.id !== alertId));
      toast({ title: "Alert Deleted", description: "The alert has been successfully removed." });
    } catch (err) {
      console.error("Error deleting alert:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Could not delete alert.',
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const fetchAlerts = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token || !currentUser) {
        setIsLoading(false);
        return;
      }

      try {
        const [alertRes, anomalyRes] = await Promise.all([
          fetch(`${API_URL}/alerts`, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(`${API_URL}/anomaly`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        if (!alertRes.ok) throw new Error('Failed to fetch alerts');
        if (!anomalyRes.ok) throw new Error('Failed to fetch anomalies');

        const alertData: Alert[] = await alertRes.json();
        const anomalyData = await anomalyRes.json();

        console.log("Raw Anomaly Data:", anomalyData); // NEW: Log raw anomaly data
        anomalyData.forEach((a: any) => { // NEW: Log each anomaly's timestamp
          console.log(`Anomaly ID: ${a._id}, Timestamp: ${a.timestamp}, Typeof Timestamp: ${typeof a.timestamp}`);
        });

        // Filter out alerts with undefined/null IDs at the source
        const validAlerts = alertData.filter((a: any) => a._id != null).map((a: any) => ({
          ...a,
          id: a._id, // Use original _id for alerts
          type: 'alert', // Explicitly set type for alerts
          timestamp: a.createdAt, // Use createdAt for Alert model
        }));

        const transformedAnomalies: Alert[] = anomalyData.filter((a: any) => a._id != null).map((a: any) => ({
          id: `anomaly-${a._id}`, // Ensure unique key for anomalies
          userId: a.userId,
          userEmail: a.userEmail,
          reason: a.context,
          severity: 'Medium', // or determine dynamically
          message: `Anomaly from ${a.source}: ${a.context}`,
          isRead: a.isRead, // Ensure isRead is passed from backend
          timestamp: a.timestamp,
          type: 'anomaly', // Explicitly set type for anomalies
        }));

        const combined = [...validAlerts, ...transformedAnomalies];
        setAlerts(combined);
      } catch (err) {
        console.error("Error loading alerts:", err);
        toast({
          title: "Error loading alerts",
          description: "Could not fetch alerts from the server.",
          variant: "destructive"
        });
        setAlerts([]); // Set to empty array on error
      } finally {
        setIsLoading(false);
      }
    };
    fetchAlerts();
  }, [currentUser, toast]); // Added toast to dependency array

  const handleMarkAsRead = async (alertId: string) => {
    const alertToUpdate = alerts.find(a => a.id === alertId);
    if (!alertToUpdate) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    let endpoint = '';
    let idToSend = alertToUpdate.id;

    if (alertToUpdate.type === 'anomaly') {
      idToSend = alertToUpdate.id.replace('anomaly-', ''); // Remove prefix for anomaly ID
      endpoint = `${API_URL}/anomaly/${idToSend}/read`;
    } else {
      endpoint = `${API_URL}/alerts/${idToSend}/read`;
    }

    try {
      const response = await fetch(endpoint, {
         method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to mark as read.');
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a));
      toast({ title: "Marked as Read" });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : 'Could not update status.', variant: "destructive" });
    }
  };

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const unreadAlertsToUpdate = alerts.filter(a => !a.isRead);
    if (unreadAlertsToUpdate.length === 0) return;

    toast({ title: "Updating alerts...", description: "Marking all as read." });

    const results = await Promise.all(
      unreadAlertsToUpdate.map(alert => {
        let backendAlertId = alert.id;
        let endpoint = '';
        let idToSend = alert.id;

        if (alert.type === 'anomaly') {
          idToSend = alert.id.replace('anomaly-', '');
          endpoint = `${API_URL}/anomaly/${idToSend}/read`;
        } else {
          endpoint = `${API_URL}/alerts/${idToSend}/read`;
        }

        return fetch(endpoint, {
             method: 'PATCH',
            headers: { 'Authorization': `Bearer ${token}` }
         }).then(res => res.ok);
      })
    );

    const successfulUpdates = results.filter(Boolean).length;
    if (successfulUpdates > 0) {
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    }

    if (successfulUpdates < unreadAlertsToUpdate.length) {
      toast({ title: "Error", description: "Some alerts could not be marked as read.", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "All unread alerts have been marked as read." });
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesSearch = searchTerm === '' ||
                           alert.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (alert.userEmail && alert.userEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          alert.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          alert.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const unreadAlerts = filteredAlerts.filter(a => !a.isRead);
  const readAlerts = filteredAlerts.filter(a => a.isRead);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="container mx-auto px-4 py-12 text-center flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">Loading alerts...</p>
        </div>
      );
    }

    return (
      <Tabs defaultValue="unread" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:inline-flex mb-4">
          <TabsTrigger value="unread">Unread ({unreadAlerts.length})</TabsTrigger>
          <TabsTrigger value="read">Read ({readAlerts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="unread">
          {unreadAlerts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {unreadAlerts.map(alert => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onMarkAsRead={handleMarkAsRead}
                  onDeleteAlert={handleDeleteAlert} // NEW: Pass delete handler
                />
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-muted-foreground">No unread alerts matching filters.</p>
          )}
        </TabsContent>
        <TabsContent value="read">
          {readAlerts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {readAlerts.map(alert => (
                <AlertItem
                  key={alert.id}
                  alert={alert}
                  onMarkAsRead={handleMarkAsRead}
                  onDeleteAlert={handleDeleteAlert} // NEW: Pass delete handler
                />
              ))}
            </div>
          ) : (
            <p className="text-center py-10 text-muted-foreground">No read alerts matching filters.</p>
          )}
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Security Alerts</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleMarkAllRead} disabled={isLoading || unreadAlerts.length === 0}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCheck className="mr-2 h-4 w-4" />}
            Mark All as Read
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-lg bg-card shadow">
        <div>
          <label htmlFor="search-alerts" className="text-sm font-medium text-muted-foreground">Search Alerts</label>
          <Input
             id="search-alerts"
            type="text"
             placeholder="Search message, user, reason..."
             value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="severity-filter" className="text-sm font-medium text-muted-foreground">Filter by Severity</label>
          <Select value={filterSeverity} onValueChange={(value) => setFilterSeverity(value as Alert['severity'] | 'all')}>
            <SelectTrigger id="severity-filter" className="w-full mt-1">
              <SelectValue placeholder="Filter by severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}