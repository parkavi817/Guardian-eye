'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardFooter,
  CardHeader, CardTitle
} from '@/components/ui/card';
import type { Product } from '@/types';
import {
  ShoppingCart, Heart, UserCircle, Loader2, XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext'; // Corrected path based on common Next.js structure
import { useCartInteractionMetrics } from '@/hooks/useBehaviorTracker'; // Assuming this is your existing hook
import axios from 'axios';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { trackUserBehavior } from '@/services/trackingService'; // NEW

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ProductCardProps {
  product: Product;
  onWishlistToggle?: (productId: string) => void;
  onRemoveFromWishlist?: (productId: string) => void;
  isWishlistContext?: boolean;
}

export function ProductCard({
  product,
  onWishlistToggle,
  onRemoveFromWishlist,
  isWishlistContext
}: ProductCardProps) {
  const { toast } = useToast();
  const { currentUser, isLoading: isAuthLoading, verifyUser } = useAuth();
  const { trackInteraction, getMetrics } = useCartInteractionMetrics(); // This hook seems to be for the 'anomaly/behavior' endpoint
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [showAddedToCartIndicator, setShowAddedToCartIndicator] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const productId = product._id || product.id;

  useEffect(() => {
    if (currentUser?.wishlist) {
      const isProductInWishlist = currentUser.wishlist.some(item => {
        const itemId = typeof item === 'object' && item !== null ? item._id : item;
        return itemId === productId;
      });
      setIsInWishlist(isProductInWishlist);
    } else {
      setIsInWishlist(false);
    }
  }, [currentUser, productId]);

  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!currentUser || !token) {
      setShowAuthDialog(true);
      return;
    }

    trackInteraction(); // This is for your existing anomaly detection
    const metrics = getMetrics(); // This is for your existing anomaly detection

    try {
      const res = await fetch(`${API_URL}/cart/item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to add to cart");

      toast({
        title: `${product.name} added to cart!`,
        description: `Price: $${product.price.toFixed(2)}`
      });

      setShowAddedToCartIndicator(true);
      setTimeout(() => setShowAddedToCartIndicator(false), 1200);

      // Always track user behavior for ML features
      await trackUserBehavior({
        action: 'add_to_cart',
        context: `product_${productId}`,
        screenWidth: window.screen.width,
        language: navigator.language,
        // For cart/wishlist, typingSpeed, keystrokeVariation, pasteDetected are not relevant
        // ip_score and device_score are handled by backend placeholders
      });

      // If you still need to send to your existing anomaly/behavior endpoint
      if (metrics.abnormal) {
        if (!currentUser?.id || !currentUser?.email) return;
        await axios.post(`${API_URL}/anomaly/behavior`, {
          userId: currentUser.id,
          userEmail: currentUser.email,
          source: 'cart',
          context: 'rapid-add',
          features: [
            metrics.speed,
            metrics.pasted ? 1 : 0,
            metrics.duration,
            metrics.countryMismatch ? 1 : 0,
            metrics.count,
            metrics.abnormal ? 1 : 0,
          ],
        });
      }

    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Could not add item to cart.',
        variant: 'destructive'
      });
    }
  };

  const toggleWishlist = async () => {
    const token = localStorage.getItem('token');
    if (!currentUser || !token) {
      setShowAuthDialog(true);
      return;
    }

    trackInteraction(); // This is for your existing anomaly detection
    const metrics = getMetrics(); // This is for your existing anomaly detection

    const isAdding = !isInWishlist;
    const method = isAdding ? 'POST' : 'DELETE';
    const endpoint = isAdding
      ? `${API_URL}/wishlist/add`
      : `${API_URL}/wishlist/remove/${productId}`;

    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        ...(isAdding && { body: JSON.stringify({ productId }) })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update wishlist");

      setIsInWishlist(isAdding);
      if (onWishlistToggle && !isAdding) onWishlistToggle(productId);

      toast({
        title: isAdding
          ? `${product.name} added to wishlist!`
          : `${product.name} removed from wishlist.`
      });

      await verifyUser();

      // Always track user behavior for ML features
      await trackUserBehavior({
        action: isAdding ? 'add_to_wishlist' : 'remove_from_wishlist',
        context: `product_${productId}`,
        screenWidth: window.screen.width,
        language: navigator.language,
        // For cart/wishlist, typingSpeed, keystrokeVariation, pasteDetected are not relevant
        // ip_score and device_score are handled by backend placeholders
      });

      // If you still need to send to your existing anomaly/behavior endpoint
      if (metrics.abnormal) {
        if (!currentUser?.id || !currentUser?.email) return;
        await axios.post(`${API_URL}/anomaly/behavior`, {
          userId: currentUser.id,
          userEmail: currentUser.email,
          source: 'wishlist',
          context: isAdding ? 'rapid-add' : 'rapid-remove',
          features: [
            metrics.speed,
            metrics.pasted ? 1 : 0,
            metrics.duration,
            metrics.countryMismatch ? 1 : 0,
            metrics.count,
            metrics.abnormal ? 1 : 0,
          ],
        });
      }

    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message || 'Could not update wishlist.',
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      <Card className="rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:shadow-2xl hover:scale-[1.02] flex flex-col h-full group relative">
        <CardHeader className="p-0 relative overflow-hidden">
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={600}
            height={400}
            className="object-cover w-full h-60 transition-transform duration-500 group-hover:scale-105"
          />
          {isWishlistContext ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onRemoveFromWishlist && onRemoveFromWishlist(productId)}
              disabled={isAuthLoading}
              className="absolute top-2 right-2 bg-card/70 hover:bg-card rounded-full text-red-500 hover:text-red-600 z-10 disabled:opacity-50"
              aria-label="Remove from wishlist"
            >
              {isAuthLoading
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <XCircle className="h-5 w-5 transition-all" />}
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleWishlist}
              disabled={isAuthLoading}
              className="absolute top-2 right-2 bg-card/70 hover:bg-card rounded-full text-rose-500 hover:text-rose-600 z-10 disabled:opacity-50"
              aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              {isAuthLoading
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : <Heart className={cn("h-5 w-5 transition-all", isInWishlist ? "fill-rose-500 text-rose-500" : "text-muted-foreground group-hover:text-rose-500")} />}
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-6 flex-grow">
          <CardTitle className="font-headline text-lg mb-1 group-hover:text-primary transition-colors">{product.name}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mb-3 h-10 overflow-hidden text-ellipsis">
            {product.description}
          </CardDescription>
          <p className="text-xl font-semibold text-primary">${product.price.toFixed(2)}</p>
        </CardContent>
        <CardFooter className="p-4 bg-muted/20 border-t relative">
          <Button onClick={handleAddToCart} className="w-full font-semibold" disabled={isAuthLoading}>
            {isAuthLoading
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : <ShoppingCart className="mr-2 h-4 w-4" />}
            Add to Cart
          </Button>
          {showAddedToCartIndicator && (
            <Badge
              variant="default"
              className="absolute -top-3 right-1/2 translate-x-1/2 px-2 py-1 text-xs animate-bounce z-20"
            >
              +1
            </Badge>
          )}
        </CardFooter>
      </Card>

      <AlertDialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <UserCircle className="h-12 w-12 mx-auto text-primary mb-2" />
            <AlertDialogTitle className="text-center">Authentication Required</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Please log in or sign up to add items to your cart and wishlist.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center pt-2 gap-2">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link href="/signup">Sign Up</Link>
            </AlertDialogAction>
            <AlertDialogAction asChild>
              <Link href="/login">Login</Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}