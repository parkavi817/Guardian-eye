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
import { useParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
  confirmNewPassword: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match.",
  path: ["confirmNewPassword"],
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [passwordReset, setPasswordReset] = useState(false);
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const onSubmit = (data: ResetPasswordFormValues) => {
    startTransition(async () => {
      try {
        const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newPassword: data.newPassword }),
        });

        if (!res.ok) {
          const errorResult = await res.json();
          throw new Error(errorResult.message || 'Failed to reset password.');
        }

        setPasswordReset(true);
        toast({
          title: "Password Reset Successful",
          description: "Your password has been updated. You can now log in with your new password.",
        });
        // Optionally redirect to login page after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } catch (error) {
        console.error("Reset password error", error);
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
        <CardTitle className="font-headline text-3xl">Reset Password</CardTitle>
        <CardDescription>
          {passwordReset
            ? "Your password has been successfully reset!"
            : "Enter your new password below."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-8">
        {passwordReset ? (
          <div className="text-center text-muted-foreground">
            <p>You can now log in with your new password.</p>
            <p className="mt-4">Redirecting to login page...</p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                        className="py-3"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmNewPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
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
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Reset Password'}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-center space-y-3 pb-8">
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to Login
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}