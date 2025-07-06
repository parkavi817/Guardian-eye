"use client";
import type { User } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ShieldBan, ShieldCheck, ShieldAlert, MessageSquareWarning } from 'lucide-react';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { enhanceAdminReport, type EnhanceAdminReportInput, type EnhanceAdminReportOutput } from '@/ai/flows/enhance-admin-report';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator as ShadSeparator } from '../ui/separator'; // Renamed import to avoid conflict with local Separator

interface UserTableProps {
  users: User[];
  onUpdateUserStatus: (userId: string, status: User['status']) => void;
}

export function UserTable({ users, onUpdateUserStatus }: UserTableProps) {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);


  const handleAction = (userId: string, action: User['status']) => {
    onUpdateUserStatus(userId, action);
    toast({
      title: `User status updated`,
      description: `User ${userId} marked as ${action}.`,
    });
  };

  const fetchAiSummary = async (user: User) => {
    if (!user) return;
    setSelectedUser(user);
    setAiSummary(null); 
    setIsSummaryLoading(true);
    setIsSummaryDialogOpen(true); // Open the dialog
    try {
      const input: EnhanceAdminReportInput = {
        ipAddress: user.ipAddress || 'Unknown',
        typingSpeed: user.avgTypingSpeedLogin || 0,
        deviceReuse: user.deviceReuseCount || 0,
        ipLocation: user.ipLocation || 'Unknown',
        billingCountry: user.billingCountry || 'Unknown',
        userAgent: user.deviceFingerprint || 'Unknown',
        trustScore: user.trustScore,
      };
      const result: EnhanceAdminReportOutput = await enhanceAdminReport(input);
      setAiSummary(result.summary);
    } catch (error) {
      console.error("Error fetching AI summary:", error);
      setAiSummary("Failed to load AI summary.");
      toast({
        title: "Error",
        description: "Could not fetch AI-generated summary.",
        variant: "destructive",
      });
    } finally {
      setIsSummaryLoading(false);
    }
  };


  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">User Management</CardTitle>
        <CardDescription>View and manage user accounts and their risk profiles.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Trust Score</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Date Joined</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className={`text-center font-semibold ${user.trustScore < 50 ? "text-destructive" : user.trustScore < 80 ? "text-yellow-500" : "text-green-500"}`}>
                    {user.trustScore}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={
                      user.status === 'Suspicious' ? 'destructive' :
                      user.status === 'Monitor' ? 'secondary' :
                      user.status === 'Blocked' ? 'outline' : 
                      'default'
                    } className="capitalize">
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.ipAddress || 'N/A'}</TableCell>
                  <TableCell>
                    {console.log("Raw createdAt:", user.createdAt)}
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {console.log("Raw lastActivity:", user.lastActivity)}
                    {user.lastActivity ? new Date(user.lastActivity).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Dialog open={isSummaryDialogOpen && selectedUser?.id === user.id} onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            setIsSummaryDialogOpen(false);
                            setSelectedUser(null); // Clear selected user when dialog closes
                        }
                    }}>
                      <AlertDialog> {/* AlertDialog for Block User Confirmation */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            {/* Trigger for AI Summary Dialog (targets the outer Dialog) */}
                            <DialogTrigger asChild>
                               <DropdownMenuItem onSelect={() => fetchAiSummary(user)}>
                                  <ShieldAlert className="mr-2 h-4 w-4" />
                                  View Details & AI Summary
                                </DropdownMenuItem>
                            </DialogTrigger>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => {
                              console.log("Attempting to mark user as Safe. User ID:", user.id);
                              handleAction(user.id, 'Safe');
                            }}>
                              <ShieldCheck className="mr-2 h-4 w-4 text-green-500" /> Mark as Safe
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              console.log("Attempting to mark user as Monitor. User ID:", user.id);
                              handleAction(user.id, 'Monitor');
                            }}>
                               <ShieldAlert className="mr-2 h-4 w-4 text-yellow-500" /> Mark for Monitoring
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => {
                              console.log("Attempting to mark user as Suspicious. User ID:", user.id);
                              handleAction(user.id, 'Suspicious');
                            }}>
                               <MessageSquareWarning className="mr-2 h-4 w-4 text-orange-500" /> Mark as Suspicious
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {/* Trigger for Block User Confirmation (targets the inner AlertDialog) */}
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <ShieldBan className="mr-2 h-4 w-4" /> Block User
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Content for Block User Confirmation (now correctly within AlertDialog) */}
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to block {user.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action will prevent the user from accessing the platform. This can be undone later.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                console.log("Attempting to block user. User ID:", user.id);
                                handleAction(user.id, 'Blocked');
                              }}
                              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            >
                              Block User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog> {/* End of Block User Confirmation Root */}

                      {/* Content for AI Summary Dialog (correctly within Dialog) */}
                      <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="font-headline">User Details: {selectedUser?.name}</DialogTitle>
                          <DialogDescription>
                            Detailed information and AI-generated risk summary for {selectedUser?.email}.
                          </DialogDescription>
                        </DialogHeader>
                        {selectedUser && (
                           <ScrollArea className="max-h-[60vh] pr-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 text-sm">
                            <div><strong>ID:</strong> {selectedUser.id}</div>
                            <div><strong>Email:</strong> {selectedUser.email}</div>
                            <div><strong>IP Address:</strong> {selectedUser.ipAddress}</div>
                            <div><strong>IP Location:</strong> {selectedUser.ipLocation || 'N/A'}</div>
                            <div><strong>Device Fingerprint:</strong> <span className="truncate block max-w-xs">{selectedUser.deviceFingerprint}</span></div>
                            <div><strong>Avg. Login Typing Speed:</strong> {selectedUser.avgTypingSpeedLogin?.toFixed(2) || 'N/A'} kps</div>
                            <div><strong>Password Pasted (Login):</strong> {selectedUser.passwordPasted ? 'Yes' : 'No'}</div>
                            <div><strong>Trust Score:</strong> <span className={`font-bold ${selectedUser.trustScore < 50 ? "text-destructive" : selectedUser.trustScore < 80 ? "text-yellow-500" : "text-green-500"}`}>{selectedUser.trustScore}</span></div>
                            <div><strong>Status:</strong> <Badge variant={selectedUser.status === 'Suspicious' ? 'destructive' : selectedUser.status === 'Monitor' ? 'secondary' : 'default'} className="capitalize">{selectedUser.status}</Badge></div>
                            <div><strong>Device Reuse Count:</strong> {selectedUser.deviceReuseCount ?? 'N/A'}</div>
                            <div><strong>Billing Country:</strong> {selectedUser.billingCountry || 'N/A'}</div>
                            <div><strong>Last Activity:</strong> {new Date(selectedUser.lastActivity).toLocaleString()}</div>
                          </div>
                          <ShadSeparator className="my-4" />
                          <h3 className="font-semibold mb-2 text-base">AI Risk Summary:</h3>
                          {isSummaryLoading ? (
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-3/4" />
                            </div>
                          ) : aiSummary ? (
                            <Textarea value={aiSummary} readOnly rows={6} className="bg-muted/50 text-sm" />
                          ) : (
                            <p className="text-muted-foreground">No summary available or an error occurred.</p>
                          )}
                          </ScrollArea>
                        )}
                      </DialogContent>
                    </Dialog> {/* End of AI Summary Dialog Root */}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
