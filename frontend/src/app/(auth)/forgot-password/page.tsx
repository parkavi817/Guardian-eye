'use client';
import { useState, useTransition } from 'react';
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
import { Loader2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [emailSent, setEmailSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordFormValues) => {
    startTransition(async () => {
      try {
        const res = await fetch(`${API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: data.email }),
        });

        if (!res.ok) {
          const errorResult = await res.json();
          throw new Error(errorResult.message || 'Failed to send reset email.');
        }

        setEmailSent(true);
        toast({
          title: "Password Reset Email Sent",
          description: "If an account with that email exists, a password reset link has been sent to your inbox.",
        });
      } catch (error) {
        console.error("Forgot password request error", error);
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card className="w-full max-w-md shadow-2xl rounded-lg border">
      <CardHeader className="text-center space-y-4 pt-8">
        <Link href="/" className="inline-block mx-auto">
          <Logo size={10} />
        </Link>
        <CardTitle className="font-headline text-3xl">Forgot Password?</CardTitle>
        <CardDescription>
          {emailSent
            ? "Please check your email for a password reset link. This link is valid for 10 minutes."
            : "Enter your email address below and we'll send you a link to reset your password."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-8">
        {emailSent ? (
          <div className="text-center text-muted-foreground">
            <p>If an account with that email exists, a password reset link has been sent to your inbox.</p>
            <p className="mt-4">Didn't receive the email? Check your spam folder or try again.</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <Button
                type="submit"
                className="w-full font-semibold py-3 text-base"
                disabled={isPending}
              >
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Reset Link'}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-3 pb-8">
        <p className="text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}