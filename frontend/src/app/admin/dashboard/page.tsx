"use client";
import { StatCard } from "@/components/admin/StatCard";
import { Users, AlertTriangle, Activity, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import type { Alert, Transaction } from "@/types";
import { mockDashboardData } from "@/lib/mockData";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface DashboardData {
    analytics: {
        totalUsers: number;
        suspiciousActivitiesToday: number;
        averageTrustScore: number;
        activeAlerts: number;
    };
    anomalies: Alert[];
    recentOrders: Transaction[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        setData(mockDashboardData);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(`${API_URL}/admin/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('Backend not available.');
        }
        const dashboardData = await response.json();
        console.log("Raw dashboard data from API:", dashboardData); // New log
                 if (dashboardData && dashboardData.analytics) {
          // Map _id to id for anomalies and recentOrders if present
          const mappedDashboardData = {
            ...dashboardData,
            anomalies: dashboardData.anomalies ? dashboardData.anomalies.map((item: any) => ({ ...item, id: item._id || item.id })) : [],
            recentOrders: dashboardData.recentOrders ? dashboardData.recentOrders.map((item: any) => ({ ...item, id: item._id || item.id })) : [],
          };
          setData(mappedDashboardData);
        } else {
          setData(mockDashboardData);
        }
      } catch (err) {
        setData(mockDashboardData);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard Overview</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <Skeleton className="h-[300px] w-full" />
          <Skeleton className="h-[300px] w-full" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-destructive">Failed to load dashboard</h2>
        <p className="text-muted-foreground mt-2">No data could be retrieved from the server.</p>
      </div>
    );
  }

  const { analytics, anomalies, recentOrders } = data;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={analytics.totalUsers} icon={Users} description="All registered users" />
        <StatCard title="Suspicious Activities Today" value={analytics.suspiciousActivitiesToday} icon={Activity} description="Flagged by risk engine" />
        <StatCard title="Average Trust Score" value={analytics.averageTrustScore != null ? analytics.averageTrustScore.toFixed(1) : 'N/A'} icon={CheckCircle} description="Across all users" />
        <StatCard title="Active Alerts" value={analytics.activeAlerts} icon={AlertTriangle} description="Unresolved critical alerts" />
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-xl rounded-lg">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline">Recent Anomalies</CardTitle>
              <CardDescription>Suspicious activities that generated alerts.</CardDescription>
            </div>
            <Link href="/admin/alerts">
              <Button variant="outline" size="sm">View All Alerts</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {anomalies.length > 0 ? (
              <ul className="space-y-3">
              {anomalies.slice(0, 5).map(alert => (
                  <li key={alert.id} className="p-3 rounded-md border flex items-start space-x-3">
                      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0 text-destructive" />
                      <div>
                          <p className="font-medium text-sm">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {alert.reason} - {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : 'Invalid Date'}
                          </p>
                      </div>
                  </li>
              ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent anomalies.</p>
            )}
          </CardContent>
        </Card>

         <Card className="shadow-xl rounded-lg">
           <CardHeader className="flex flex-row items-center justify-between">
             <div>
               <CardTitle className="font-headline">Recent Orders</CardTitle>
               <CardDescription>Latest orders placed on the platform.</CardDescription>
             </div>
           </CardHeader>
           <CardContent>
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Order ID</TableHead>
                   <TableHead>User Email</TableHead>
                   <TableHead>Amount</TableHead>
                   <TableHead>Status</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {recentOrders.slice(0, 5).map(order => (
                   <TableRow key={order.id}>
                     <TableCell className="font-medium truncate max-w-[100px]">{order.id}</TableCell>
                     <TableCell className="text-muted-foreground">{order.userEmail || 'N/A'}</TableCell>
                     <TableCell>${order.totalAmount != null ? order.totalAmount.toFixed(2) : 'N/A'}</TableCell>
                     <TableCell>
                       <Badge variant={order.status === 'Blocked' ? 'destructive' : order.status === 'Pending Review' ? 'secondary' : 'default'}>{order.status}</Badge>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </CardContent>
         </Card>
       </div>
     </div>
   );
}