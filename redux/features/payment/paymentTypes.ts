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

export type PaymentStatus =
  | "pending"
  | "completed"
  | "failed"
  | "cancelled"
  | "processing"
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED"
  | "PROCESSING"
  | "REFUNDED";

export interface PaymentRecord {
  id: string;
  reference?: string;
  external_payment_id?: string;
  amount: string | number;
  status: PaymentStatus;
  provider_name?: string;
  application_name?: string;
  plan_name?: string;
  customer_email?: string;
  customer_name?: string;
  metadata?: Record<string, any>;
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
  start_date?: string | null;
  end_date?: string | null;
  trial_end_date?: string | null;
  current_period_end?: string | null;
  pending_cancellation?: boolean;
  access_until?: string | null;
  auto_renew?: boolean;
  billing_authorized?: boolean;
  billing_provider?: string | null;
  current_payment_status?: string | null;
  is_active_status?: boolean;
  plan?: {
    id?: string;
    slug?: string;
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
  scheduled_cancellation_count?: number;
}

export interface EntitlementFeature {
  name: string;
  limit_type: "BOOLEAN" | "COUNT" | "METERED";
  limit_value: number | null;
  is_unlimited: boolean;
  service_area: string;
  service_identifier: string;
}

export interface EntitlementUsageRow extends EntitlementFeature {
  feature: string;
  usage: number | null;
  remaining: number | null;
  status: "included" | "unlimited" | "enabled" | "usage_unavailable" | "at_limit" | "near_limit" | "healthy";
}

export interface EntitlementSnapshot {
  profile_id: string;
  application: string;
  subscription: null | {
    id: string;
    status: "ACTIVE" | "TRIAL";
    start_date: string;
    end_date: string | null;
    trial_end_date: string | null;
    current_period_end?: string | null;
    pending_cancellation?: boolean;
    access_until?: string | null;
    billing_authorized?: boolean;
    billing_provider?: string | null;
    current_payment_status?: string | null;
    plan: { id: string; slug: string; name: string };
  };
  features: Record<string, EntitlementFeature>;
  usage_counts?: Record<string, number | null>;
  usage?: EntitlementUsageRow[];
  usage_warnings?: string[];
  coins?: {
    balance: number;
    included_allocation: number;
    monthly_allocation: number;
    purchase_rate_naira: number | null;
    rollover_enabled: boolean;
    can_top_up: boolean;
    used: number | null;
  };
}

export interface SubscriptionPlanFeature {
  id: string;
  name: string;
  slug: string;
  description?: string;
  limit_type: "BOOLEAN" | "COUNT" | "METERED";
  service_area: string;
  service_identifier: string;
  limit_value: number | null;
  is_unlimited: boolean;
}

export interface SubscriptionPlanRecord {
  id: string;
  name: string;
  slug: string;
  application: string;
  application_name: string;
  description: string;
  price: string;
  billing_cycle: "MONTHLY" | "QUARTERLY" | "YEARLY" | "ONE_TIME";
  features: SubscriptionPlanFeature[];
  is_active: boolean;
  trial_days: number;
  display_order?: number;
  is_featured?: boolean;
  intera_coins_reward: any;
  coin_purchase_rate_naira?: number | null;
  app: string;
  created_at: string;
  updated_at: string;
}

export interface StartTrialResponse {
  subscription: SubscriptionRecord;
  entitlements: EntitlementSnapshot;
  created: boolean;
  message: string;
}

export interface CoinTransactionRecord {
  id: string;
  profile: string;
  transaction_type: "EARNED" | "SPENT" | "REFUNDED" | "BONUS";
  amount: number;
  description: string;
  reference_id: string;
  balance_after: number;
  created_at: string;
}

export interface CoinTopUpResponse {
  success: boolean;
  checkout_url?: string;
  coins_amount: number;
  charge_amount?: string;
  rate: {
    naira_per_coin: number;
    minimum_coins: number;
    currency: string;
    plan_slug?: string;
  };
}
