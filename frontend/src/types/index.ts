
export interface User {
  id: string; // MongoDB's _id will be mapped to id
  email: string;
  name: string;
  ipAddress: string;
  ipLocation?: string; 
  deviceFingerprint: string; 
  avgTypingSpeedLogin?: number; 
  passwordPasted?: boolean;
  trustScore: number; 
  status: 'Safe' | 'Monitor' | 'Suspicious' | 'Blocked';
  lastActivity: string; 
  deviceReuseCount?: number;
  billingCountry?: string;
  createdAt?: string;
  transactions?: Transaction[];
  alerts?: Alert[];
  cart?: CartItem[];
  wishlist?: Product[];
  isAdmin?: boolean;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category: string;
  inStock?: boolean;
  rating?: number;
  reviews?: number;
  isInWishlist?: boolean; 
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail?: string;
  items: CartItem[];
  totalAmount: number;
  timestamp: string; 
  checkoutDuration?: number; 
  shippingAddress?: string;
  paymentInfo?: string; 
  ipCountry?: string;
  billingCountry?: string;
  typingSpeedShipping?: number;
  typingSpeedPayment?: number;
  status: 'Completed' | 'Pending Review' | 'Blocked';
}

export interface Alert {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  timestamp: string; 
  message: string;
  severity: 'Low' | 'Medium' | 'High';
  reason: string; 
  isRead: boolean;
  type: 'alert' | 'anomaly'; // Added type property
}

export interface BehavioralData {
  ipAddress?: string;
  deviceFingerprint?: string;
  typingSpeedLogin?: number;
  passwordPastedLogin?: boolean;
  timeOnPageCheckout?: number; 
  typingSpeedShipping?: number;
  typingSpeedPayment?: number;
  billingCountry?: string;
  // Fields like ipCountry, deviceReuseCount are added by the backend
}

export interface Rule {
  id: string;
  name: string;
  condition: string; 
  action: string; 
  description: string;
  isEnabled: boolean;
  category: 'Typing' | 'Device' | 'Location' | 'Transaction' | 'Other';
  severityImpact: number;
}

export interface AnalyticsData {
  totalUsers: number;
  totalAnomalies: number;
  avgTrustScore: number;
  dailyLoginTrends: { date: string; logins: number }[];
}

export interface LiveActivity {
  id: string;
  timestamp: string;
  userId: string;
  userEmail?: string;
  action: string;
  riskScore?: number;
  details?: Record<string, any>;
  isSuspicious: boolean;
}