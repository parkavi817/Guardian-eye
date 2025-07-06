
"use client";
import { ActivityCard } from '@/components/admin/ActivityCard';
import type { LiveActivity } from '@/types';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { mockLiveActivities } from '@/lib/mockData';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const MAX_ACTIVITIES = 50;

export default function LiveMonitoringPage() {
  const { currentUser } = useAuth();
  const [activities, setActivities] = useState<LiveActivity[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchLiveActivities = async () => {
      const token = localStorage.getItem('token');
      if (!currentUser || !token) return;
      
      try {
        const response = await fetch(`${API_URL}/admin/live-activity`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
          throw new Error('Backend not available. Polling stopped.');
        }
        const data: LiveActivity[] = await response.json();
        setHasError(false);

        if (isLoading && data.length === 0) {
            setActivities(mockLiveActivities);
            return; 
        }
        
        setActivities(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newActivities = data.filter(d => !existingIds.has(d.id));
          const baseActivities = prev === mockLiveActivities ? [] : prev;
          return [...newActivities, ...baseActivities].slice(0, MAX_ACTIVITIES);
        });

      } catch (err) {
        console.error(err);
        setHasError(true);
        if (activities.length === 0) {
            setActivities(mockLiveActivities); 
        }
        if (intervalIdRef.current) clearInterval(intervalIdRef.current);
      } finally {
        if(isLoading) setIsLoading(false);
      }
    };

    fetchLiveActivities();

    if (!isPaused && !hasError) {
      intervalIdRef.current = setInterval(fetchLiveActivities, 3000);
    }

    return () => {
      if (intervalIdRef.current) clearInterval(intervalIdRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, isPaused]);


  const togglePause = () => setIsPaused(prev => !prev);
  
  const renderContent = () => {
    if (isLoading) {
      return (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
          {[...Array(9)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      )
    }

    if (activities.length === 0 && !hasError) {
      return (
        <div className="text-center py-10 text-muted-foreground flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p>No activities to display. {isPaused ? "Feed is paused." : "Waiting for new activities..."}</p>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
        {activities.map(activity => (
          <ActivityCard key={activity.id} activity={activity} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="font-headline text-3xl font-bold tracking-tight">Live User Activity</h1>
        <Button variant="outline" onClick={togglePause} disabled={hasError}>
            {isPaused ? <Play className="mr-2 h-4 w-4" /> : <Pause className="mr-2 h-4 w-4" />}
            {isPaused ? 'Resume' : 'Pause'}
        </Button>
      </div>
      
      <ScrollArea className="flex-grow pr-1">
        {renderContent()}
      </ScrollArea>
    </div>
  );
}
