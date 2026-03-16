export interface PaymentProvider {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  webhook_secret?: string;
  api_config?: string;
}

export interface PaymentProviderInput {
  name: string;
  slug: string;
  is_active: boolean;
  webhook_secret: string;
  api_config: string;
}

export type PaymentStatus = "pending" | "completed" | "failed" | "cancelled";

export interface PaymentRecord {
  id: string;
  reference: string;
  amount: string | number;
  status: PaymentStatus;
  provider?: {
    id?: string;
    name?: string;
  } | null;
  created_at: string;
}

export type SubscriptionStatus = "active" | "cancelled" | "expired" | "trial";

export interface SubscriptionRecord {
  id: string;
  status: SubscriptionStatus;
  created_at: string;
  current_period_end?: string | null;
  plan?: {
    id?: string;
    name?: string;
  } | null;
}

export interface PaymentAnalyticsResponse {
  total_revenue: number;
  revenue_change: number;
  successful_payments: number;
  payment_change: number;
  conversion_rate: number;
  conversion_change: number;
  recent_payments: Array<{
    amount: string | number;
    provider: string;
    created_at: string;
  }>;
}

export interface SubscriptionAnalyticsResponse {
  active_count: number;
  subscription_change: number;
  status_breakdown: Partial<Record<SubscriptionStatus, number>>;
}
