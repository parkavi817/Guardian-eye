"use client";
import { useState, useEffect, useRef } from 'react';
import { ProductCard } from '@/components/ecommerce/ProductCard';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { Product } from '@/types';
import { BackButton } from '@/components/layout/BackButton';
import { Skeleton } from '@/components/ui/skeleton';
import { useTypingBehavior } from '@/hooks/useTypingBehavior';
import { trackUserBehavior } from '@/services/trackingService';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const { typingSpeed, keystrokeVariation, pasteDetected, reset } = useTypingBehavior(searchInputRef);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/products`);
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setAllProducts(data);
      } catch (err) {
        console.error('Failed to load products from backend:', err);
        setAllProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = allProducts.filter(product =>
      product.name.toLowerCase().includes(lowercasedFilter) ||
      product.description.toLowerCase().includes(lowercasedFilter)
    );
    setFilteredProducts(filtered);
  }, [searchTerm, allProducts]);

  const handleSearchInputBlur = async () => {
    // Use the searchTerm state directly, which should be updated by the onChange handler
    console.log("Products Page - Tracking Search Input on BLUR:");
    console.log("  searchTerm (from state):", searchTerm); // Log current state value
    console.log("  typingSpeed (from hook):", typingSpeed);
    console.log("  pasteDetected (from hook):", pasteDetected);
    console.log("  keystrokeVariation (from hook):", keystrokeVariation);

    await trackUserBehavior({
      action: 'product_search_completed',
      context: `query: ${searchTerm}`, // Use searchTerm state
      typingSpeed: typingSpeed,
      pasteDetected: pasteDetected,
      keystrokeVariation: keystrokeVariation,
      screenWidth: window.screen.width,
      language: navigator.language,
    });
    reset();
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="flex items-center mb-12">
        <BackButton href="/" />
        <div className="text-center flex-grow">
          <h1 className="font-headline text-4xl md:text-5xl font-bold mb-4">Our Products</h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Browse our curated selection of high-quality items. Find what you need with ease and security.
          </p>
        </div>
      </div>

      <div className="mb-10 max-w-lg mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products by name or description..."
            className="pl-12 pr-4 py-3 text-base rounded-lg shadow-sm focus:shadow-md focus:ring-2 focus:ring-primary/50"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onBlur={handleSearchInputBlur}
            ref={searchInputRef}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-60 w-full rounded-lg" />
              <div className="space-y-2 p-2">
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {filteredProducts.map((product) => (
            <ProductCard key={product._id || product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <Search className="mx-auto h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Products Found</h2>
          <p className="text-muted-foreground">Try adjusting your search terms.</p>
        </div>
      )}
    </div>
  );
}