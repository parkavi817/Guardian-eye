'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BackButton } from '@/components/layout/BackButton';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function TrackOrderPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const router = useRouter();

  const [orderDate, setOrderDate] = useState<Date | null>(null);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;

      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        const placed = new Date(data.createdAt); // use actual order date from DB
        setOrderDate(placed);

        const minDate = new Date(placed);
        const maxDate = new Date(placed);
        minDate.setDate(minDate.getDate() + 3);
        maxDate.setDate(maxDate.getDate() + 5);

        const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
        setEstimatedDelivery(`${minDate.toLocaleDateString(undefined, options)} - ${maxDate.toLocaleDateString(undefined, options)}`);
      } catch (err) {
        console.error('Failed to fetch order:', err);
        router.push('/settings');
      }
    };

    fetchOrder();
  }, [orderId, router]);

  return (
    <div className="container py-12 space-y-8">
      <div className="flex items-center gap-4">
        <BackButton href="/settings" />
        <h1 className="font-headline text-3xl font-bold">Track Your Order</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p><strong>Order Placed:</strong> {orderDate?.toLocaleDateString()}</p>
          <p><strong>Estimated Delivery:</strong> {estimatedDelivery}</p>
          <ul className="space-y-2 mt-6">
            <li>✅ Order Confirmed</li>
            <li>🚚 Shipped</li>
            <li>📦 Out for Delivery</li>
          </ul>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button variant="outline" onClick={() => router.push('/settings')}>
          Back to Settings
        </Button>
      </div>
    </div>
  );
}