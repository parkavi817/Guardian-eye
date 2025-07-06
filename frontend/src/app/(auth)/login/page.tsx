'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTypingBehavior } from '@/hooks/useTypingBehavior'; // Adjust path as needed
import { trackUserBehavior } from '@/services/trackingService'; // Adjust path as needed
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  const passwordInputRef = useRef<HTMLInputElement>(null);
  const { typingSpeed, keystrokeVariation, pasteDetected, reset } =
    useTypingBehavior(passwordInputRef);

  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      console.log('Login API Response:', data);

      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.token) {
        login(data.token); // This sets the token in localStorage and calls verifyUser

        // NOW, send behavioral tracking AFTER successful login and token is set
        await trackUserBehavior({
          action: 'login_success', // Change action to reflect successful login
          context: 'login_form',
          typingSpeed,
          keystrokeVariation,
          pasteDetected,
          screenWidth: window.screen.width,
          language: navigator.language,
          email,
        });
        reset(); // Clear tracking state after sending

        router.push('/');
      } else {
        throw new Error('Login successful, but no token received.');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: (error as Error).message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen px-4 bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-lg lg:max-w-2xl mx-auto p-8 space-y-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">Login</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              ref={passwordInputRef}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              'Login'
            )}
          </Button>
        </form>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don’t have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign Up
          </Link>
        </div>
        <div className="text-center text-sm text-gray-600 dark:text-gray-400">
          <Link href="/forgot-password" className="font-medium text-primary hover:underline">
            Forgot Password?
          </Link>
        </div>
      </div>
    </div>
  );
}