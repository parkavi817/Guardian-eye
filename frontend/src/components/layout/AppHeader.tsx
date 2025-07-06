
"use client"; 
import Link from 'next/link';
import { ShoppingCart, UserCircle, LogOutIcon, Settings, Heart, ExternalLinkIcon } from 'lucide-react';
import { Logo } from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext'; 
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


export function AppHeader() {
  const { currentUser, logout, isLoading } = useAuth();
  
  // Use optional chaining and nullish coalescing to safely get counts.
  const cartItemCount = currentUser?.cart?.length ?? 0;
  const wishlistItemCount = currentUser?.wishlist?.length ?? 0;

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1 && names[0] && names[names.length - 1]) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Logo size={7} />
          <span className="font-headline text-xl font-bold">Guardian Eye</span>
        </Link>
        <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
          <Link href="/products" className="transition-colors hover:text-primary">
            Products
          </Link>
          {currentUser?.isAdmin && (
            <Link href="/admin/dashboard" className="transition-colors hover:text-primary">
              Admin Panel
            </Link>
          )}
        </nav>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link href="/wishlist" passHref>
            <Button variant="ghost" size="icon" aria-label="Wishlist" className="relative">
              <Heart className="h-5 w-5" />
              {wishlistItemCount > 0 && (
                <Badge variant="default" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-xs bg-rose-500 hover:bg-rose-600 text-white">
                  {wishlistItemCount}
                </Badge>
              )}
            </Button>
          </Link>
          <Link href="/cart" passHref>
            <Button variant="ghost" size="icon" aria-label="Shopping Cart" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-xs">
                  {cartItemCount}
                </Badge>
              )}
            </Button>
          </Link>
          
          {isLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted"></div>
          ) : currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    {/* <AvatarImage src="/path-to-user-image.jpg" alt={currentUser.name} /> */}
                    <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {currentUser.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Account Settings
                  </Link>
                </DropdownMenuItem>
                {currentUser.isAdmin && (
                  <DropdownMenuItem asChild>
                     <Link href="/admin/dashboard">
                      <UserCircle className="mr-2 h-4 w-4" /> 
                      Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOutIcon className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login" passHref>
              <Button variant="outline" size="sm">
                <UserCircle className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}