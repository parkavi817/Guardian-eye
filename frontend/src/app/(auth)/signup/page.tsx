"use client";

import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card, CardContent, CardDescription, CardFooter,
  CardHeader, CardTitle
} from '@/components/ui/card';
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Logo } from '@/components/icons/Logo';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useTransition, useState, useRef } from 'react'; // Added useRef
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTypingBehavior } from '@/hooks/useTypingBehavior'; // NEW: Use the comprehensive hook
// import { trackUserBehavior } from '@/services/trackingService'; // REMOVED: No longer needed here

const signupSchema = z.object({
  name: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const { toast } = useToast();
  const { signup, currentUser, isLoading } = useAuth();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // NEW: Ref for password input and useTypingBehavior hook
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const { typingSpeed, keystrokeVariation, pasteDetected, reset } = useTypingBehavior(passwordInputRef);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!isLoading && currentUser) {
      router.replace(currentUser.isAdmin ? '/admin/dashboard' : '/');
    }
  }, [currentUser, isLoading, router]);

  const onSubmit = (data: SignupFormValues) => {
    startTransition(async () => {
      try {
        // Your existing signup logic
        // Pass the metrics to the signup function in AuthContext
        await signup(data.name, data.email, data.password, {
          typingSpeedSignup: typingSpeed,
          passwordPastedSignup: pasteDetected,
          // Add other metrics if needed, e.g., country from useBehaviorTracker
          // country: country, // If you re-introduce country detection
        });
        reset(); // Reset typing behavior state after submission here, after signup completes

      } catch (error) {
        console.error("Signup error:", error);
        toast({
          title: "Signup Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading || currentUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-2xl rounded-lg border">
      <CardHeader className="text-center space-y-4 pt-8">
        <Link href="/" className="inline-block mx-auto">
          <Logo size={10} />
        </Link>
        <CardTitle className="font-headline text-3xl">Create Account</CardTitle>
        <CardDescription>Join Guardian Eye for a secure shopping experience.</CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      autoComplete="name"
                      className="py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      {...field}
                      autoComplete="email"
                      className="py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      ref={passwordInputRef} // NEW: Attach ref here
                      autoComplete="new-password"
                      className="py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      {...field}
                      autoComplete="new-password"
                      className="py-3"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full font-semibold py-3 text-base mt-2"
              disabled={isPending}
            >
              {isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-center pb-8">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}