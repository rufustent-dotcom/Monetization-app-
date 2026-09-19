export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  price: number;
  tier: 'free' | 'premium';
  category: 'development' | 'marketing' | 'finance' | 'productivity';
  icon: string;
  systemInstruction: string;
  placeholderPrompt: string;
  popular?: boolean;
}

export interface PurchaseRecord {
  id: string;
  username: string;
  userName?: string;
  userEmail?: string;
  skillId: string;
  amount: number;
  paymentMethod: 'stripe' | 'paypal';
  merchantName?: string;
  merchantEmail?: string;
  payoutDestination?: string;
  timestamp: string;
}

export interface UserSession {
  username: string;
  name: string;
  email: string;
  merchantName: string;
  merchantEmail: string;
  businessName: string;
  stripeAccountId: string;
  paypalMerchantId: string;
  isPremium: boolean;
  purchasedSkills: string[];
}

export interface ExecutionRecord {
  id: string;
  username: string;
  skillId: string;
  skillName: string;
  engineUsed?: string;
  prompt: string;
  response: string;
  timestamp: string;
  tokens: number;
}

export interface ApiStatus {
  id: string;
  name: string;
  category: 'AI Models' | 'Special Paid AI' | 'Payment Processing' | 'Search & Grounding' | 'Custom Enterprise';
  isPaid: boolean;
  isConfigured: boolean;
  envVar: string;
  description: string;
}

export interface AnalyticsData {
  revenueOverTime: { date: string; amount: number }[];
  purchasesBySkill: { skillId: string; skillName: string; count: number; revenue: number }[];
  activeUsersPremium: { date: string; premium: number; free: number }[];
  skillUsageCounts: { skillId: string; skillName: string; count: number }[];
  recentPurchases: PurchaseRecord[];
  recentExecutions: ExecutionRecord[];
}
