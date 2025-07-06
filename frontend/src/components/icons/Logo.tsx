
import { ShieldCheck, type LucideProps } from 'lucide-react';
import { cn } from "@/lib/utils";

interface LogoProps extends LucideProps {
  // LucideProps includes className, color, strokeWidth, etc.
  // We're effectively overriding Lucide's 'size' prop (which expects pixels)
  // with our own 'size' prop that maps to Tailwind-like spacing units (1 unit = 0.25rem).
  size?: number; 
}

export function Logo({ size: customSize = 8, className, ...props }: LogoProps) {
  // Convert our customSize (tailwind unit like 8 for h-8/w-8) to a rem value for inline style.
  const dimensionInRem = `${customSize * 0.25}rem`;

  return (
    <ShieldCheck
      style={{ height: dimensionInRem, width: dimensionInRem }}
      className={cn("text-primary", className)} // cn handles if className is undefined
      {...props} // Pass other LucideProps like color, strokeWidth etc.
    />
  );
}
