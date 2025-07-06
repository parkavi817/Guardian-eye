"use client";
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { CartItem } from '@/types';
import { Trash2, Plus, Minus, ShoppingBag, Loader2, UserCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { BackButton } from '@/components/layout/BackButton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useCartInteractionMetrics } from '@/hooks/useBehaviorTracker';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function CartPage() {
  const { currentUser, isLoading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping] = useState(5.0);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const { trackInteraction, getMetrics, onKeyDown, onPaste } = useCartInteractionMetrics(); // Destructure new handlers

  const fetchCart = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!currentUser || !token) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`${API_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch cart');
      const data = await res.json();
      setCartItems(data.items || []);
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast({ title: 'Error', description: 'Could not load your cart.', variant: 'destructive' });
      setCartItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, toast]);

  useEffect(() => {
    if (!authLoading) {
      fetchCart();
    }
  }, [authLoading, fetchCart]);

  useEffect(() => {
    const newSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    setSubtotal(newSubtotal);
    setTotal(newSubtotal + shipping);
  }, [cartItems, shipping]);

  const sendCartAnomaly = async () => {
    if (!currentUser?.id || !currentUser?.email) {
      console.warn("Anomaly not sent from sendCartAnomaly: currentUser or currentUser.id/email is null/undefined.");
      return;
    }
    console.log("Sending anomaly from sendCartAnomaly. currentUser:", currentUser);
    console.log("Sending anomaly from sendCartAnomaly. userId:", currentUser.id, "userEmail:", currentUser.email);
    try {
      await axios.post(`${API_URL}/anomaly/behavior`, {
        features: ['rapid-cart-action'],
        userId: currentUser.id,
        userEmail: currentUser.email,
        source: 'cart',
        context: 'too-many-updates',
      });
      console.warn("🚨 Abnormal cart behavior sent to backend.");
    } catch (err) {
      console.error("Failed to log abnormal cart behavior:", err);
    }
  };

  const updateQuantity = async (productId: string, newQuantity: number) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    trackInteraction(); // ✅ Track this cart interaction
    const metrics = getMetrics();

    if (metrics.abnormal) {
      console.warn("⚠️ Abnormal cart behavior detected:", metrics.count);
      await sendCartAnomaly(); // ✅ Send to backend
      if (currentUser?.isAdmin) { // Only show to admin users
        toast({
          title: 'Suspicious Behavior',
          description: 'Unusual cart activity detected.',
          variant: 'destructive'
        });
      }
    }

    if (newQuantity < 1) {
      await removeItem(productId);
      return;
    }

    const originalItems = [...cartItems];
    setCartItems(prevItems =>
      prevItems.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );

    try {
      const res = await fetch(`${API_URL}/cart/item/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity: newQuantity,
          typingSpeed: metrics.speed ?? 0,
          pasteDetected: metrics.pasted ?? false,
          checkoutDuration: metrics.duration ?? 0,
          countryMismatch: metrics.countryMismatch ?? false
        }),
      });

      if (!res.ok) throw new Error('Failed to update quantity');
    } catch (error) {
      setCartItems(originalItems);
      toast({
        title: 'Error',
        description: 'Could not update item quantity.',
        variant: 'destructive',
      });
    }
  };

  const removeItem = async (productId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    trackInteraction(); // Track this cart interaction
    const metrics = getMetrics();

    const originalItems = [...cartItems];
    setCartItems(prevItems => prevItems.filter(item => item.id !== productId));

    try {
      const res = await fetch(`${API_URL}/cart/item/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to remove item');
      toast({ title: 'Item removed from cart.' });

      if (metrics.abnormal) {
        if (!currentUser?.id || !currentUser?.email) {
          console.warn("Anomaly not sent from removeItem: currentUser or currentUser.id/email is null/undefined.");
          return;
        }
        console.log("Sending anomaly from removeItem. currentUser:", currentUser);
        console.log("Sending anomaly from removeItem. userId:", currentUser.id, "userEmail:", currentUser.email);
        await axios.post(`${API_URL}/anomaly/behavior`, {
          userId: currentUser.id,
          userEmail: currentUser.email,
          source: 'cart',
          context: 'rapid-remove',
          features: [ // Changed to array format
            metrics.speed,
            metrics.pasted ? 1 : 0,
            metrics.duration,
            metrics.countryMismatch ? 1 : 0,
            metrics.count,
            metrics.abnormal ? 1 : 0,
          ]
        });
        if (currentUser?.isAdmin) { // Only show to admin users
          toast({
            title: 'Suspicious Behavior',
            description: 'Unusual cart activity detected.',
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      setCartItems(originalItems);
      toast({ title: 'Error', description: 'Could not remove item from cart.', variant: 'destructive' });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 md:py-24 text-center flex flex-col items-center">
        <Loader2 className="h-24 w-24 animate-spin text-primary/70 mb-8" />
        <h1 className="font-headline text-4xl font-bold mb-6">Loading Your Cart...</h1>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="container mx-auto px-4 py-12 text-center flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <UserCircle className="h-20 w-20 text-primary/80 mb-6" />
        <h2 className="font-headline text-2xl font-semibold mb-3">Please Log In</h2>
        <p className="text-muted-foreground mb-8 max-w-md">
          You need to be logged in to view your shopping cart.
        </p>
        <Link href="/login">
          <Button size="lg" className="font-semibold">Login / Sign Up</Button>
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 md:py-24 text-center flex flex-col items-center">
        <BackButton className="absolute top-20 left-4 md:left-8" />
        <ShoppingBag className="h-24 w-24 text-primary/70 mb-8" />
        <h1 className="font-headline text-4xl font-bold mb-6">Your Cart is Empty</h1>
        <p className="text-muted-foreground mb-8 max-w-md">Looks like you haven't added anything to your cart yet. Explore our products and find something you'll love!</p>
        <Link href="/products">
          <Button size="lg" className="font-semibold">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center mb-10">
        <BackButton />
        <h1 className="font-headline text-4xl font-bold text-center flex-grow">Your Shopping Cart</h1>
      </div>
      <div className="grid lg:grid-cols-3 gap-x-8 gap-y-10">
        <div className="lg:col-span-2 space-y-6">
          {cartItems.map(item => (
            <Card key={item.id} className="rounded-lg flex flex-col sm:flex-row items-center p-4 sm:p-6 gap-4 shadow-lg border">
              <Image
                src={item.imageUrl}
                alt={item.name}
                width={120}
                height={120}
                className="rounded-md object-cover w-24 h-24 sm:w-32 sm:h-32 border"
              />
              <div className="flex-grow text-center sm:text-left">
                <h2 className="font-headline text-lg font-semibold">{item.name}</h2>
                <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
              </div>
              <div className="flex items-center gap-2 my-2 sm:my-0">
                <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity - 1)} className="rounded-full w-8 h-8"><Minus className="h-4 w-4" /></Button>
                <Input
                  type="number"
                  value={item.quantity}
                  readOnly
                  className="w-16 h-9 text-center border-none bg-transparent font-medium text-base"
                  onKeyDown={onKeyDown} // Attach handler
                  onPaste={onPaste}     // Attach handler
                />
                <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, item.quantity + 1)} className="rounded-full w-8 h-8"><Plus className="h-4 w-4" /></Button>
              </div>
              <p className="font-semibold text-lg w-24 text-center sm:text-right">${(item.price * item.quantity).toFixed(2)}</p>
              <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} aria-label="Remove item" className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-5 w-5" />
              </Button>
            </Card>
          ))}
        </div>

        <div className="lg:col-span-1">
          <Card className="p-6 shadow-xl rounded-lg sticky top-24 border">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="font-headline text-2xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">${shipping.toFixed(2)}</span>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-bold text-xl">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
              <Link href="/checkout" className="w-full block mt-8">
                <Button size="lg" className="w-full font-semibold text-base py-3">Proceed to Checkout</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
