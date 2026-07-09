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
  skillId: string;
  amount: number;
  paymentMethod: 'stripe' | 'paypal';
  timestamp: string;
}

export interface UserSession {
  username: string;
  isPremium: boolean;
  purchasedSkills: string[];
}

export interface ExecutionRecord {
  id: string;
  username: string;
  skillId: string;
  skillName: string;
  prompt: string;
  response: string;
  timestamp: string;
  tokens: number;
}

export interface AnalyticsData {
  revenueOverTime: { date: string; amount: number }[];
  purchasesBySkill: { skillId: string; skillName: string; count: number; revenue: number }[];
  activeUsersPremium: { date: string; premium: number; free: number }[];
  skillUsageCounts: { skillId: string; skillName: string; count: number }[];
  recentPurchases: PurchaseRecord[];
  recentExecutions: ExecutionRecord[];
}
