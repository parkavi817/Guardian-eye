'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ProductCard } from '@/components/ecommerce/ProductCard';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useCartInteractionMetrics } from '@/hooks/useBehaviorTracker';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface WishlistItem {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  description: string;
}

export default function WishlistPage() {
  const { currentUser, isLoading: authLoading, verifyUser } = useAuth();
  const { toast } = useToast();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { trackInteraction, getMetrics } = useCartInteractionMetrics(currentUser?.id, currentUser?.email);

  const sendAnomaly = useCallback(async () => {
    if (!currentUser || !currentUser.id) { // Added check for currentUser.id
      console.warn("Anomaly not sent from sendAnomaly: currentUser or currentUser.id is null/undefined.");
      return;
    }
    // These logs should now always be hit if sendAnomaly is called and currentUser is valid
    console.log("Sending anomaly from sendAnomaly. currentUser:", currentUser);
    console.log("Sending anomaly from sendAnomaly. userId:", currentUser.id, "userEmail:", currentUser.email);

    const metrics = getMetrics(); // Get metrics here to use in the features array
    try {
      const payload = {
        userId: currentUser.id,
        userEmail: currentUser.email,
        source: 'wishlist-page-load',
        context: 'Unusual activity on wishlist page load',
        features: [ // Now sending an array
          metrics.speed,
          metrics.pasted ? 1 : 0,
          metrics.duration,
          metrics.countryMismatch ? 1 : 0,
          metrics.count,
          metrics.abnormal ? 1 : 0,
        ],
      };
      console.log("Anomaly payload (sendAnomaly):", payload); // Log the payload
      await axios.post(`${API_URL}/anomaly/behavior`, payload);
    } catch (err) {
      console.error('Error sending anomaly:', err);
    }
  }, [currentUser, getMetrics]);

  const fetchWishlist = useCallback(async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      trackInteraction(); // Track wishlist page fetch
      const metrics = getMetrics();

      if (metrics.abnormal) {
        console.warn("⚠️ Abnormal wishlist behavior detected:", metrics.count);
        await sendAnomaly(); // Log to backend
        if (currentUser?.isAdmin) { // Only show to admin users
          toast({
            title: 'Suspicious Behavior',
            description: 'Unusual wishlist activity detected.',
            variant: 'destructive'
          });
        }
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast({ title: 'Error', description: 'Not authenticated.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch wishlist');
      }

      const data = await res.json();
      setWishlistItems(data.items);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast({ title: 'Error', description: 'Could not fetch wishlist.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [currentUser, toast, trackInteraction, getMetrics, sendAnomaly]);

  useEffect(() => {
    if (!authLoading) {
      fetchWishlist();
    }
  }, [authLoading, fetchWishlist]);

  const handleProductRemoved = useCallback(async (productId: string) => {
    if (!currentUser) return;

    // Optimistically update UI
    setWishlistItems(prev => prev.filter(item => item.id !== productId));

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      const res = await fetch(`${API_URL}/wishlist/remove/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Remove from Wishlist API Response Status:', res.status);
      const result = await res.json();
      console.log('Remove from Wishlist API Response Body:', result);

      if (!res.ok) {
        throw new Error(result.message || 'Failed to remove product from wishlist');
      }

      toast({
        title: 'Removed from Wishlist',
        description: 'Product successfully removed.',
      });

      // Refresh user state in AuthContext to update wishlist across components
      await verifyUser();

      const metrics = getMetrics(); // Get metrics after interaction
      if (metrics.abnormal) {
        if (!currentUser || !currentUser.id) { // Added check for currentUser.id
          console.warn("Anomaly not sent from handleProductRemoved: currentUser or currentUser.id is null/undefined.");
          return;
        }
        console.log("Sending anomaly from handleProductRemoved. currentUser:", currentUser);
        console.log("Sending anomaly from handleProductRemoved. userId:", currentUser.id, "userEmail:", currentUser.email);
        const payload = {
          userId: currentUser.id,
          userEmail: currentUser.email,
          source: 'wishlist',
          context: 'rapid-remove',
          features: [ // Now sending an array
            metrics.speed,
            metrics.pasted ? 1 : 0,
            metrics.duration,
            metrics.countryMismatch ? 1 : 0,
            metrics.count,
            metrics.abnormal ? 1 : 0,
          ],
        };
        console.log("Anomaly payload (handleProductRemoved):", payload); // Log the payload
        await axios.post(`${API_URL}/anomaly/behavior`, payload);
      }
    } catch (error) {
      console.error("Error removing product from wishlist:", error);
      toast({ title: 'Error', description: (error as Error).message || 'Could not remove product from wishlist.', variant: 'destructive' });
      // If API call fails, re-fetch the wishlist to revert the frontend update
      fetchWishlist();
    }
  }, [currentUser, toast, verifyUser, fetchWishlist, getMetrics]);

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Wishlist</h1>
        <p className="text-lg">Please log in to view your wishlist.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Your Wishlist</h1>
      {wishlistItems.length === 0 ? (
        <p className="text-center text-lg text-muted-foreground">Your wishlist is empty. Start adding some products!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {wishlistItems.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              isWishlistContext={true} // Indicate that this card is in the wishlist context
              onRemoveFromWishlist={handleProductRemoved} // Pass the remove handler
            />
          ))}
        </div>
      )}
    </div>
  );
}