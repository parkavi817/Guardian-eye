
'use client';

import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ShieldX } from 'lucide-react'; 
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && (!currentUser || !currentUser.isAdmin)) {
      router.replace('/'); 
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser || !currentUser.isAdmin) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/10 p-4 text-center">
            <Card className="w-full max-w-md shadow-2xl rounded-lg border">
                <CardHeader className="pt-8">
                    <ShieldX className="mx-auto h-16 w-16 text-destructive mb-4" />
                    <CardTitle className="font-headline text-2xl text-destructive">Access Denied</CardTitle>
                    <CardDescription>You do not have permission to view this page.</CardDescription>
                </CardHeader>
                <CardContent className="pb-8">
                    <p className="text-muted-foreground mb-6">
                        Please log in with an administrator account or return to the homepage.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/" passHref>
                            <Button className="w-full sm:w-auto">Return to Homepage</Button>
                        </Link>
                         <Link href="/login" passHref>
                            <Button variant="outline" className="w-full sm:w-auto">Admin Login</Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen>
      <AdminSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 shadow-sm md:px-6">
            <SidebarTrigger className="md:hidden" />
            <h1 className="font-headline text-xl font-semibold tracking-tight text-foreground">Admin Panel</h1>
        </header>
        <ScrollArea className="h-[calc(100vh-4rem)]"> 
            <div className="p-4 md:p-6 lg:p-8">
                {children}
            </div>
        </ScrollArea>
      </SidebarInset>
    </SidebarProvider>
  );
}
