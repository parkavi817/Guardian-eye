"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface BackButtonProps {
  className?: string;
  href?: string;
}

export function BackButton({ className, href }: BackButtonProps) {
  const router = useRouter();

  if (href) {
    return (
      <Button 
        variant="outline" 
        asChild
        className={cn("mb-6 md:mb-8 shadow-sm hover:shadow-md transition-shadow", className)}
      >
        <Link href={href}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Link>
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      onClick={() => router.back()}
      className={cn("mb-6 md:mb-8 shadow-sm hover:shadow-md transition-shadow", className)}
      aria-label="Go back to the previous page"
    >
      <ChevronLeft className="mr-2 h-4 w-4" />
      Back
    </Button>
  );
}
