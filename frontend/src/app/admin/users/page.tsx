"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
console.log('Frontend API_URL:', API_URL); // ADDED LINE

interface User {
  _id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  status: "Safe" | "Monitor" | "Suspicious" | "Blocked"; // Ensure status type is defined
  trustScore: number; // Assuming trustScore is part of the User object
  createdAt: string;
}

export default function AdminUsersPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null); // To track which user is being updated

  const fetchUsers = async () => {
    if (!token) {
      setIsLoading(false);
      console.log('No token found, not fetching users.'); // Added log
      return;
    }
    setIsLoading(true);
    try {
      console.log('Token:', token); // Added log
      console.log('Attempting to fetch users from:', `${API_URL}/users/all`); // Added log
      const response = await fetch(`${API_URL}/users/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleUpdateUserStatus = async (userId: string, newStatus: User['status']) => {
    if (!token) {
      toast({
        title: "Error",
        description: "Authentication token not found.",
        variant: "destructive",
      });
      return;
    }
    setIsUpdating(userId);
    try {
      const response = await fetch(`${API_URL}/users/${userId}/status`, {
        method: "PATCH", // Use PATCH as defined in your route
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to update user status to ${newStatus}`);
      }

      const updatedUser = await response.json();
      setUsers((prevUsers) =>
        prevUsers.map((user) => (user._id === userId ? updatedUser : user))
      );
      toast({
        title: "Success",
        description: `User status updated to ${newStatus}.`,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to update user status.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="font-headline text-3xl font-bold tracking-tight">User Management</h1>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="font-headline text-3xl font-bold tracking-tight">User Management</h1>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Trust Score</TableHead><TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">No users found.</TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell className="font-medium">{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell>
                    <Badge variant={user.isAdmin ? "default" : "secondary"}>
                      {user.isAdmin ? "Admin" : "User"}
                    </Badge>
                  </TableCell><TableCell>
                    <Badge
                      variant={
                        user.status === "Blocked"
                          ? "destructive"
                          : user.status === "Suspicious"
                          ? "warning"
                          : "success"
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell><TableCell>{user.trustScore != null ? user.trustScore.toFixed(0) : 'N/A'}</TableCell><TableCell className="text-right">
                    {user.status === "Blocked" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateUserStatus(user._id, "Safe")}
                        disabled={isUpdating === user._id}
                      >
                        {isUpdating === user._id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          "Unblock"
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleUpdateUserStatus(user._id, "Blocked")}
                        disabled={isUpdating === user._id}
                      >
                        {isUpdating === user._id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          "Block"
                        )}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
