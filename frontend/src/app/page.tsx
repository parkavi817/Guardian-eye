"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { mockProducts } from '@/lib/mockData';
import { ArrowRight, ShieldCheck, ShoppingBag, Truck, User, Heart, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProductCard } from '@/components/ecommerce/ProductCard';
import type { Product } from '@/types';

export default function HomePage() {
  const { currentUser } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(`${API_URL}/products`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setFeaturedProducts(data.slice(0, 3));
        } else {
          setFeaturedProducts(mockProducts.slice(0, 3));
        }
      } catch (error) {
        console.error("Failed to fetch featured products:", error);
        setFeaturedProducts(mockProducts.slice(0, 3));
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div>
      <section className="relative h-[60vh] md:h-[70vh] w-full text-white flex items-center justify-center text-center overflow-hidden">
        <Image
          src="https://images.pexels.com/photos/1778412/pexels-photo-1778412.jpeg"
          alt="A collection of stylish products on a shelf"
          fill
          className="object-cover z-0 brightness-50"
          priority
        />
        <div className="relative z-10 p-4 max-w-4xl mx-auto">
          <h1 className="font-headline text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight drop-shadow-lg">
            Secure Shopping, <br />Unmatched Style
          </h1>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto drop-shadow-md">
            Discover amazing products with peace of mind. Our advanced security ensures a safe shopping experience for everyone.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/products">
              <Button size="lg" className="font-semibold text-lg px-8 py-6">
                Shop All Products <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            {currentUser ? (
              <Link href="/settings">
                <Button size="lg" variant="outline" className="font-semibold text-lg px-8 py-6 bg-white/10 border-white/80 hover:bg-white/20 text-white">
                  <User className="mr-2 h-5 w-5" /> My Account
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button size="lg" variant="outline" className="font-semibold text-lg px-8 py-6 bg-white/10 border-white/80 hover:bg-white/20 text-white">
                  Login / Sign Up
                </Button>
              </Link>
            )}
            <Link href="/wishlist">
              <Button size="lg" variant="outline" className="font-semibold text-lg px-8 py-6 bg-white/10 border-white/80 hover:bg-white/20 text-white">
                <Heart className="mr-2 h-5 w-5" /> Wishlist
              </Button>
            </Link>
            <Link href="/cart">
              <Button size="lg" variant="outline" className="font-semibold text-lg px-8 py-6 bg-white/10 border-white/80 hover:bg-white/20 text-white">
                <ShoppingCart className="mr-2 h-5 w-5" /> Cart
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        <section className="py-16 md:py-20">
          <h2 className="font-headline text-4xl font-semibold text-center mb-14">Featured Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id || product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="py-16 md:py-20">
          <Card className="bg-card shadow-xl rounded-lg">
            <CardHeader className="text-center pb-4">
              <CardTitle className="font-headline text-3xl">Why Shop With Us?</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-8 text-center pt-4">
              <div className="flex flex-col items-center p-4">
                <ShieldCheck className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Secure Transactions</h3>
                <p className="text-muted-foreground leading-relaxed">Protected by Guardian Eye&apos;s state-of-the-art behavioral anomaly detection for a worry-free checkout.</p>
              </div>
              <div className="flex flex-col items-center p-4">
                <ShoppingBag className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Quality Products</h3>
                <p className="text-muted-foreground leading-relaxed">We offer a curated selection of high-quality items to meet your needs and exceed expectations.</p>
              </div>
              <div className="flex flex-col items-center p-4">
                <Truck className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Fast Shipping</h3>
                <p className="text-muted-foreground leading-relaxed">Your orders are processed promptly and shipped reliably, getting to you when you need them.</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
