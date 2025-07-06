
"use client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Bar } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import { Users, Percent, CheckCircle, AlertTriangle } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { mockFullAnalyticsData } from "@/lib/mockData";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AnalyticsData {
    totalUsers: number;
    totalAnomalies: number;
    avgTrustScore: number;
    dailyLoginTrends: { date: string; logins: number }[];
    totalTransactions: number;
    blockedTransactions: number;
    fraudDetectionRate: string;
}

const dailyLoginsConfig = {
  logins: { label: "Logins", color: "hsl(var(--chart-1))" },
} satisfies ChartConfig;

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        setAnalyticsData(mockFullAnalyticsData);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/admin/dashboard/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Backend not available.");
        const data = await res.json();
        console.log("Raw analytics data from API:", data); // New log
        
        if (data && typeof data.totalUsers !== 'undefined') {
          setAnalyticsData(data);
        } else {
          setAnalyticsData(mockFullAnalyticsData);
        }
      } catch (err) {
        setAnalyticsData(mockFullAnalyticsData);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <h1 className="font-headline text-3xl font-bold tracking-tight">System Analytics</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!analyticsData) {
     return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-destructive">Failed to load analytics</h2>
        <p className="text-muted-foreground mt-2">No data was returned from the server.</p>
      </div>
    );
  }

  const { totalUsers, totalAnomalies, avgTrustScore, dailyLoginTrends, fraudDetectionRate } = analyticsData;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
         <h1 className="font-headline text-3xl font-bold tracking-tight">System Analytics</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={totalUsers} icon={Users} description="All registered users" />
        <StatCard title="Total Anomalies" value={totalAnomalies} icon={AlertTriangle} description="Flagged by risk engine" />
        <StatCard title="Average Trust Score" value={avgTrustScore.toFixed(1)} icon={CheckCircle} description="Across all users" />
        <StatCard title="Fraud Detection Rate" value={fraudDetectionRate} icon={Percent} description="Ratio of flagged to total transactions" />
      </div>

       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Daily Login Trends</CardTitle>
          <CardDescription>User logins over the last period.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ChartContainer config={dailyLoginsConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyLoginTrends} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={{stroke: "hsl(var(--border))"}}/>
                      <YAxis stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={{stroke: "hsl(var(--border))"}}/>
                      <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="logins" fill="var(--color-logins)" radius={[4, 4, 0, 0]} />
                  </BarChart>
              </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      
    </div>
  );
}
