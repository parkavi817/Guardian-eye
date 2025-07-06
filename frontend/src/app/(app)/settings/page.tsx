'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState, useTransition, useRef } from 'react'; // Added useRef
import { Package, ShieldAlert, UserCircle, Edit3, Loader2, Save } from 'lucide-react';
import { BackButton } from '@/components/layout/BackButton';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useTypingBehavior } from '@/hooks/useTypingBehavior'; // NEW
import { trackUserBehavior } from '@/services/trackingService'; // NEW

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function SettingsPage() {
  const { currentUser, isLoading: authLoading, verifyUser } = useAuth();
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isPending, startTransition] = useTransition();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // NEW: Ref for new password input and useTypingBehavior hook
  const newPasswordInputRef = useRef<HTMLInputElement>(null);
  const { typingSpeed, keystrokeVariation, pasteDetected, reset } = useTypingBehavior(newPasswordInputRef);

  useEffect(() => {
    if (currentUser) {
      setEditedName(currentUser.name || '');
    }
  }, [currentUser]);

  const handleUpdateProfile = () => {
    const token = localStorage.getItem('token');
    if (!token || !currentUser) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return;
    }

    if (!editedName.trim()) {
      toast({ title: "Name cannot be empty", variant: "destructive" });
      return;
    }

    if (editedName === currentUser.name) {
      toast({ title: "No changes detected", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`${API_URL}/users/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ name: editedName }),
        });

        if (!res.ok) {
          const errorResult = await res.text();
          console.error("Profile update failed response:", errorResult);
          throw new Error('Update failed. The server responded with an error.');
        }

        await res.json();
        toast({ title: 'Profile updated successfully!' });
        await verifyUser();
        setIsEditing(false);

        // NEW: Track profile update behavior
        await trackUserBehavior({
          action: 'update_profile',
          context: 'profile_settings',
          screenWidth: window.screen.width,
          language: navigator.language,
          // Typing behavior metrics are not relevant for name update
        });

      } catch (error) {
        console.error("Profile update error", error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : "Could not update profile.",
          variant: 'destructive',
        });
      }
    });
  };

  const handleChangePassword = () => {
    const token = localStorage.getItem('token');
    if (!token || !currentUser) {
      toast({ title: "Not authenticated", variant: "destructive" });
      return;
    }

    if (!oldPassword || !newPassword || !confirmNewPassword) {
      toast({ title: "All password fields are required", variant: "destructive" });
      return;
    }

    if (newPassword !== confirmNewPassword) {
      toast({ title: "New passwords do not match", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "New password must be at least 6 characters long", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch(`${API_URL}/users/change-password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ oldPassword, newPassword }),
        });

        if (!res.ok) {
          const errorResult = await res.json(); // Assuming backend sends JSON error
          throw new Error(errorResult.message || 'Failed to change password.');
        }

        toast({ title: 'Password updated successfully!' });
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');

        // NEW: Track password change behavior
        await trackUserBehavior({
          action: 'update_password',
          context: 'password_settings',
          typingSpeed: typingSpeed,
          pasteDetected: pasteDetected,
          keystrokeVariation: keystrokeVariation,
          screenWidth: window.screen.width,
          language: navigator.language,
        });
        reset(); // Reset typing behavior state after submission

      } catch (error) {
        console.error("Password change error", error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : "Could not change password.",
          variant: 'destructive',
        });
      }
    });
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-12 text-center flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading user settings...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-12 text-center flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <UserCircle className="h-20 w-20 text-destructive mb-6" />
        <h2 className="font-headline text-2xl font-semibold mb-3">User Data Not Available</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          It seems you are not logged in or your session could not be retrieved. Please log in to view your settings.
        </p>
        <Link href="/login">
          <Button size="lg" className="font-semibold">Login</Button>
        </Link>
      </div>
    );
  }

  const { name, email, createdAt, ipAddress, status, trustScore, orders = [], alerts = [], isAdmin } = currentUser;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 space-y-10">
      <div className="flex items-center">
        <BackButton />
        <h1 className="font-headline text-4xl font-bold text-center md:text-left flex-grow">Account Settings</h1>
      </div>

      <Card className="shadow-xl rounded-lg border">
        <CardHeader className="flex flex-col md:flex-row items-center gap-4 pb-6">
          <Avatar className="h-20 w-20 border-2 border-primary">
            <AvatarFallback className="text-2xl font-semibold bg-muted">{getInitials(name)}</AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left flex-grow">
            {isEditing ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="font-headline text-2xl h-auto p-1"
                aria-label="Edit Full Name"
              />
            ) : (
              <CardTitle className="font-headline text-2xl">{name}</CardTitle>
            )}
            <CardDescription className="text-base">{email}</CardDescription>
            <div className="text-sm text-muted-foreground mt-1">
              Member since: {new Date(createdAt || Date.now()).toLocaleDateString()}
            </div>
          </div>
          {isEditing ? (
            <div className="flex gap-2 mt-4 md:mt-0 self-center md:self-start">
              <Button
                onClick={handleUpdateProfile}
                disabled={isPending || editedName === name || !editedName.trim()}
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
              </Button>
              <Button variant="outline" onClick={() => { setIsEditing(false); setEditedName(name || ''); }}>Cancel</Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)} className="ml-auto mt-4 md:mt-0 self-center md:self-start">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm pt-4 border-t">
          <div><strong>Last Login IP:</strong> {ipAddress}</div>
          <div><strong>Status:</strong> <Badge variant={status === 'Suspicious' ? 'destructive' : status === 'Monitor' ? 'secondary' : 'default'}>{status}</Badge></div>
          <div><strong>Trust Score:</strong> <span className={`font-bold ${trustScore < 50 ? "text-destructive" : trustScore < 80 ? "text-yellow-500" : "text-green-500"}`}>{trustScore}</span></div>
          {isAdmin && <div><strong>Role:</strong> <Badge variant="default">Administrator</Badge></div>}
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card className="shadow-xl rounded-lg border">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <Edit3 className="mr-3 h-5 w-5 text-primary" />Change Password
          </CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="password"
            placeholder="Old Password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            className="w-full"
          />
          <Input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            ref={newPasswordInputRef} // NEW: Attach ref here
            className="w-full"
          />
          <Input
            type="password"
            placeholder="Confirm New Password"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className="w-full"
          />
          <Button
            onClick={handleChangePassword}
            disabled={isPending || !oldPassword || !newPassword || !confirmNewPassword || newPassword !== confirmNewPassword || newPassword.length < 6}
            className="w-full"
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Change Password
          </Button>
        </CardContent>
      </Card>

      {/* Order History */}
      <Card className="shadow-xl rounded-lg border">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <Package className="mr-3 h-5 w-5 text-primary" />Order History
          </CardTitle>
          <CardDescription>Your recent purchases.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium truncate max-w-[100px] sm:max-w-xs">{tx.id}</TableCell>
                    <TableCell>{new Date(tx.timestamp).toLocaleDateString()}</TableCell>
                    <TableCell>${(tx.totalAmount || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={tx.status === 'Blocked' ? 'destructive' : tx.status === 'Pending Review' ? 'secondary' : 'default'}>
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm">View Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground text-center py-6">You have no recent orders.</div>
          )}
        </CardContent>
      </Card>

      {/* Alerts */}
      <Card className="shadow-xl rounded-lg border">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <ShieldAlert className="mr-3 h-5 w-5 text-primary" />Recent Activity & Alerts
          </CardTitle>
          <CardDescription>Notifications and alerts related to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Severity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map(alert => (
                  <TableRow key={alert.id}>
                    <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                    <TableCell>
                      {alert.message}
                      {alert.mlFeatures && (
                        <div className="text-xs text-muted-foreground mt-1">
                          ML Features: {JSON.stringify(alert.mlFeatures)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={alert.severity === 'High' ? 'destructive' : alert.severity === 'Medium' ? 'secondary' : 'default'}
                        className={alert.severity === 'Medium' ? 'bg-yellow-500 text-white hover:bg-yellow-600' : ''}
                      >
                        {alert.severity}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground text-center py-6">No recent alerts or activity for your account.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}