'use client';

import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from 'react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
  trustScore: number;
  status: string;
  wishlist?: string[]; // Array of product IDs
  orders?: any[]; // You might want to define a more specific type for orders
  alerts?: any[]; // You might want to define a more specific type for alerts
}

interface AuthContextType {
  currentUser: AuthenticatedUser | null;
  isLoading: boolean;
  token: string | null; // ADDED: Expose token
  login: (token: string) => void;
  logout: () => void;
  verifyUser: () => Promise<void>;
  signup: (name: string, email: string, password: string, metrics: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null); // ADDED: Local state for token
  const { toast } = useToast();
  const router = useRouter();

  const verifyUser = useCallback(async () => {
    console.log('AuthContext: verifyUser function called.');
    setIsLoading(true);
    try {
      const storedToken = localStorage.getItem('token'); // Get from localStorage
      if (!storedToken) {
        setCurrentUser(null);
        setToken(null); // Ensure token state is null
        setIsLoading(false);
        return;
      }

      // If storedToken exists, set it to state immediately
      setToken(storedToken); // Set token state here

      const verifyUrl = `${API_URL}/users/me`;
      console.log("AuthContext: Attempting to verify user at URL:", verifyUrl);

      const response = await fetch(verifyUrl, {
        headers: {
          Authorization: `Bearer ${storedToken}`, // Use storedToken for fetch
        },
      });

      console.log("AuthContext: Verify user response status:", response.status);

      if (!response.ok) {
        localStorage.removeItem('token');
        setCurrentUser(null);
        setToken(null); // Clear token state on failure
        if (response.status === 401) {
          toast({
            title: 'Session Expired',
            description: 'Please log in again.',
            variant: 'destructive',
          });
          router.push('/login');
        } else {
          throw new Error('Failed to fetch user data');
        }
        return;
      }

      const data = await response.json();
      console.log('AuthContext: Data received from /users/me:', data);
      const userProfile = data.user || data;

      const authenticatedUser: AuthenticatedUser = {
        ...userProfile,
        isAdmin: userProfile.isAdmin || false,
      };
      setCurrentUser(authenticatedUser);
      console.log('AuthContext: currentUser set to:', authenticatedUser);
    } catch (error) {
      console.error('Auth verification failed:', error);
      setCurrentUser(null);
      setToken(null); // Clear token state on error
      toast({
        title: 'Authentication Error',
        description: 'Failed to verify session. Please log in.',
        variant: 'destructive',
      });
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [toast, router]);

  useEffect(() => {
    verifyUser();
  }, [verifyUser]);

  const login = useCallback(
    (newToken: string) => { // Renamed to newToken to avoid confusion
      localStorage.setItem('token', newToken);
      setToken(newToken); // Set token state here
      verifyUser();
      toast({
        title: 'Logged In',
        description: 'Welcome back!',
      });
    },
    [verifyUser, toast]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setCurrentUser(null);
    setToken(null); // Clear token state on logout
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
    });
    router.push('/login');
  }, [router, toast]);

  const signup = useCallback(
    async (name: string, email: string, password: string, metrics: any) => {
      setIsLoading(true);
      try {
        // 1. Send signup request
        const res = await fetch(`${API_URL}/auth/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Signup failed');
        }

        // 2. Send anomaly metrics (if signup was successful)
        // The Python model expects: [typingSpeed, pasteDetected, checkoutDuration, countryMismatch]
        // From signup page, we have: typingSpeedSignup, passwordPastedSignup, country
        const anomalyFeatures = [
          metrics.typingSpeedSignup || 0, // typingSpeed
          metrics.passwordPastedSignup ? 1 : 0, // pasteDetected
          0, // checkoutDuration (not applicable for signup)
          (metrics.country && metrics.country !== 'US') ? 1 : 0, // Example: Mismatch if not US, adjust as needed
        ];

        const anomalyBehaviorUrl = `${API_URL}/anomaly/behavior`; // ADDED LOG
        console.log("AuthContext: Sending anomaly behavior to URL:", anomalyBehaviorUrl); // ADDED LOG

        await fetch(anomalyBehaviorUrl, { // Use the new variable
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`, // Use the new token for anomaly reporting
          },
          body: JSON.stringify({
            features: anomalyFeatures,
            userId: data.user.id, // Assuming signup response includes user ID
            userEmail: data.user.email, // Assuming signup response includes user email
            source: 'signup',
            context: 'user-signup-behavior',
            message: 'Behavioral anomaly during signup',
          }),
        });

        // 3. Log in the user
        if (data.token) {
          localStorage.setItem('token', data.token);
          setToken(data.token); // Set token state here after signup
          await verifyUser(); // Verify user to set currentUser state
          toast({
            title: 'Account Created',
            description: 'Welcome to Guardian Eye!',
          });
          router.push('/');
        } else {
          throw new Error('Signup successful, but no token received.');
        }
      } catch (error) {
        console.error('Signup error:', error);
        toast({
          title: 'Signup Failed',
          description: (error as Error).message || 'An unexpected error occurred.',
          variant: 'destructive',
        });
        throw error; // Re-throw to be caught by the form's try/catch
      } finally {
        setIsLoading(false);
      }
    },
    [verifyUser, toast, router]
  );

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, token, login, logout, verifyUser, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};