
"use client";
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useTypingMetrics } from '@/hooks/useTypingMetrics';
import { useToast } from '@/hooks/use-toast';
import type { BehavioralData, CartItem } from '@/types';
import { useEffect, useState, useTransition } from 'react';
import { BackButton } from '@/components/layout/BackButton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Truck, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const checkoutSchema = z.object({
  shippingFullName: z.string().min(2, "Full name is required"),
  shippingAddress: z.string().min(5, "Street address is required"),
  shippingCity: z.string().min(2, "City is required"),
  shippingState: z.string().min(2, "State/Province is required"),
  shippingZip: z.string().min(5, "ZIP/Postal code is required"),
  shippingCountry: z.string().min(2, "Country is required"),
  paymentMethod: z.enum(['card', 'cod'], { required_error: 'You need to select a payment method.'}),
  cardName: z.string().optional(),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCvc: z.string().optional(),
  billingCountry: z.string().min(2, "Billing country is required"),
}).refine((data) => {
    if (data.paymentMethod === 'card') {
      return z.string().min(2, "Name on card is required").safeParse(data.cardName).success;
    }
    return true;
}, {
    message: "Name on card is required",
    path: ["cardName"],
}).refine((data) => {
    if (data.paymentMethod === 'card') {
      return z.string().length(16, "Card number must be 16 digits").regex(/^\d+$/, "Card number must be digits").safeParse(data.cardNumber).success;
    }
    return true;
}, {
    message: "Card number must be 16 digits",
    path: ["cardNumber"],
}).refine((data) => {
    if (data.paymentMethod === 'card') {
      return z.string().length(5, "Expiry date must be MM/YY").regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Invalid expiry date format (MM/YY)").safeParse(data.cardExpiry).success;
    }
    return true;
}, {
    message: "Expiry date must be MM/YY",
    path: ["cardExpiry"],
}).refine((data) => {
    if (data.paymentMethod === 'card') {
      return z.string().length(3, "CVC must be 3 digits").regex(/^\d{3}$/, "CVC must be 3 digits").safeParse(data.cardCvc).success;
    }
    return true;
}, {
    message: "CVC must be 3 digits",
    path: ["cardCvc"],
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [isPending, startTransition] = useTransition();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartLoading, setIsCartLoading] = useState(true);
  
  const shippingAddressMetrics = useTypingMetrics('checkout-shipping-address');
  const paymentInfoMetrics = useTypingMetrics('checkout-payment-card');
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!currentUser || !token) return; 

    setStartTime(Date.now());
    const fetchCart = async () => {
        setIsCartLoading(true);
        try {
            const res = await fetch(`${API_URL}/cart`, { 
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if(!res.ok) throw new Error("Failed to load cart for checkout");
            const data = await res.json();
            setCartItems(data.items || []);
            console.log('Fetched cart items:', data.items); // Added log
        } catch (error) {
            toast({ title: 'Error', description: 'Could not load cart items.', variant: 'destructive'});
            router.push('/cart');
        } finally {
            setIsCartLoading(false);
        }
    }
    fetchCart();
  }, [currentUser, router, toast]);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      shippingFullName: "", shippingAddress: "", shippingCity: "", shippingState: "", shippingZip: "", shippingCountry: "USA",
      paymentMethod: 'card',
      cardName: "", cardNumber: "", cardExpiry: "", cardCvc: "", billingCountry: "USA"
    },
  });

  const paymentMethod = form.watch('paymentMethod');

  const onSubmit = (formData: CheckoutFormValues) => {
    console.log('Submitting form. Current cartItems state:', cartItems); // Added log
    const token = localStorage.getItem('token');
    if (!token) {
        toast({ title: 'Authentication Error', description: 'Please log in to place an order.', variant: 'destructive' });
        return;
    }
    const checkoutDuration = startTime ? (Date.now() - startTime) / 1000 : undefined;

    const shippingTypingData = shippingAddressMetrics.getMetrics(
        formData.shippingAddress.length + formData.shippingCity.length + formData.shippingState.length + formData.shippingZip.length + formData.shippingCountry.length
    );
    const paymentTypingData = formData.paymentMethod === 'card' ? paymentInfoMetrics.getMetrics(
        (formData.cardName?.length || 0) + (formData.cardNumber?.length || 0) + (formData.cardExpiry?.length || 0) + (formData.cardCvc?.length || 0)
    ) : null;

    const behavioralData: BehavioralData = {
      deviceFingerprint: navigator.userAgent,
      timeOnPageCheckout: checkoutDuration,
      typingSpeedShipping: shippingTypingData?.speed,
      typingSpeedPayment: paymentTypingData?.speed,
      billingCountry: formData.billingCountry,
    };
    
    const apiPayload = {
        shippingAddress: {
            fullName: formData.shippingFullName,
            address: formData.shippingAddress,
            city: formData.shippingCity,
            state: formData.shippingState,
            zip: formData.shippingZip,
            country: formData.shippingCountry,
        },
        paymentInfo: {
            method: formData.paymentMethod,
            nameOnCard: formData.cardName,
            cardNumber: formData.cardNumber,
            expiry: formData.cardExpiry,
            cvc: formData.cardCvc,
            billingCountry: formData.billingCountry,
        },
        items: cartItems,
        behavioralMetrics: behavioralData
    };

    startTransition(async () => {
      try {
        const res = await fetch(`${API_URL}/orders/place`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(apiPayload),
        });

        const result = await res.json();
        if (!res.ok) {
            throw new Error(result.message || "An unknown error occurred");
        }
        
        toast({
            title: "Order placed successfully!",
            description: (
                <div>
                    <p>Your order ID: {result.orderId}</p>
                    <Button
                        onClick={() => router.push(`/checkout/track?orderId=${result.orderId}`)}
                        className="mt-2"
                    >
                        Track Order
                    </Button>
                </div>
            ),
            duration: 8000,
        });

        if (result.status === 'Suspicious' || result.status === 'Monitor') {
            toast({
              title: "Transaction Flagged for Review",
              description: `Your order requires manual review and will be processed shortly.`,
              variant: "destructive",
              duration: 10000,
            });
        }
        form.reset(); 
      } catch (error) {
        toast({
            title: "Error Placing Order",
            description: error instanceof Error ? error.message : "An unknown error occurred.",
            variant: "destructive"
        });
      }
    });
  };

  if (isCartLoading) {
     return (
      <div className="container mx-auto px-4 py-12 text-center flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Loading checkout...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-16">
      <div className="flex items-center mb-12">
        <BackButton />
        <h1 className="font-headline text-4xl md:text-5xl font-bold text-center flex-grow">Secure Checkout</h1>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-2 gap-x-12 gap-y-10">
          <Card className="shadow-xl rounded-lg border">
            <CardHeader className="pb-4">
              <CardTitle className="font-headline text-2xl">Shipping Information</CardTitle>
              <CardDescription>Where should we send your order?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FormField name="shippingFullName" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="John M. Doe" {...field} className="py-3"/></FormControl><FormMessage /></FormItem>
              )} />
              <FormField name="shippingAddress" control={form.control} render={({ field }) => (
                <FormItem><FormLabel>Street Address</FormLabel><FormControl><Textarea placeholder="123 Main St, Apt 4B" {...field} onKeyDown={shippingAddressMetrics.handleKeyDown} onPaste={shippingAddressMetrics.handlePaste} /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid md:grid-cols-2 gap-4">
                <FormField name="shippingCity" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>City</FormLabel><FormControl><Input placeholder="New York" {...field} onKeyDown={shippingAddressMetrics.handleKeyDown} className="py-3"/></FormControl><FormMessage /></FormItem>
                )} />
                <FormField name="shippingState" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>State / Province</FormLabel><FormControl><Input placeholder="NY" {...field} onKeyDown={shippingAddressMetrics.handleKeyDown} className="py-3"/></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <FormField name="shippingZip" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>ZIP / Postal Code</FormLabel><FormControl><Input placeholder="10001" {...field} onKeyDown={shippingAddressMetrics.handleKeyDown} className="py-3"/></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField name="shippingCountry" control={form.control} render={({ field }) => (
                  <FormItem><FormLabel>Country</FormLabel><FormControl><Input placeholder="USA" {...field} onKeyDown={shippingAddressMetrics.handleKeyDown} className="py-3"/></FormControl><FormMessage /></FormItem>
                )} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="shadow-xl rounded-lg border">
                 <CardHeader className="pb-4">
                    <CardTitle className="font-headline text-2xl">Payment Method</CardTitle>
                    <CardDescription>Select how you would like to pay.</CardDescription>
                </CardHeader>
                <CardContent>
                     <FormField
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                            <FormControl>
                                <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="grid md:grid-cols-2 gap-4"
                                >
                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="card" id="card" className="peer sr-only" />
                                    </FormControl>
                                    <Label htmlFor="card" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                        <CreditCard className="mb-3 h-6 w-6" />
                                        Pay with Card
                                    </Label>
                                </FormItem>
                                <FormItem>
                                    <FormControl>
                                        <RadioGroupItem value="cod" id="cod" className="peer sr-only" />
                                    </FormControl>
                                    <Label htmlFor="cod" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                        <Truck className="mb-3 h-6 w-6" />
                                        Cash on Delivery
                                    </Label>
                                </FormItem>
                                </RadioGroup>
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </CardContent>
            </Card>
            
            {paymentMethod === 'card' && (
              <Card className="shadow-xl rounded-lg border animate-in fade-in-0 zoom-in-95">
                <CardHeader className="pb-4">
                  <CardTitle className="font-headline text-2xl">Payment Information</CardTitle>
                  <CardDescription>Enter your payment details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <FormField name="cardName" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Name on Card</FormLabel><FormControl><Input placeholder="John M Doe" {...field} onKeyDown={paymentInfoMetrics.handleKeyDown} onPaste={paymentInfoMetrics.handlePaste} className="py-3"/></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField name="cardNumber" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Card Number</FormLabel><FormControl><Input placeholder="•••• •••• •••• ••••" {...field} onKeyDown={paymentInfoMetrics.handleKeyDown} onPaste={paymentInfoMetrics.handlePaste} className="py-3"/></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField name="cardExpiry" control={form.control} render={({ field }) => (
                      <FormItem><FormLabel>Expiry Date (MM/YY)</FormLabel><FormControl><Input placeholder="MM/YY" {...field} onKeyDown={paymentInfoMetrics.handleKeyDown} onPaste={paymentInfoMetrics.handlePaste} className="py-3"/></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="cardCvc" control={form.control} render={({ field }) => (
                      <FormItem><FormLabel>CVC</FormLabel><FormControl><Input placeholder="123" {...field} onKeyDown={paymentInfoMetrics.handleKeyDown} onPaste={paymentInfoMetrics.handlePaste} className="py-3"/></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField name="billingCountry" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Billing Country</FormLabel><FormControl><Input placeholder="USA" {...field} onKeyDown={paymentInfoMetrics.handleKeyDown} className="py-3"/></FormControl><FormMessage /></FormItem>
                  )} />
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="lg:col-span-2 mt-8 flex justify-center">
            <Button type="submit" size="lg" className="w-full max-w-md font-semibold text-lg py-3" disabled={isPending || isCartLoading}>
              {isPending ? "Processing..." : "Place Order Securely"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
